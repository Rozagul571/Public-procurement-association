from cryptography.fernet import Fernet
from app.config import settings


def _fernet() -> Fernet:
    key = settings.ENCRYPTION_KEY
    if isinstance(key, str):
        key = key.encode()
    try:
        return Fernet(key)
    except Exception:
        return Fernet(Fernet.generate_key())


def encrypt_token(token: str) -> str:
    if not token:
        return ""
    try:
        return _fernet().encrypt(token.encode()).decode()
    except Exception:
        return token


def decrypt_token(encrypted: str) -> str:
    if not encrypted:
        return ""
    try:
        return _fernet().decrypt(encrypted.encode()).decode()
    except Exception:
        return encrypted
