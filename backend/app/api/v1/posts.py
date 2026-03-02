import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.post import Post, PostStatus, PublishStatus
from app.schemas.post import PostCreate, PostUpdate, PostOut
from app.repositories.post import PostRepository
from app.repositories.social_account import SocialAccountRepository
from app.repositories.telegram_channel import TelegramChannelRepository
from app.services.platforms.factory import PlatformFactory
from app.config import settings

router = APIRouter(prefix="/posts", tags=["Posts"])


# ─── Helper: Post + platform_posts eager load ─────────────────────────────────

async def _get_post_with_platforms(db: AsyncSession, post_id: UUID) -> Post | None:
    """platform_posts eager load bilan post olish (MissingGreenlet oldini oladi)."""
    result = await db.execute(
        select(Post)
        .options(selectinload(Post.platform_posts))
        .where(Post.id == post_id)
    )
    return result.scalar_one_or_none()


# ─── Background publish ────────────────────────────────────────────────────────

async def _do_publish(post_id: UUID, _unused):
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        post_repo = PostRepository(db)
        social_repo = SocialAccountRepository(db)
        tg_repo = TelegramChannelRepository(db)

        post = await post_repo.get_by_id(post_id)
        if not post:
            return

        await post_repo.update_status(post_id, PostStatus.publishing)
        await db.commit()

        all_success = True

        for pp in post.platform_posts:
            if pp.publish_status == PublishStatus.published:
                continue

            await post_repo.update_platform_post(pp.id, PublishStatus.publishing)
            await db.commit()

            try:
                publisher = PlatformFactory.get(pp.platform)
                access_token = None
                kwargs = {}

                if pp.platform == "telegram":
                    if pp.telegram_channel_id:
                        ch = await tg_repo.get_by_id(pp.telegram_channel_id)
                        if ch:
                            kwargs["channel_id"] = ch.channel_id
                            access_token = tg_repo.get_bot_token(ch) or settings.TELEGRAM_BOT_TOKEN
                        else:
                            access_token = settings.TELEGRAM_BOT_TOKEN
                    else:
                        access_token = settings.TELEGRAM_BOT_TOKEN
                else:
                    if pp.social_account_id:
                        account = await social_repo.get_by_id(pp.social_account_id)
                        if account:
                            access_token = social_repo.get_access_token(account)
                            if pp.platform == "instagram":
                                kwargs["ig_user_id"] = account.account_external_id
                            elif pp.platform == "linkedin":
                                kwargs["person_urn"] = f"urn:li:person:{account.account_external_id}"

                result = await publisher.publish_with_retry(
                    caption=post.caption,
                    media_url=post.media_url,
                    access_token=access_token,
                    **kwargs,
                )

                if result.success:
                    await post_repo.update_platform_post(
                        pp.id, PublishStatus.published, external_id=result.external_id
                    )
                else:
                    all_success = False
                    await post_repo.update_platform_post(pp.id, PublishStatus.failed, error=result.error)

            except Exception as e:
                all_success = False
                await post_repo.update_platform_post(pp.id, PublishStatus.failed, error=str(e))

            await db.commit()

        final = PostStatus.published if all_success else PostStatus.failed
        await post_repo.update_status(post_id, final)
        await db.commit()


# ─── Upload Media ──────────────────────────────────────────────────────────────

@router.post("/upload-media")
async def upload_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif", ".mp4", ".mov", ".avi"]:
        raise HTTPException(status_code=400, detail="Qo'llab-quvvatlanmaydigan format")

    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Fayl juda katta")
        await f.write(content)

    media_type = "image" if ext in [".jpg", ".jpeg", ".png", ".gif"] else "video"
    media_url = f"http://localhost:8000/uploads/{filename}"
    return {"media_url": media_url, "media_type": media_type, "filename": filename}


# ─── Create Post ───────────────────────────────────────────────────────────────

