"""
Alembic env.py — psycopg2 (sync) ishlatadi
asyncpg EMAS — chunki Alembic sync connection talab qiladi
"""
import os
from app.models import *
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.config import settings
from app.database import Base

# Barcha modellarni import qil (Alembic autogenerate uchun)
from app.models import *  # noqa

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# SYNC URL — psycopg2 ishlatadi, asyncpg EMAS
SYNC_URL = settings.SYNC_DATABASE_URL
# asyncpg bo'lsa psycopg2 ga o'zgartir
SYNC_URL = SYNC_URL.replace("postgresql+asyncpg://", "postgresql://")
SYNC_URL = SYNC_URL.replace("postgresql+psycopg2://", "postgresql://")

config.set_main_option("sqlalchemy.url", SYNC_URL)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
