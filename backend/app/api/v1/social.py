from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from datetime import datetime, timedelta

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.social_account import SocialAccountOut, OAuthInitResponse
from app.schemas.telegram_channel import TelegramChannelCreate, TelegramChannelOut
from app.repositories.social_account import SocialAccountRepository
from app.repositories.telegram_channel import TelegramChannelRepository
from app.services.oauth import google as google_oauth
from app.services.oauth import instagram as instagram_oauth
from app.services.oauth import linkedin as linkedin_oauth
from app.services.platforms.telegram import verify_bot_channel_access
from app.config import settings

router = APIRouter(prefix="/social", tags=["Social Accounts"])


# ─── ACCOUNTS ────────────────────────────────────────────────────────────────

@router.get("/accounts", response_model=List[SocialAccountOut])
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SocialAccountRepository(db)
    accounts = await repo.get_all_by_user(current_user.id)
    return [SocialAccountOut.model_validate(a) for a in accounts]


@router.delete("/accounts/{account_id}")
async def disconnect_account(
    account_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SocialAccountRepository(db)
    success = await repo.delete(account_id, current_user.id)
    await db.commit()
    if not success:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account disconnected"}


# ─── YOUTUBE ─────────────────────────────────────────────────────────────────

@router.get("/connect/youtube", response_model=OAuthInitResponse)
async def connect_youtube(current_user: User = Depends(get_current_user)):
    url = google_oauth.get_auth_url(state=str(current_user.id))
    return OAuthInitResponse(auth_url=url, platform="youtube")


@router.get("/callback/youtube")
async def youtube_callback(
    code: str = Query(None),
    state: str = Query(""),
    error: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if error or not code:
        return RedirectResponse(f"{settings.FRONTEND_URL}/platforms?error=youtube_denied")
    try:
        tokens = await google_oauth.exchange_code(code)
        access_token = tokens.get("access_token", "")
        refresh_token = tokens.get("refresh_token", "")
        expires_at = datetime.utcnow() + timedelta(seconds=tokens.get("expires_in", 3600))

        channel_info = {}
        if access_token:
            try:
                channel_info = await google_oauth.get_channel_info(access_token)
            except Exception:
                pass

        if state:
            repo = SocialAccountRepository(db)
            await repo.upsert(
                user_id=UUID(state),
                platform="youtube",
                access_token=access_token,
                refresh_token=refresh_token,
                expires_at=expires_at,
                account_name=channel_info.get("name", "YouTube Channel"),
                external_id=channel_info.get("id", ""),
            )
            await db.commit()

        return RedirectResponse(f"{settings.FRONTEND_URL}/platforms?connected=youtube&success=true")
    except Exception as e:
        return RedirectResponse(f"{settings.FRONTEND_URL}/platforms?error=youtube_failed&detail={str(e)[:80]}")


# ─── INSTAGRAM ───────────────────────────────────────────────────────────────

@router.get("/connect/instagram", response_model=OAuthInitResponse)
async def connect_instagram(current_user: User = Depends(get_current_user)):
    url = instagram_oauth.get_auth_url(state=str(current_user.id))
    return OAuthInitResponse(auth_url=url, platform="instagram")


@router.get("/callback/instagram")
async def instagram_callback(
    code: str = Query(None),
    state: str = Query(""),
    error: str = Query(None),
    error_description: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if error or not code:
        return RedirectResponse(f"{settings.FRONTEND_URL}/platforms?error=instagram_denied")
    try:
        token_data = await instagram_oauth.exchange_code(code)
        short_token = token_data.get("access_token", "")
        if not short_token:
            raise ValueError("No access token from Meta")

        long_lived = await instagram_oauth.get_long_lived_token(short_token)
        access_token = long_lived.get("access_token", short_token)
        expires_at = datetime.utcnow() + timedelta(seconds=long_lived.get("expires_in", 5183944))

        ig_info = {}
        try:
            ig_info = await instagram_oauth.get_ig_business_account(access_token)
        except Exception:
            pass

        if state:
            repo = SocialAccountRepository(db)
            await repo.upsert(
                user_id=UUID(state),
                platform="instagram",
                access_token=ig_info.get("page_token", access_token),
                expires_at=expires_at,
                account_name="Instagram Business",
                external_id=ig_info.get("ig_user_id", ""),
            )
            await db.commit()

        return RedirectResponse(f"{settings.FRONTEND_URL}/platforms?connected=instagram&success=true")
    except Exception as e:
        return RedirectResponse(f"{settings.FRONTEND_URL}/platforms?error=instagram_failed&detail={str(e)[:80]}")


# ─── LINKEDIN ────────────────────────────────────────────────────────────────

@router.get("/connect/linkedin", response_model=OAuthInitResponse)
async def connect_linkedin(current_user: User = Depends(get_current_user)):
    url = linkedin_oauth.get_auth_url(state=str(current_user.id))
    return OAuthInitResponse(auth_url=url, platform="linkedin")


@router.get("/callback/linkedin")
async def linkedin_callback(
    code: str = Query(None),
    state: str = Query(""),
    error: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if error or not code:
        return RedirectResponse(f"{settings.FRONTEND_URL}/platforms?error=linkedin_denied")
    try:
        tokens = await linkedin_oauth.exchange_code(code)
        access_token = tokens.get("access_token", "")
        expires_at = datetime.utcnow() + timedelta(seconds=tokens.get("expires_in", 5184000))

        profile = {}
        try:
            profile = await linkedin_oauth.get_profile(access_token)
        except Exception:
            pass

        if state:
            repo = SocialAccountRepository(db)
            await repo.upsert(
                user_id=UUID(state),
                platform="linkedin",
                access_token=access_token,
                expires_at=expires_at,
                account_name=profile.get("name", "LinkedIn User"),
                external_id=profile.get("id", ""),
            )
            await db.commit()

        return RedirectResponse(f"{settings.FRONTEND_URL}/platforms?connected=linkedin&success=true")
    except Exception as e:
        return RedirectResponse(f"{settings.FRONTEND_URL}/platforms?error=linkedin_failed&detail={str(e)[:80]}")


# ─── TELEGRAM ────────────────────────────────────────────────────────────────

@router.post("/telegram/channels", response_model=TelegramChannelOut, status_code=201)
async def add_telegram_channel(
    data: TelegramChannelCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bot_token = data.bot_token or settings.TELEGRAM_BOT_TOKEN
    if not bot_token:
        raise HTTPException(
            status_code=400,
            detail="TELEGRAM_BOT_TOKEN .env faylda sozlanmagan. Bot token kiriting.",
        )

    ok, channel_name = await verify_bot_channel_access(bot_token, data.channel_id)
    if not ok:
        raise HTTPException(
            status_code=400,
            detail=f"Bot kanalga kira olmadi: {channel_name}. "
                   f"Botni kanal admini qiling (Post Messages huquqi bilan).",
        )

    repo = TelegramChannelRepository(db)
    ch = await repo.create(
        user_id=current_user.id,
        channel_id=data.channel_id,
        bot_token=data.bot_token,
        channel_username=data.channel_username,
        channel_name=data.channel_name or channel_name,
    )
    await db.commit()
    await db.refresh(ch)
    return TelegramChannelOut.model_validate(ch)


@router.get("/telegram/channels", response_model=List[TelegramChannelOut])
async def list_telegram_channels(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TelegramChannelRepository(db)
    channels = await repo.get_all_by_user(current_user.id)
    return [TelegramChannelOut.model_validate(c) for c in channels]


@router.delete("/telegram/channels/{channel_id}")
async def delete_telegram_channel(
    channel_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TelegramChannelRepository(db)
    success = await repo.delete(channel_id, current_user.id)
    await db.commit()
    if not success:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"message": "Telegram channel removed"}
