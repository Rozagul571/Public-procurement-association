from celery import Celery
from app.config import settings

celery_app = Celery(
    "tenderzone",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.publish"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    broker_connection_retry_on_startup=True,
    beat_schedule={
        "check-scheduled-posts": {
            "task": "app.tasks.publish.check_and_publish_scheduled_posts",
            "schedule": 60.0,  # Har 60 soniyada
        },
    },
)
