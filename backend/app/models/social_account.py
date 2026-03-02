import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    account_name: Mapped[str] = mapped_column(String(200), nullable=True)
    account_external_id: Mapped[str] = mapped_column(String(200), nullable=True)

    access_token_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
    refresh_token_encrypted: Mapped[str] = mapped_column(Text, nullable=True)

    meta: Mapped[dict] = mapped_column(JSON, default=dict)   # 👈 to‘g‘ri
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="social_accounts")
# import uuid
# from datetime import datetime
# from enum import Enum as PyEnum
# from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text, Enum
# from sqlalchemy.dialects.postgresql import UUID
# from sqlalchemy.orm import Mapped, mapped_column, relationship
# from app.database import Base
#
#
# class Platform(str, PyEnum):
#     youtube = "youtube"
#     instagram = "instagram"
#     linkedin = "linkedin"
#     telegram = "telegram"
#
#
# class SocialAccount(Base):
#     __tablename__ = "social_accounts"
#
#     id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
#     platform: Mapped[str] = mapped_column(String(50), nullable=False)
#     account_name: Mapped[str] = mapped_column(String(200), nullable=True)
#     account_external_id: Mapped[str] = mapped_column(String(200), nullable=True)
#     access_token_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
#     refresh_token_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
#     expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
#     is_active: Mapped[bool] = mapped_column(Boolean, default=True)
#     created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
#     updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
#
#     user: Mapped["User"] = relationship("User", back_populates="social_accounts")
