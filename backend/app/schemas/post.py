from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class PostCreate(BaseModel):
    caption: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    platforms: List[str] = []          # e.g. ["telegram:-1001234567890", "youtube", "instagram"]
    telegram_channel_ids: List[str] = []  # telegram channel UUIDs


class PostUpdate(BaseModel):
    caption: Optional[str] = None
    scheduled_time: Optional[datetime] = None


class PlatformPostOut(BaseModel):
    id: UUID
    platform: str
    publish_status: str
    external_post_id: Optional[str] = None
    error_message: Optional[str] = None
    published_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PostOut(BaseModel):
    id: UUID
    caption: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    status: str
    created_at: datetime
    platform_posts: List[PlatformPostOut] = []

    model_config = {"from_attributes": True}
