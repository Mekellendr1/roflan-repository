# WorkTime Sync — Backend (для нового фронта)

Бэкенд под полный фронт `worktime-frontend-full` (Tailwind v4, 9 сотрудников,
все экраны ТЗ). Отдаёт ровно те же структуры, что фронт считал локально, —
показатели рассчитываются формулами из ТЗ в `app/services/metrics.py`.

## Запуск (SQLite, без Postgres)

```bash
cd be
python -m venv .venv
.venv\Scripts\activate            # Windows; на mac/linux: source .venv/bin/activate
pip install -r requirements.txt

python seed.py                      # создаёт БД + 9 сотрудников
python -m uvicorn app.main:app --reload --port 8000
```

Открой http://localhost:8000/docs — Swagger со всеми эндпоинтами.

## Эндпоинты

| Метод | URL | Отдаёт |
|-------|-----|--------|
| GET | `/employees?team=` | список EmployeeComputed (с metrics) |
| GET | `/employees/{id}` | один сотрудник + metrics |
| GET | `/diagnostics` | 9 диагностических групп |
| GET | `/conflicts?severity=&type=` | конфликты |
| POST | `/recalculate` | сводка пересчёта (для кнопки) |
| GET | `/recommendations` | рекомендации |
| GET | `/notifications` | умные уведомления |
| GET | `/roadmap` | дорожная карта актуализации |
| GET | `/availability?team=&day=` | командная доступность Tteam |
| POST | `/meetings/suggest-time` | подбор окон встреч |
| GET | `/sources` | источники данных |
| GET | `/stats?team=` | KPI дашборда |

## Формулы (раздел 14 ТЗ) — в `app/services/metrics.py`

```
Ai = 1 − di/D,  D = 90
Ci = Mout / Mall
Li = Hbusy / Hwork,  порог 0.8
Ri = 0.25·(1−Ai) + 0.30·Ci + 0.25·Li + 0.10·Zi + 0.10·Hi
```

Проверено: расчёт совпадает с фронтовым `src/lib/metrics.ts` до числа
(напр. Иван Петров: Ai=48%, Ci=25%, Li=29%, Ri=38).

## Связь с фронтом

Фронт ходит на `/api/*`, Vite-proxy (в `vite.config.ts`) перенаправляет
на `http://localhost:8000`. `App.tsx` грузит данные при старте и кладёт
в кэш через `hydrate()` — все страницы работают на серверных данных.

Если бэк не запущен — фронт автоматически падает на локальные демо-данные
и показывает жёлтую плашку (демо не ломается).

## Postgres (опционально)

В `.env` поменяй `DATABASE_URL` на `postgresql+psycopg2://...`,
снова `python seed.py`.
