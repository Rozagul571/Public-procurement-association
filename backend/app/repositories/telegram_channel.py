from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from typing import Optional, List
from app.models.telegram_channel import TelegramChannel
from app.core.encryption import encrypt_token, decrypt_token


class TelegramChannelRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_by_user(self, user_id: UUID) -> List[TelegramChannel]:
        result = await self.db.execute(
            select(TelegramChannel).where(
                and_(TelegramChannel.user_id == user_id, TelegramChannel.is_active == True)
            )
        )
        return result.scalars().all()

    async def get_by_id(self, channel_id: UUID) -> Optional[TelegramChannel]:
        result = await self.db.execute(
            select(TelegramChannel).where(TelegramChannel.id == channel_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        user_id: UUID,
        channel_id: str,
        bot_token: str = None,
        channel_username: str = None,
        channel_name: str = None,
    ) -> TelegramChannel:
        ch = TelegramChannel(
            user_id=user_id,
            channel_id=channel_id,
            bot_token_encrypted=encrypt_token(bot_token) if bot_token else None,
            channel_username=channel_username,
            channel_name=channel_name,
        )
        self.db.add(ch)
        await self.db.flush()
        await self.db.refresh(ch)
        return ch

    def get_bot_token(self, channel: TelegramChannel) -> Optional[str]:
        if channel.bot_token_encrypted:
            return decrypt_token(channel.bot_token_encrypted)
        return None

    async def delete(self, channel_id: UUID, user_id: UUID) -> bool:
        ch = await self.get_by_id(channel_id)
        if not ch or ch.user_id != user_id:
            return False
        await self.db.delete(ch)
        return True
