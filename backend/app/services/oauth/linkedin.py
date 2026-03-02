import httpx
from app.config import settings

LI_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
LI_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LI_PROFILE_URL = "https://api.linkedin.com/v2/userinfo"

SCOPES = ["openid", "profile", "email", "w_member_social"]


def get_auth_url(state: str = "") -> str:
    from urllib.parse import urlencode
    params = {
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
        "scope": " ".join(SCOPES),
        "state": state,
    }
    return f"{LI_AUTH_URL}?{urlencode(params)}"


async def exchange_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(LI_TOKEN_URL, data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
            "client_id": settings.LINKEDIN_CLIENT_ID,
            "client_secret": settings.LINKEDIN_CLIENT_SECRET,
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    return r.json()


async def get_profile(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            LI_PROFILE_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
    data = r.json()
    return {
        "id": data.get("sub", ""),
        "name": data.get("name", "LinkedIn User"),
        "email": data.get("email", ""),
    }
