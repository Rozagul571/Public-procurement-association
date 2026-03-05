from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "TenderZone"
    APP_ENV: str = "production"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    DATABASE_URL: str
    SYNC_DATABASE_URL: str
    REDIS_URL: str
    ENCRYPTION_KEY: str

    PUBLIC_URL_BASE: str = "https://tenderzonemarketing.uz"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""

    INSTAGRAM_APP_ID: str = ""
    INSTAGRAM_APP_SECRET: str = ""
    INSTAGRAM_REDIRECT_URI: str = ""

    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    LINKEDIN_REDIRECT_URI: str = ""

    TELEGRAM_BOT_TOKEN: str = ""
    FRONTEND_URL: str = ""
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 104857600

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()