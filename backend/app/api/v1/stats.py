from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.post import Post, PlatformPost, PostStatus, PublishStatus
from app.models.social_account import SocialAccount

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/dashboard")
async def dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Total posts
    total = await db.execute(select(func.count(Post.id)).where(Post.created_by == current_user.id))
    total_posts = total.scalar_one()

    # Published posts
    pub = await db.execute(
        select(func.count(Post.id)).where(
            Post.created_by == current_user.id,
            Post.status == PostStatus.published,
        )
    )
    published = pub.scalar_one()

    # Scheduled posts
    sched = await db.execute(
        select(func.count(Post.id)).where(
            Post.created_by == current_user.id,
            Post.status == PostStatus.scheduled,
        )
    )
    scheduled = sched.scalar_one()

    # Failed posts
    fail = await db.execute(
        select(func.count(Post.id)).where(
            Post.created_by == current_user.id,
            Post.status == PostStatus.failed,
        )
    )
    failed = fail.scalar_one()

    # Connected platforms
    platforms = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.is_active == True,
        )
    )
    connected_platforms = platforms.scalars().all()

    return {
        "total_posts": total_posts,
        "published_posts": published,
        "scheduled_posts": scheduled,
        "failed_posts": failed,
        "draft_posts": total_posts - published - scheduled - failed,
        "connected_platforms": len(connected_platforms),
        "platforms": [{"platform": a.platform, "account_name": a.account_name} for a in connected_platforms],
    }
