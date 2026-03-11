from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
import os

app = FastAPI(title="DXIU API", version="2.0.0", docs_url="/docs", redoc_url="/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://tenderzonemarketing.uz",
        "https://tenderzonemarketing.uz",
        "http://www.tenderzonemarketing.uz",
        "https://www.tenderzonemarketing.uz",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

from app.api.v1 import auth, posts, social, stats
app.include_router(auth.router, prefix="/api/v1")
app.include_router(posts.router, prefix="/api/v1")
app.include_router(social.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")

@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
