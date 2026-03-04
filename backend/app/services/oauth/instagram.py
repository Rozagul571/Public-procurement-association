# backend/app/services/oauth/instagram.py
import httpx
from urllib.parse import urlencode
from app.config import settings

GRAPH_API = "https://graph.facebook.com/v19.0"
FB_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth"
FB_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token"
FB_LONG_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token"

SCOPES = [
    "pages_show_list",
    "business_management",
    "instagram_basic",
    "instagram_content_publish",
    "public_profile",
]


def get_auth_url(state: str = "") -> str:
    """Instagram (Meta) OAuth login URL sini qaytaradi"""
    params = {
        "client_id": settings.INSTAGRAM_APP_ID,
        "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
        "response_type": "code",
        "scope": ",".join(SCOPES),
        "state": state,
    }
    return f"{FB_AUTH_URL}?{urlencode(params)}"


async def exchange_code(code: str) -> dict:
    """Code ni short-lived access token ga aylantiradi"""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(
            FB_TOKEN_URL,
            params={
                "client_id": settings.INSTAGRAM_APP_ID,
                "client_secret": settings.INSTAGRAM_APP_SECRET,
                "code": code,
                "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
                "grant_type": "authorization_code",
            }
        )
        return r.json()


async def get_long_lived_token(short_token: str) -> dict:
    """Short-lived tokenni long-lived (60 kun) ga aylantiradi"""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(
            FB_LONG_TOKEN_URL,
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.INSTAGRAM_APP_ID,
                "client_secret": settings.INSTAGRAM_APP_SECRET,
                "fb_exchange_token": short_token,
            }
        )
        return r.json()


async def get_ig_business_account(access_token: str) -> dict:
    """Facebook Page orqali bog'langan Instagram Business Account ID ni oladi"""
    async with httpx.AsyncClient(timeout=30) as client:
        # 1. Foydalanuvchining Page'larini olish
        r = await client.get(
            f"{GRAPH_API}/me/accounts",
            params={
                "access_token": access_token,
                "fields": "id,name,instagram_business_account,access_token"
            }
        )
        data = r.json()

        if "error" in data:
            raise ValueError(f"Meta API xatosi: {data['error']}")

        for page in data.get("data", []):
            ig = page.get("instagram_business_account")
            if ig and ig.get("id"):
                return {
                    "ig_user_id": ig["id"],
                    "page_id": page["id"],
                    "page_name": page.get("name"),
                    "page_token": page.get("access_token", access_token),
                }
    raise ValueError("Instagram Business Account topilmadi. Akkaunt Business/Creator bo'lishi va Facebook Page bilan bog'lanishi kerak.")
# import httpx
# from app.config import settings
#
# FB_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth"
# FB_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token"
# FB_LONG_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token"
# GRAPH_API = "https://graph.facebook.com/v19.0"
#
# # Instagram scopes (Facebook OAuth)
# SCOPES = [
#     "pages_show_list",
#     "business_management",
#     "instagram_basic",
#     "instagram_content_publish",
#     "public_profile",
# ]
#
#
# def get_auth_url(state: str = "") -> str:
#     from urllib.parse import urlencode
#     params = {
#         "client_id": settings.INSTAGRAM_APP_ID,
#         "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
#         "response_type": "code",
#         "scope": ",".join(SCOPES),
#         "state": state,
#     }
#     return f"{FB_AUTH_URL}?{urlencode(params)}"
#
#
# async def exchange_code(code: str) -> dict:
#     async with httpx.AsyncClient() as client:
#         r = await client.post(FB_TOKEN_URL, data={
#             "client_id": settings.INSTAGRAM_APP_ID,
#             "client_secret": settings.INSTAGRAM_APP_SECRET,
#             "code": code,
#             "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
#             "grant_type": "authorization_code",
#         })
#     return r.json()
#
#
# async def get_long_lived_token(short_token: str) -> dict:
#     async with httpx.AsyncClient() as client:
#         r = await client.get(FB_LONG_TOKEN_URL, params={
#             "grant_type": "fb_exchange_token",
#             "client_id": settings.INSTAGRAM_APP_ID,
#             "client_secret": settings.INSTAGRAM_APP_SECRET,
#             "fb_exchange_token": short_token,
#         })
#     return r.json()
#
#
# async def get_ig_business_account(access_token: str) -> dict:
#     """Get Instagram Business Account ID linked to a Facebook Page."""
#     async with httpx.AsyncClient() as client:
#         # Get user's pages
#         r = await client.get(
#             f"{GRAPH_API}/me/accounts",
#             params={"access_token": access_token, "fields": "id,name,instagram_business_account,access_token"}
#         )
#         data = r.json()
#
#     pages = data.get("data", [])
#     for page in pages:
#         ig = page.get("instagram_business_account")
#         if ig:
#             return {
#                 "ig_user_id": ig.get("id"),
#                 "page_name": page.get("name"),
#                 "page_token": page.get("access_token", access_token),
#             }
#     return {}
