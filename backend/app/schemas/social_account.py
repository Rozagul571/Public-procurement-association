from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class SocialAccountOut(BaseModel):
    id: UUID
    platform: str
    account_name: Optional[str] = None
    account_external_id: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_active: bool

    model_config = {"from_attributes": True}


class OAuthInitResponse(BaseModel):
    auth_url: str
    platform: str
