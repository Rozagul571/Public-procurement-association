from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import aiofiles
import uuid
from app.config import settings

app = FastAPI(title="DXIU API", version="2.0.0", docs_url="/docs", redoc_url="/redoc")

# CORS sozlamalari - to'liq va to'g'ri
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://tendermarketing.uz",
        "https://www.tendermarketing.uz",
        "http://tendermarketing.uz",
        "http://www.tendermarketing.uz",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Upload papkasini yaratish
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# Media yuklash endpoint
@app.post("/api/v1/posts/upload-media")
async def upload_media(file: UploadFile = File(...)):
    """Fayl yuklash endpointi - hajmini tekshirish bilan"""

    # Fayl hajmini tekshirish
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Fayl hajmi {settings.MAX_FILE_SIZE // (1024 * 1024)}MB dan katta"
        )

    # Fayl turini aniqlash
    content_type = file.content_type or ""
    media_type = "image" if content_type.startswith("image/") else "video" if content_type.startswith(
        "video/") else "file"

    # Faylni saqlash
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    safe_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    async with aiofiles.open(file_path, "wb") as buffer:
        content = await file.read()
        await buffer.write(content)

    media_url = f"{settings.PUBLIC_URL_BASE}/uploads/{safe_filename}"

    return {
        "media_url": media_url,
        "media_type": media_type,
        "filename": safe_filename,
        "size": file_size
    }


# Routerlarni ulash
from app.api.v1 import auth, posts, social, stats

app.include_router(auth.router, prefix="/api/v1")
app.include_router(posts.router, prefix="/api/v1")
app.include_router(social.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}