from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from app.models.post import Post, PlatformPost, PostStatus, PublishStatus


class PostRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: UUID,
        caption: str,
        media_url: str = None,
        media_type: str = None,
        scheduled_time: datetime = None,
    ) -> Post:
        post = Post(
            created_by=user_id,
            caption=caption,
            media_url=media_url,
            media_type=media_type,
            scheduled_time=scheduled_time,
            status=PostStatus.scheduled if scheduled_time else PostStatus.draft,
        )
        self.db.add(post)
        await self.db.flush()
        await self.db.refresh(post)
        return post

    async def add_platform_post(
        self,
        post_id: UUID,
        platform: str,
        social_account_id: UUID = None,      # YouTube, Instagram, LinkedIn
        telegram_channel_id: UUID = None,    # Telegram kanallar uchun
    ) -> PlatformPost:
        pp = PlatformPost(
            post_id=post_id,
            platform=platform,
            social_account_id=social_account_id,       # social_accounts jadvaliga FK
            telegram_channel_id=telegram_channel_id,   # telegram_channels jadvaliga murojaat (FK emas)
        )
        self.db.add(pp)
        await self.db.flush()
        return pp

    async def get_by_id(self, post_id: UUID) -> Optional[Post]:
        result = await self.db.execute(
            select(Post)
            .options(selectinload(Post.platform_posts))
            .where(Post.id == post_id)
        )
        return result.scalar_one_or_none()

    async def get_all_by_user(self, user_id: UUID) -> List[Post]:
        result = await self.db.execute(
            select(Post)
            .options(selectinload(Post.platform_posts))
            .where(Post.created_by == user_id)
            .order_by(Post.created_at.desc())
        )
        return result.scalars().all()

    async def get_due_scheduled_posts(self) -> List[Post]:
        result = await self.db.execute(
            select(Post)
            .options(selectinload(Post.platform_posts))
            .where(
                and_(
                    Post.status == PostStatus.scheduled,
                    Post.scheduled_time <= datetime.utcnow(),
                )
            )
        )
        return result.scalars().all()

    async def update_status(self, post_id: UUID, status: str) -> None:
        post = await self.get_by_id(post_id)
        if post:
            post.status = status
            post.updated_at = datetime.utcnow()

    async def update_platform_post(
        self,
        pp_id: UUID,
        status: str,
        external_id: str = None,
        error: str = None,
    ) -> None:
        result = await self.db.execute(
            select(PlatformPost).where(PlatformPost.id == pp_id)
        )
        pp = result.scalar_one_or_none()
        if pp:
            pp.publish_status = status
            if external_id:
                pp.external_post_id = external_id
            if error:
                pp.error_message = error
            if status == PublishStatus.published:
                pp.published_at = datetime.utcnow()
            pp.updated_at = datetime.utcnow()

    async def delete(self, post_id: UUID, user_id: UUID) -> bool:
        post = await self.get_by_id(post_id)
        if not post or post.created_by != user_id:
            return False
        await self.db.delete(post)
        return True