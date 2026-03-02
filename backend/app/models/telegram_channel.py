import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class TelegramChannel(Base):
    __tablename__ = "telegram_channels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    bot_token_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
    channel_id: Mapped[str] = mapped_column(String(100), nullable=False)
    channel_username: Mapped[str] = mapped_column(String(100), nullable=True)
    channel_name: Mapped[str] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="telegram_channels")
