import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"🚀 TenderZone started — {settings.APP_ENV}")
    yield
    await engine.dispose()


app = FastAPI(
    title="TenderZone API",
    description="Social Media Automation Platform",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

from app.api.v1.auth import router as auth_router
from app.api.v1.social import router as social_router
from app.api.v1.posts import router as posts_router
from app.api.v1.stats import router as stats_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(social_router, prefix="/api/v1")
app.include_router(posts_router, prefix="/api/v1")
app.include_router(stats_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/")
async def root():
    return {"message": "TenderZone API v2.0", "docs": "/docs"}
