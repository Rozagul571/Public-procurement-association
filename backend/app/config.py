from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "TenderZone"
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    DATABASE_URL: str = "postgresql+asyncpg://postgres:1@localhost:5432/tenderzone_db"
    SYNC_DATABASE_URL: str = "postgresql://postgres:1@localhost:5432/tenderzone_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    ENCRYPTION_KEY: str = "ZmDfcTF7_60GrrY167zsiPd67pEvs0aGOv2oasOM1Pg="

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/social/callback/youtube"

    INSTAGRAM_APP_ID: str = ""
    INSTAGRAM_APP_SECRET: str = ""
    INSTAGRAM_REDIRECT_URI: str = "http://localhost:8000/api/v1/social/callback/instagram"

    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    LINKEDIN_REDIRECT_URI: str = "http://localhost:8000/api/v1/social/callback/linkedin"

    TELEGRAM_BOT_TOKEN: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 104857600

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
