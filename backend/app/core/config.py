from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Конфиг приложения. Читается из .env или переменных окружения."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # БД. По умолчанию SQLite — запустится без Postgres.
    # Для Postgres: postgresql+psycopg2://user:pass@localhost:5432/worktime
    database_url: str = "sqlite:///./worktime.db"

    # CORS — разрешаем фронт на vite-dev (5173)
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # Сколько часов в "нормальном" рабочем дне — для расчёта перегрузки
    workday_hours: float = 8.0


settings = Settings()
