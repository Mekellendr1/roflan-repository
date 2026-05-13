from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


# Для SQLite нужен connect_args, для Postgres не нужен
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Базовый класс для всех моделей."""


def get_db():
    """Dependency для FastAPI — открывает сессию на запрос и закрывает после."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
