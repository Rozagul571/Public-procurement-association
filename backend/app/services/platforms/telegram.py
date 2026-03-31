import httpx
import logging
from typing import Tuple
from app.services.platforms.base import BasePlatformPublisher, PublishResult
from app.config import settings

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}/{method}"


async def verify_bot_channel_access(bot_token: str, channel_id: str) -> Tuple[bool, str]:
    """Botning kanalga kirish huquqini tekshirish"""
    try:
        url = TELEGRAM_API.format(token=bot_token, method="getChat")
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, json={"chat_id": channel_id})
            data = r.json()

        if data.get("ok"):
            return True, data["result"].get("title", channel_id)
        return False, data.get("description", "Unknown error")
    except Exception as e:
        return False, str(e)


class TelegramPublisher(BasePlatformPublisher):
    async def publish(self, caption: str, media_url: str = None,
                      access_token: str = None, **kwargs) -> PublishResult:
        """Telegram kanalga post yuborish"""

        # Bot tokenini olish
        bot_token = access_token or settings.TELEGRAM_BOT_TOKEN
        channel_id = kwargs.get("channel_id")

        if not bot_token:
            return PublishResult(success=False, error="No Telegram bot token")
        if not channel_id:
            return PublishResult(success=False, error="No channel_id")

        # Kanal ID'sini to'g'rilash (agar @ bilan boshlansa)
        if channel_id.startswith("@") and not channel_id.startswith("@@"):
            channel_id = channel_id

        try:
            async with httpx.AsyncClient(timeout=40) as client:
                if media_url:
                    # Video yoki rasm?
                    video_extensions = ('.mp4', '.mov', '.avi', '.mkv', '.webm')
                    if media_url.lower().endswith(video_extensions):
                        method = "sendVideo"
                        payload = {
                            "chat_id": channel_id,
                            "video": media_url,
                            "caption": caption[:1024],  # Telegram caption limit
                            "parse_mode": "HTML"
                        }
                    else:
                        method = "sendPhoto"
                        payload = {
                            "chat_id": channel_id,
                            "photo": media_url,
                            "caption": caption[:1024],
                            "parse_mode": "HTML"
                        }
                else:
                    method = "sendMessage"
                    payload = {
                        "chat_id": channel_id,
                        "text": caption[:4096],  # Telegram message limit
                        "parse_mode": "HTML"
                    }

                url = TELEGRAM_API.format(token=bot_token, method=method)
                r = await client.post(url, json=payload)
                data = r.json()

                if data.get("ok"):
                    msg_id = str(data["result"]["message_id"])
                    return PublishResult(success=True, external_id=msg_id)
                else:
                    error_msg = data.get("description", "Telegram error")
                    logger.error(f"Telegram publish error: {error_msg}")
                    return PublishResult(success=False, error=error_msg)

        except httpx.TimeoutException:
            return PublishResult(success=False, error="Telegram API timeout")
        except Exception as e:
            logger.error(f"Telegram publish exception: {e}")
            return PublishResult(success=False, error=str(e))