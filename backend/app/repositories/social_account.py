from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from app.models.social_account import SocialAccount
from app.core.encryption import encrypt_token, decrypt_token


class SocialAccountRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_by_user(self, user_id: UUID) -> List[SocialAccount]:
        result = await self.db.execute(
            select(SocialAccount).where(
                and_(SocialAccount.user_id == user_id, SocialAccount.is_active == True)
            )
        )
        return result.scalars().all()

    async def get_by_platform(self, user_id: UUID, platform: str) -> Optional[SocialAccount]:
        result = await self.db.execute(
            select(SocialAccount).where(
                and_(
                    SocialAccount.user_id == user_id,
                    SocialAccount.platform == platform,
                    SocialAccount.is_active == True,
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, account_id: UUID) -> Optional[SocialAccount]:
        result = await self.db.execute(
            select(SocialAccount).where(SocialAccount.id == account_id)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self,
        user_id: UUID,
        platform: str,
        access_token: str,
        refresh_token: str = "",        # ← social.py dan keladi
        expires_at: datetime = None,
        account_name: str = "",         # ← social.py dan keladi
        external_id: str = "",          # ← social.py dan keladi
        metadata: dict = None,
    ) -> SocialAccount:
        existing = await self.get_by_platform(user_id, platform)
        if existing:
            existing.access_token_encrypted = encrypt_token(access_token)
            if refresh_token:
                existing.refresh_token_encrypted = encrypt_token(refresh_token)
            existing.expires_at = expires_at
            if account_name:
                existing.account_name = account_name
            if external_id:
                existing.account_external_id = external_id
            if metadata:
                existing.meta = metadata
            existing.updated_at = datetime.utcnow()
            return existing

        account = SocialAccount(
            user_id=user_id,
            platform=platform,
            access_token_encrypted=encrypt_token(access_token),
            refresh_token_encrypted=encrypt_token(refresh_token) if refresh_token else None,
            expires_at=expires_at,
            account_name=account_name or None,
            account_external_id=external_id or None,
            meta=metadata or {},
        )
        self.db.add(account)
        await self.db.flush()
        await self.db.refresh(account)
        return account

    def get_access_token(self, account: SocialAccount) -> str:
        return decrypt_token(account.access_token_encrypted or "")

    async def delete(self, account_id: UUID, user_id: UUID) -> bool:
        account = await self.get_by_id(account_id)
        if not account or account.user_id != user_id:
            return False
        await self.db.delete(account)
        return True