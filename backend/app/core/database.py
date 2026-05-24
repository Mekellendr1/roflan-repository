import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


def _build_connect_args(url: str) -> dict:
    """Подбираем connect_args в зависимости от драйвера."""
    if url.startswith("sqlite"):
        # SQLite в FastAPI работает с одной коннекшн-шарингом на тред
        return {"check_same_thread": False}

    if url.startswith("postgresql"):
        # На Windows с русской локалью libpq иногда возвращает строки в CP1251,
        # а psycopg2 пытается декодировать их как UTF-8 → UnicodeDecodeError.
        # Форсируем кодировку клиента на UTF-8 двумя путями: через env и через
        # параметр соединения, чтобы покрыть оба места, где это читается.
        os.environ.setdefault("PGCLIENTENCODING", "utf8")
        return {"client_encoding": "utf8"}

    return {}


connect_args = _build_connect_args(settings.database_url)

engine = create_engine(
    settings.database_url, connect_args=connect_args, echo=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Базовый класс моделей."""


def get_db():
    """FastAPI dependency — сессия на запрос."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
