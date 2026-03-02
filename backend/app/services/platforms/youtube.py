import httpx
import logging
from app.services.platforms.base import BasePlatformPublisher, PublishResult

logger = logging.getLogger(__name__)


class YouTubePublisher(BasePlatformPublisher):
    async def publish(self, caption: str, media_url: str = None,
                      access_token: str = None, **kwargs) -> PublishResult:
        if not access_token:
            return PublishResult(success=False, error="No YouTube access token")
        if not media_url:
            return PublishResult(success=False, error="YouTube requires a video URL")

        try:
            # YouTube Data API v3 - video upload metadata
            url = "https://www.googleapis.com/youtube/v3/videos?part=snippet,status"
            headers = {"Authorization": f"Bearer {access_token}"}
            body = {
                "snippet": {
                    "title": caption[:100],
                    "description": caption,
                    "tags": ["tenderzone"],
                    "categoryId": "22",
                },
                "status": {"privacyStatus": "public"},
            }
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.post(url, headers=headers, json=body)
                data = r.json()

            if "id" in data:
                return PublishResult(success=True, external_id=data["id"])
            else:
                error = data.get("error", {}).get("message", "YouTube API error")
                return PublishResult(success=False, error=error)
        except Exception as e:
            return PublishResult(success=False, error=str(e))
