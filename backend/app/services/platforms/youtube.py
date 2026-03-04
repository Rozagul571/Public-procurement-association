import httpx
import logging
from app.services.platforms.base import BasePlatformPublisher, PublishResult
from app.config import settings

logger = logging.getLogger(__name__)


class YouTubePublisher(BasePlatformPublisher):
    async def publish(self, caption: str, media_url: str = None,
                      access_token: str = None, **kwargs) -> PublishResult:
        if not access_token:
            return PublishResult(success=False, error="No YouTube access token")
        if not media_url:
            return PublishResult(success=False, error="Video URL required")

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                # 1. Resumable session boshlash
                init_url = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json; charset=UTF-8",
                }
                # Caption bo'sh bo'lmasligi uchun default qo'yamiz
                title = (caption or "Untitled Video")[:100].strip()
                if not title:
                    title = "Uploaded via TenderZone"

                body = {
                    "snippet": {
                        "title": title,
                        "description": caption or "No description provided",
                        "tags": ["tenderzone", "automation", "python"],
                        "categoryId": "22",  # People & Blogs - majburiy emas, lekin yaxshi ishlaydi
                    },
                    "status": {
                        "privacyStatus": "public",  # yoki "private" / "unlisted"
                        "madeForKids": False
                    }
                }

                logger.info(f"YouTube init request body: {body}")

                r = await client.post(init_url, headers=headers, json=body)

                logger.info(f"YouTube init response status: {r.status_code}")
                logger.info(f"YouTube init response text: {r.text[:500]}")  # to'liq javobni ko'rish uchun

                if r.status_code != 200:
                    error_data = r.json()
                    return PublishResult(success=False,
                                         error=f"Init failed (400): {error_data.get('error', {}).get('message', r.text)}")

                upload_url = r.headers.get("Location")
                if not upload_url:
                    return PublishResult(success=False, error="No resumable upload URL received")

                # 2. Video yuklash
                video_response = await client.get(media_url, timeout=120)
                if video_response.status_code != 200:
                    return PublishResult(success=False,
                                         error=f"Cannot download video: {video_response.status_code} - {media_url}")

                video_data = video_response.content
                logger.info(f"Video size downloaded: {len(video_data)} bytes")

                upload_headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "video/*",  # mp4 uchun video/mp4 yoki video/*
                    "Content-Length": str(len(video_data)),
                }

                r2 = await client.put(upload_url, headers=upload_headers, content=video_data)

                logger.info(f"YouTube upload final status: {r2.status_code}")
                logger.info(f"YouTube upload response: {r2.text[:500]}")

                if r2.status_code in (200, 201):
                    data = r2.json()
                    video_id = data.get("id")
                    return PublishResult(success=True, external_id=video_id)
                else:
                    error = r2.json().get("error", {})
                    return PublishResult(success=False, error=f"Upload failed: {error.get('message', r2.text)}")

        except Exception as e:
            logger.exception("YouTube publish exception")
            return PublishResult(success=False, error=str(e))