from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Конфиг приложения. Читается из .env или переменных окружения."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # БД. По умолчанию Postgres (требуется поднятый сервер).
    # Для локальной разработки без Postgres можно положить в .env:
    #   DATABASE_URL=sqlite:///./worktime.db
    database_url: str = (
        "postgresql+psycopg2://worktime:worktime@localhost:5432/worktime"
    )

    # AI (OpenAI Chat Completions). Если ключ не задан — AI-эндпоинты вернут 502.
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # CORS — фронт на vite-dev
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # Константы формул из ТЗ
    d_max_days: int = 90  # макс. период без обновления (Ai = 1 - di/D)
    overload_threshold: float = 0.8  # порог перегрузки Li


settings = Settings()