@router.post("/", response_model=PostOut, status_code=201)
async def create_post(
    data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post_repo = PostRepository(db)
    social_repo = SocialAccountRepository(db)
    tg_repo = TelegramChannelRepository(db)

    try:
        post = await post_repo.create(
            user_id=current_user.id,
            caption=data.caption,
            media_url=data.media_url,
            media_type=data.media_type,
            scheduled_time=data.scheduled_time,
        )

        # Telegram kanallar
        for tg_id in (data.telegram_channel_ids or []):
            try:
                ch = await tg_repo.get_by_id(UUID(tg_id))
                if ch and ch.user_id == current_user.id:
                    await post_repo.add_platform_post(
                        post.id,
                        "telegram",
                        telegram_channel_id=ch.id,
                    )
            except (ValueError, Exception):
                pass

        # OAuth platformalar
        for platform_key in (data.platforms or []):
            if platform_key == "telegram":
                continue
            account = await social_repo.get_by_platform(current_user.id, platform_key)
            if account:
                await post_repo.add_platform_post(
                    post.id,
                    platform_key,
                    social_account_id=account.id,
                )
            else:
                await post_repo.add_platform_post(post.id, platform_key)

        await db.commit()

        # ← MissingGreenlet FIX: selectinload bilan qayta o'qish
        refreshed = await _get_post_with_platforms(db, post.id)
        return PostOut.model_validate(refreshed)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Post yaratishda xato: {str(e)}")


# ─── List Posts ────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[PostOut])
async def list_posts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = PostRepository(db)
    posts = await repo.get_all_by_user(current_user.id)
    return [PostOut.model_validate(p) for p in posts]


# ─── Get Post ──────────────────────────────────────────────────────────────────

@router.get("/{post_id}", response_model=PostOut)
async def get_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _get_post_with_platforms(db, post_id)
    if not post or post.created_by != current_user.id:
        raise HTTPException(status_code=404, detail="Post topilmadi")
    return PostOut.model_validate(post)


# ─── Delete Post ───────────────────────────────────────────────────────────────

@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = PostRepository(db)
    success = await repo.delete(post_id, current_user.id)
    await db.commit()
    if not success:
        raise HTTPException(status_code=404, detail="Post topilmadi")


# ─── Publish Now ───────────────────────────────────────────────────────────────

@router.post("/{post_id}/publish-now")
async def publish_now(
    post_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _get_post_with_platforms(db, post_id)
    if not post or post.created_by != current_user.id:
        raise HTTPException(status_code=404, detail="Post topilmadi")

    background_tasks.add_task(_do_publish, post_id, None)
    return {"message": "Publishing boshlandi", "post_id": str(post_id)}


# ─── Schedule Post ─────────────────────────────────────────────────────────────

@router.post("/{post_id}/schedule")
async def schedule_post(
    post_id: UUID,
    scheduled_time: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime
    post = await _get_post_with_platforms(db, post_id)
    if not post or post.created_by != current_user.id:
        raise HTTPException(status_code=404, detail="Post topilmadi")

    post.scheduled_time = datetime.fromisoformat(scheduled_time)
    post.status = PostStatus.scheduled
    await db.commit()
    return {"message": "Post rejalashtirildi", "scheduled_time": scheduled_time}


# ─── Platform Status ───────────────────────────────────────────────────────────

@router.get("/{post_id}/platform-status")
async def platform_status(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _get_post_with_platforms(db, post_id)
    if not post or post.created_by != current_user.id:
        raise HTTPException(status_code=404, detail="Post topilmadi")

    return {
        "post_id": str(post_id),
        "post_status": post.status,
        "platforms": [
            {
                "platform": pp.platform,
                "status": pp.publish_status,
                "external_id": pp.external_post_id,
                "error": pp.error_message,
                "published_at": pp.published_at.isoformat() if pp.published_at else None,
            }
            for pp in post.platform_posts
        ],
    }