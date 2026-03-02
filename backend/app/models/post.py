import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class PostStatus:
    draft = "draft"
    scheduled = "scheduled"
    publishing = "publishing"
    published = "published"
    failed = "failed"


class PublishStatus:
    pending = "pending"
    publishing = "publishing"
    published = "published"
    failed = "failed"
    skipped = "skipped"


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    caption: Mapped[str] = mapped_column(Text, nullable=False)
    media_url: Mapped[str] = mapped_column(String(500), nullable=True)
    media_type: Mapped[str] = mapped_column(String(50), nullable=True)
    scheduled_time: Mapped[datetime] = mapped_column(DateTime, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), default=PostStatus.draft, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author: Mapped["User"] = relationship("User", back_populates="posts")
    platform_posts: Mapped[list["PlatformPost"]] = relationship(
        "PlatformPost", back_populates="post", cascade="all, delete-orphan"
    )


class PlatformPost(Base):
    __tablename__ = "platform_posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"))

    # OAuth platformalar uchun (youtube, instagram, linkedin)
    social_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("social_accounts.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Telegram kanallar uchun (alohida jadval - FK emas, oddiy UUID)
    telegram_channel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )

    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    publish_status: Mapped[str] = mapped_column(String(50), default=PublishStatus.pending)
    external_post_id: Mapped[str] = mapped_column(String(200), nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    published_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    post: Mapped["Post"] = relationship("Post", back_populates="platform_posts")