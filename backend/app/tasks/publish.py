import asyncio
import logging
from uuid import UUID

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

# 🔥 GLOBAL EVENT LOOP (har worker process uchun bitta)
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)


@celery_app.task(name="app.tasks.publish.check_and_publish_scheduled_posts")
def check_and_publish_scheduled_posts():
    loop.run_until_complete(_check())


async def _check():
    from app.database import AsyncSessionLocal
    from app.repositories.post import PostRepository

    async with AsyncSessionLocal() as db:
        repo = PostRepository(db)
        due_posts = await repo.get_due_scheduled_posts()
        logger.info(f"Due posts: {len(due_posts)}")

        for post in due_posts:
            publish_post.delay(str(post.id))


@celery_app.task(
    name="app.tasks.publish.publish_post",
    bind=True,
    max_retries=3,
    default_retry_delay=60
)
def publish_post(self, post_id: str):
    try:
        loop.run_until_complete(_publish(post_id))
    except Exception as exc:
        raise self.retry(exc=exc)
# """
# Celery tasks — publish.py
# asyncio.run() ishlatiladi (Python 3.10+ uchun to'g'ri usul)
# """
# import asyncio
# import logging
# from uuid import UUID
#
# from app.tasks.celery_app import celery_app
#
# logger = logging.getLogger(__name__)
#
#
# @celery_app.task(name="app.tasks.publish.check_and_publish_scheduled_posts")
# def check_and_publish_scheduled_posts():
#     """Beat task — har daqiqa ishga tushadi."""
#     asyncio.run(_check())
#
#
# async def _check():
#     from app.database import AsyncSessionLocal
#     from app.repositories.post import PostRepository
#     async with AsyncSessionLocal() as db:
#         repo = PostRepository(db)
#         due_posts = await repo.get_due_scheduled_posts()
#         logger.info(f"Due posts: {len(due_posts)}")
#         for post in due_posts:
#             publish_post.delay(str(post.id))
#
#
# @celery_app.task(name="app.tasks.publish.publish_post", bind=True, max_retries=3, default_retry_delay=60)
# def publish_post(self, post_id: str):
#     """Post nashr qilish workerga topshiriladi."""
#     try:
#         asyncio.run(_publish(post_id))
#     except Exception as exc:
#         raise self.retry(exc=exc)
#
#
# async def _publish(post_id: str):
#     from app.database import AsyncSessionLocal
#     from app.repositories.post import PostRepository
#     from app.repositories.social_account import SocialAccountRepository
#     from app.repositories.telegram_channel import TelegramChannelRepository
#     from app.models.post import PostStatus, PublishStatus
#     from app.services.platforms.factory import PlatformFactory
#     from app.config import settings
#
#     async with AsyncSessionLocal() as db:
#         post_repo = PostRepository(db)
#         social_repo = SocialAccountRepository(db)
#         tg_repo = TelegramChannelRepository(db)
#
#         post = await post_repo.get_by_id(UUID(post_id))
#         if not post:
#             return
#
#         await post_repo.update_status(post.id, PostStatus.publishing)
#         await db.commit()
#
#         all_success = True
#
#         for pp in post.platform_posts:
#             if pp.publish_status == PublishStatus.published:
#                 continue
#
#             await post_repo.update_platform_post(pp.id, PublishStatus.publishing)
#             await db.commit()
#
#             try:
#                 publisher = PlatformFactory.get(pp.platform)
#                 access_token = None
#                 kwargs = {}
#
#                 if pp.platform == "telegram":
#                     ch = await tg_repo.get_by_id(pp.social_account_id) if pp.social_account_id else None
#                     if ch:
#                         kwargs["channel_id"] = ch.channel_id
#                         access_token = tg_repo.get_bot_token(ch) or settings.TELEGRAM_BOT_TOKEN
#                     else:
#                         access_token = settings.TELEGRAM_BOT_TOKEN
#                 else:
#                     if pp.social_account_id:
#                         account = await social_repo.get_by_id(pp.social_account_id)
#                         if account:
#                             access_token = social_repo.get_access_token(account)
#                             if pp.platform == "instagram":
#                                 kwargs["ig_user_id"] = account.account_external_id
#                             elif pp.platform == "linkedin":
#                                 kwargs["person_urn"] = f"urn:li:person:{account.account_external_id}"
#
#                 result = await publisher.publish_with_retry(
#                     caption=post.caption, media_url=post.media_url,
#                     access_token=access_token, **kwargs,
#                 )
#
#                 if result.success:
#                     await post_repo.update_platform_post(pp.id, PublishStatus.published, external_id=result.external_id)
#                 else:
#                     all_success = False
#                     await post_repo.update_platform_post(pp.id, PublishStatus.failed, error=result.error)
#
#             except Exception as e:
#                 all_success = False
#                 await post_repo.update_platform_post(pp.id, PublishStatus.failed, error=str(e))
#
#             await db.commit()
#
#         final = PostStatus.published if all_success else PostStatus.failed
#         await post_repo.update_status(post.id, final)
#         await db.commit()
