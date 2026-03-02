import httpx
import logging
from typing import Tuple
from app.services.platforms.base import BasePlatformPublisher, PublishResult
from app.config import settings

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}/{method}"


async def verify_bot_channel_access(bot_token: str, channel_id: str) -> Tuple[bool, str]:
    """Bot kanalga kirish huquqini tekshiradi. (ok, channel_name) qaytaradi."""
    try:
        url = TELEGRAM_API.format(token=bot_token, method="getChat")
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, json={"chat_id": channel_id})
            data = r.json()

        if data.get("ok"):
            chat = data["result"]
            return True, chat.get("title", channel_id)
        else:
            return False, data.get("description", "Unknown error")
    except Exception as e:
        return False, str(e)


class TelegramPublisher(BasePlatformPublisher):
    async def publish(self, caption: str, media_url: str = None,
                      access_token: str = None, **kwargs) -> PublishResult:
        bot_token = access_token or settings.TELEGRAM_BOT_TOKEN
        channel_id = kwargs.get("channel_id")

        if not bot_token:
            return PublishResult(success=False, error="No Telegram bot token configured")
        if not channel_id:
            return PublishResult(success=False, error="No channel_id provided")

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                if media_url:
                    method = "sendPhoto"
                    payload = {"chat_id": channel_id, "photo": media_url, "caption": caption}
                else:
                    method = "sendMessage"
                    payload = {"chat_id": channel_id, "text": caption, "parse_mode": "HTML"}

                url = TELEGRAM_API.format(token=bot_token, method=method)
                r = await client.post(url, json=payload)
                data = r.json()

            if data.get("ok"):
                msg_id = str(data["result"]["message_id"])
                logger.info(f"Telegram published: message_id={msg_id}")
                return PublishResult(success=True, external_id=msg_id)
            else:
                err = data.get("description", "Telegram API error")
                return PublishResult(success=False, error=err)
        except Exception as e:
            return PublishResult(success=False, error=str(e))
