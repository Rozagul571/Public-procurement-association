from app.services.platforms.base import BasePlatformPublisher
from app.services.platforms.telegram import TelegramPublisher
from app.services.platforms.youtube import YouTubePublisher
from app.services.platforms.instagram import InstagramPublisher
from app.services.platforms.linkedin import LinkedInPublisher


class PlatformFactory:
    _publishers = {
        "telegram": TelegramPublisher,
        "youtube": YouTubePublisher,
        "instagram": InstagramPublisher,
        "linkedin": LinkedInPublisher,
    }

    @classmethod
    def get(cls, platform: str) -> BasePlatformPublisher:
        publisher_class = cls._publishers.get(platform)
        if not publisher_class:
            raise ValueError(f"Unknown platform: {platform}")
        return publisher_class()
