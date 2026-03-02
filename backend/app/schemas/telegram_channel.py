from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class TelegramChannelCreate(BaseModel):
    channel_id: str
    channel_username: Optional[str] = None
    channel_name: Optional[str] = None
    bot_token: Optional[str] = None


class TelegramChannelOut(BaseModel):
    id: UUID
    channel_id: str
    channel_username: Optional[str] = None
    channel_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
