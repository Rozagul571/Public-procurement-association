from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
import asyncio
import logging

logger = logging.getLogger(__name__)


@dataclass
class PublishResult:
    success: bool
    external_id: Optional[str] = None
    error: Optional[str] = None


class BasePlatformPublisher(ABC):
    @abstractmethod
    async def publish(self, caption: str, media_url: str = None,
                      access_token: str = None, **kwargs) -> PublishResult:
        pass

    async def publish_with_retry(self, caption: str, media_url: str = None,
                                  access_token: str = None, max_retries: int = 3, **kwargs) -> PublishResult:
        last_error = None
        for attempt in range(1, max_retries + 1):
            try:
                result = await self.publish(caption=caption, media_url=media_url,
                                            access_token=access_token, **kwargs)
                if result.success:
                    return result
                last_error = result.error
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Attempt {attempt}/{max_retries} failed: {e}")
                if attempt < max_retries:
                    await asyncio.sleep(2 ** attempt)

        return PublishResult(success=False, error=last_error)
