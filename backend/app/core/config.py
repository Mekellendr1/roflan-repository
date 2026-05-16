from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Конфиг приложения. Читается из .env или переменных окружения."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # БД. По умолчанию SQLite — запускается без Postgres.
    # Postgres: postgresql+psycopg2://user:pass@localhost:5432/worktime
    database_url: str = "sqlite:///./worktime.db"

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
