"""WorkTime Sync — FastAPI приложение.

Запуск из папки backend/:
    uvicorn app.main:app --reload --port 8000

Документация: http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import availability, conflicts, employees, misc
from app.core.config import settings
from app.core.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # При старте — создаём таблицы (для SQLite, в Postgres делается через Alembic)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="WorkTime Sync API",
    description="Актуализация рабочего времени, конфликтов и доступности команды",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — без него фронт с другого порта не сможет дёргать API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Роутеры
app.include_router(employees.router)
app.include_router(conflicts.router)
app.include_router(availability.router)
app.include_router(misc.router)


@app.get("/", tags=["root"])
def root():
    return {
        "name": "WorkTime Sync API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["root"])
def health():
    return {"status": "ok"}
