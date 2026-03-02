import httpx
import logging
from app.services.platforms.base import BasePlatformPublisher, PublishResult

logger = logging.getLogger(__name__)

GRAPH_API = "https://graph.facebook.com/v19.0"


class InstagramPublisher(BasePlatformPublisher):
    async def publish(self, caption: str, media_url: str = None,
                      access_token: str = None, **kwargs) -> PublishResult:
        if not access_token:
            return PublishResult(success=False, error="No Instagram access token")

        ig_user_id = kwargs.get("ig_user_id")
        if not ig_user_id:
            return PublishResult(success=False, error="No Instagram user ID")

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                # Step 1: Create media container
                container_url = f"{GRAPH_API}/{ig_user_id}/media"
                params = {"access_token": access_token, "caption": caption}
                if media_url:
                    params["image_url"] = media_url
                    params["media_type"] = "IMAGE"

                r = await client.post(container_url, params=params)
                data = r.json()

                if "error" in data:
                    return PublishResult(success=False, error=data["error"].get("message", "Container creation failed"))

                creation_id = data.get("id")
                if not creation_id:
                    return PublishResult(success=False, error="No creation_id from Instagram")

                # Step 2: Publish media container
                publish_url = f"{GRAPH_API}/{ig_user_id}/media_publish"
                r2 = await client.post(publish_url, params={
                    "creation_id": creation_id,
                    "access_token": access_token,
                })
                result = r2.json()

                if "id" in result:
                    return PublishResult(success=True, external_id=result["id"])
                else:
                    return PublishResult(success=False, error=result.get("error", {}).get("message", "Publish failed"))

        except Exception as e:
            return PublishResult(success=False, error=str(e))
