# WorkTime Sync — Backend

## Быстрый старт (SQLite, без Postgres)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # на Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Создать БД и наполнить демо-данными
python seed.py

# Запустить сервер
uvicorn app.main:app --reload --port 8000

# В отдельном терминале — прогнать детекторы и пересчитать риск
curl -X POST http://localhost:8000/recalculate
```

После этого открой:
- http://localhost:8000/docs — Swagger со всеми эндпоинтами
- http://localhost:5173 — фронт (если запущен)

## Структура

```
backend/
├── app/
│   ├── api/                    # FastAPI роутеры
│   │   ├── employees.py        # GET /employees, /employees/{id}, /employees/{id}/risk
│   │   ├── conflicts.py        # GET /conflicts, POST /recalculate
│   │   ├── availability.py     # GET /availability, POST /meetings/suggest-time
│   │   └── misc.py             # GET /sources, /notifications, /stats
│   ├── core/
│   │   ├── config.py           # Pydantic-settings
│   │   ├── database.py         # SQLAlchemy engine
│   │   └── time_utils.py       # часовые пояса, конвертации (КРИТИЧЕСКОЕ!)
│   ├── models/
│   │   └── models.py           # SQLAlchemy модели
│   ├── schemas/
│   │   └── schemas.py          # Pydantic схемы для API
│   ├── services/
│   │   ├── conflict_detectors/ # 6 правил, каждое отдельной функцией
│   │   ├── availability.py     # сетка доступности
│   │   ├── meeting_finder.py   # подбор оптимального времени
│   │   ├── notifications.py    # генерация уведомлений
│   │   └── risk_calculator.py  # формула риск-скора
│   └── main.py                 # FastAPI app
├── seed.py                     # генератор демо-данных
├── requirements.txt
└── Dockerfile
```

## Эндпоинты (всё, что нужно фронту)

| Метод | URL | Что делает |
|-------|-----|------------|
| GET | `/employees` | Список сотрудников + фильтры по team/tz |
| GET | `/employees/{id}` | Детальная карточка + история риска + конфликты |
| GET | `/conflicts` | Все конфликты с фильтрами по severity/type |
| POST | `/recalculate` | Прогнать детекторы, пересчитать риск и уведомления |
| GET | `/availability?employee_ids=e1,e2,e3` | Сетка доступности |
| POST | `/meetings/suggest-time` | Топ-N оптимальных слотов |
| GET | `/sources` | Источники с статусом синхронизации |
| GET | `/notifications` | Список «что нужно сделать» |
| GET | `/stats` | Карточки сверху дашборда |

## Детекторы конфликтов

Каждый детектор — функция с одним интерфейсом:
`detect_xxx(db, employee, period_start, period_end) -> list[ConflictResult]`

Базовые (must-have):
- `out_of_hours` — встречи вне рабочих часов
- `double_booking` — пересечение событий
- `hr_mismatch` — событие во время отпуска
- `overload` — > 100% загрузка за день

Свои правила (для бонуса):
- `back_to_back` — 4+ часов встреч подряд = выгорание
- `stale_schedule` — график не обновлялся 14+ дней

Добавить своё правило просто:
1. Создать файл в `app/services/conflict_detectors/my_rule.py`
2. Импортировать и добавить в `DETECTORS` в `__init__.py`

## Формула риска

```
score = 0.4 * workload_pct
      + 0.3 * conflict_count
      + 0.2 * out_of_hours_pct
      + 0.1 * staleness_days
```

Все компоненты нормализуются в шкалу 0-100. Веса обоснованы тем, что
загрузка — самый объективный сигнал, а давность графика — самый слабый.

## Переход на Postgres

1. Поднять Postgres (например через `docker run -p 5432:5432 -e POSTGRES_PASSWORD=worktime postgres`)
2. В `.env` поменять `DATABASE_URL` на `postgresql+psycopg2://...`
3. `python seed.py` — пересоздаст таблицы и наполнит данными
```
