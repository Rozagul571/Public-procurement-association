import httpx
import logging
from app.services.platforms.base import BasePlatformPublisher, PublishResult

logger = logging.getLogger(__name__)


class LinkedInPublisher(BasePlatformPublisher):
    async def publish(self, caption: str, media_url: str = None,
                      access_token: str = None, **kwargs) -> PublishResult:
        if not access_token:
            return PublishResult(success=False, error="No LinkedIn access token")

        person_urn = kwargs.get("person_urn")
        if not person_urn:
            return PublishResult(success=False, error="No LinkedIn person URN")

        try:
            url = "https://api.linkedin.com/v2/ugcPosts"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            }
            body = {
                "author": person_urn,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {"text": caption},
                        "shareMediaCategory": "NONE",
                    }
                },
                "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
            }

            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.post(url, headers=headers, json=body)
                data = r.json()

            if r.status_code in (200, 201):
                post_id = data.get("id", "")
                return PublishResult(success=True, external_id=post_id)
            else:
                error = data.get("message", f"LinkedIn error: {r.status_code}")
                return PublishResult(success=False, error=error)
        except Exception as e:
            return PublishResult(success=False, error=str(e))
