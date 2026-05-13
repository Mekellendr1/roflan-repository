"""Генератор демо-данных.

Запуск из папки backend/:
    python seed.py

Создаёт сотрудников, источники, события и исключения так, чтобы возникли
конкретные конфликты для демо.

После запуска seed.py — обязательно дёрнуть POST /recalculate, чтобы
прогнать детекторы и пересчитать риск.
"""

import random
import uuid
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.core.database import Base, SessionLocal, engine
from app.models import Employee, Event, Exception_, Notification, Conflict, RiskMetric, Source


# Намеренно сделанные сотрудники с заранее известными конфликтами для демо
EMPLOYEES_SEED = [
    # 1. Иван Петров — звезда красного скора: перегрузка + back-to-back
    dict(id="e1", name="Иван Петров", initials="ИП", role="Senior Backend",
         team="Backend", timezone="Europe/Moscow", tz_short="МСК", tz_offset=3,
         work_format="Гибрид", work_start=time(10, 0), work_end=time(19, 0),
         schedule_days_old=5),

    # 2. Мария Косова — встречи в нерабочее время (US team)
    dict(id="e2", name="Мария Косова", initials="МК", role="Tech Lead",
         team="Backend", timezone="Europe/Lisbon", tz_short="LIS", tz_offset=0,
         work_format="Удалёнка", work_start=time(9, 0), work_end=time(18, 0),
         schedule_days_old=2),

    # 3. Алексей Смирнов — HR mismatch + устаревший график
    dict(id="e3", name="Алексей Смирнов", initials="АС", role="Middle Backend",
         team="Backend", timezone="Asia/Novosibirsk", tz_short="НСК", tz_offset=7,
         work_format="Офис", work_start=time(9, 0), work_end=time(18, 0),
         schedule_days_old=18),

    # 4. Дмитрий Яковлев — двойное бронирование
    dict(id="e4", name="Дмитрий Яковлев", initials="ДЯ", role="Senior Backend",
         team="Backend", timezone="Europe/Moscow", tz_short="МСК", tz_offset=3,
         work_format="Удалёнка", work_start=time(11, 0), work_end=time(20, 0),
         schedule_days_old=7),

    # 5. Анна Морозова — минор конфликт
    dict(id="e5", name="Анна Морозова", initials="АМ", role="Tech Lead",
         team="Frontend", timezone="Europe/Vilnius", tz_short="VNO", tz_offset=2,
         work_format="Гибрид", work_start=time(9, 0), work_end=time(18, 0),
         schedule_days_old=3),

    # 6-7. Здоровые сотрудники для контраста
    dict(id="e6", name="Елена Волкова", initials="ЕВ", role="Junior Backend",
         team="Backend", timezone="Europe/Vilnius", tz_short="VNO", tz_offset=2,
         work_format="Офис", work_start=time(9, 0), work_end=time(18, 0),
         schedule_days_old=1),

    dict(id="e7", name="Сергей Лебедев", initials="СЛ", role="Middle DevOps",
         team="Infra", timezone="Europe/Moscow", tz_short="МСК", tz_offset=3,
         work_format="Удалёнка", work_start=time(10, 0), work_end=time(19, 0),
         schedule_days_old=4),

    # 8. Ольга — встречи рано утром
    dict(id="e8", name="Ольга Никитина", initials="ОН", role="QA Engineer",
         team="QA", timezone="America/New_York", tz_short="NYC", tz_offset=-5,
         work_format="Удалёнка", work_start=time(9, 0), work_end=time(18, 0),
         schedule_days_old=6),
]


def _utc(year: int, month: int, day: int, hour: int, minute: int = 0) -> datetime:
    return datetime(year, month, day, hour, minute, 0, tzinfo=ZoneInfo("UTC")).replace(tzinfo=None)


def _local_to_utc(tz: str, year: int, month: int, day: int, hour: int, minute: int = 0) -> datetime:
    """Локальное время → UTC (без tzinfo, как храним в БД)."""
    local = datetime(year, month, day, hour, minute, 0, tzinfo=ZoneInfo(tz))
    return local.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)


def seed():
    print("⏳ Создаю таблицы...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    print("👥 Создаю сотрудников...")
    for e in EMPLOYEES_SEED:
        emp = Employee(
            id=e["id"],
            name=e["name"],
            initials=e["initials"],
            role=e["role"],
            team=e["team"],
            timezone=e["timezone"],
            tz_short=e["tz_short"],
            tz_offset=e["tz_offset"],
            work_format=e["work_format"],
            work_start=e["work_start"],
            work_end=e["work_end"],
            schedule_updated_at=datetime.utcnow() - timedelta(days=e["schedule_days_old"]),
        )
        db.add(emp)
    db.commit()

    print("📡 Создаю источники...")
    sources = [
        Source(id="s1", name="Google Calendar", type="calendar", icon="calendar",
               status="active", last_sync_at=datetime.utcnow() - timedelta(minutes=2),
               records_count=1247),
        Source(id="s2", name="HR System", type="hr", icon="users",
               status="active", last_sync_at=datetime.utcnow() - timedelta(minutes=15),
               records_count=42),
        Source(id="s3", name="Jira", type="tasks", icon="tasks",
               status="active", last_sync_at=datetime.utcnow() - timedelta(minutes=5),
               records_count=318),
        Source(id="s4", name="Slack статусы", type="manual", icon="message",
               status="stale", last_sync_at=datetime.utcnow() - timedelta(hours=4),
               records_count=38),
    ]
    db.add_all(sources)
    db.commit()

    print("📅 Создаю события (с конфликтами специально)...")

    # Возьмём базовую дату: ближайший понедельник в будущем
    today = datetime.utcnow().date()
    monday = today + timedelta(days=(7 - today.weekday()) % 7 or 7)
    Y, M, D = monday.year, monday.month, monday.day

    events: list[Event] = []

    # === ИВАН (e1) — перегрузка + back-to-back ===
    # Среда: 11.5 часов встреч → перегрузка
    iv_day = monday + timedelta(days=2)  # среда
    iv_meetings = [
        ("Sprint planning", 10, 0, 11, 30),
        ("Design review", 11, 30, 13, 0),
        ("Lunch debug session", 13, 0, 14, 0),
        ("Architecture sync", 14, 0, 15, 30),
        ("Code review", 15, 30, 17, 0),
        ("1:1 с командой", 17, 0, 18, 30),
        ("Late night call", 18, 30, 19, 30),
    ]
    for title, sh, sm, eh, em in iv_meetings:
        events.append(Event(
            id=str(uuid.uuid4()),
            employee_id="e1",
            title=title,
            start_at=_local_to_utc("Europe/Moscow", iv_day.year, iv_day.month, iv_day.day, sh, sm),
            end_at=_local_to_utc("Europe/Moscow", iv_day.year, iv_day.month, iv_day.day, eh, em),
            event_type="meeting",
            source_id="s1",
        ))

    # === МАРИЯ (e2) — встречи 22:00 LIS (повторяющиеся) ===
    # Четверг
    mk_day = monday + timedelta(days=3)
    events.append(Event(
        id=str(uuid.uuid4()),
        employee_id="e2",
        title="Sync with US team",
        start_at=_local_to_utc("Europe/Lisbon", mk_day.year, mk_day.month, mk_day.day, 22, 0),
        end_at=_local_to_utc("Europe/Lisbon", mk_day.year, mk_day.month, mk_day.day, 23, 0),
        event_type="meeting",
        source_id="s1",
        is_recurring=True,
    ))
    # И back-to-back 6 часов в другой день
    mk_day2 = monday + timedelta(days=3)
    bb_meetings = [
        ("Standup", 10, 0, 10, 30),
        ("Design crit", 10, 30, 11, 30),
        ("PR review session", 11, 30, 12, 30),
        ("Lunch & learn", 12, 30, 13, 30),
        ("Roadmap sync", 13, 30, 14, 30),
        ("1:1", 14, 30, 15, 30),
        ("Demo prep", 15, 30, 16, 30),
    ]
    for title, sh, sm, eh, em in bb_meetings:
        events.append(Event(
            id=str(uuid.uuid4()),
            employee_id="e2",
            title=title,
            start_at=_local_to_utc("Europe/Lisbon", mk_day2.year, mk_day2.month, mk_day2.day, sh, sm),
            end_at=_local_to_utc("Europe/Lisbon", mk_day2.year, mk_day2.month, mk_day2.day, eh, em),
            event_type="meeting",
            source_id="s1",
        ))

    # === АЛЕКСЕЙ (e3) — событие во время отпуска ===
    al_day = monday + timedelta(days=4)  # пятница
    events.append(Event(
        id=str(uuid.uuid4()),
        employee_id="e3",
        title="Project review",
        start_at=_local_to_utc("Asia/Novosibirsk", al_day.year, al_day.month, al_day.day, 14, 0),
        end_at=_local_to_utc("Asia/Novosibirsk", al_day.year, al_day.month, al_day.day, 15, 0),
        event_type="meeting",
        source_id="s1",
    ))

    # === ДМИТРИЙ (e4) — двойное бронирование ===
    dm_day = monday + timedelta(days=1)  # вторник
    dm_start = _local_to_utc("Europe/Moscow", dm_day.year, dm_day.month, dm_day.day, 15, 0)
    dm_end = _local_to_utc("Europe/Moscow", dm_day.year, dm_day.month, dm_day.day, 16, 0)
    events.append(Event(
        id=str(uuid.uuid4()),
        employee_id="e4",
        title="Code review",
        start_at=dm_start, end_at=dm_end,
        event_type="meeting", source_id="s1",
    ))
    events.append(Event(
        id=str(uuid.uuid4()),
        employee_id="e4",
        title="1:1 с менеджером",
        start_at=dm_start + timedelta(minutes=15),
        end_at=dm_end + timedelta(minutes=15),
        event_type="meeting", source_id="s1",
    ))

    # === АННА (e5) — встреча 17:45 VNO в пятницу ===
    an_day = monday + timedelta(days=4)
    events.append(Event(
        id=str(uuid.uuid4()),
        employee_id="e5",
        title="Late retrospective",
        start_at=_local_to_utc("Europe/Vilnius", an_day.year, an_day.month, an_day.day, 17, 45),
        end_at=_local_to_utc("Europe/Vilnius", an_day.year, an_day.month, an_day.day, 18, 30),
        event_type="meeting", source_id="s1",
    ))

    # === ОЛЬГА (e8) — стендап в 7:00 NYC ===
    ol_day = monday
    for offset in range(3):  # 3 раза в неделю
        d = monday + timedelta(days=offset)
        events.append(Event(
            id=str(uuid.uuid4()),
            employee_id="e8",
            title="Daily stand-up",
            start_at=_local_to_utc("America/New_York", d.year, d.month, d.day, 7, 0),
            end_at=_local_to_utc("America/New_York", d.year, d.month, d.day, 7, 30),
            event_type="meeting", source_id="s1", is_recurring=True,
        ))

    # === Обычные события для здоровых сотрудников (e6, e7) ===
    for emp_id, tz_name in [("e6", "Europe/Vilnius"), ("e7", "Europe/Moscow")]:
        for day_offset in range(5):
            d = monday + timedelta(days=day_offset)
            events.append(Event(
                id=str(uuid.uuid4()),
                employee_id=emp_id,
                title="Standup",
                start_at=_local_to_utc(tz_name, d.year, d.month, d.day, 10, 0),
                end_at=_local_to_utc(tz_name, d.year, d.month, d.day, 10, 15),
                event_type="meeting", source_id="s1",
            ))
            events.append(Event(
                id=str(uuid.uuid4()),
                employee_id=emp_id,
                title="Focus time",
                start_at=_local_to_utc(tz_name, d.year, d.month, d.day, 13, 0),
                end_at=_local_to_utc(tz_name, d.year, d.month, d.day, 14, 30),
                event_type="focus", source_id="s1",
            ))

    db.add_all(events)
    db.commit()
    print(f"   создано {len(events)} событий")

    print("🏖 Создаю исключения (отпуска)...")
    # Алексей в отпуске 15-19 мая (создаст HR mismatch со встречей выше)
    al_vac_start = monday + timedelta(days=4)  # пятница
    al_vac_end = monday + timedelta(days=8)
    db.add(Exception_(
        id=str(uuid.uuid4()),
        employee_id="e3",
        type="vacation",
        start_at=datetime.combine(al_vac_start, time(0, 0)),
        end_at=datetime.combine(al_vac_end, time(23, 59)),
        description="Отпуск",
        source_id="s2",
    ))
    db.commit()

    db.close()

    print()
    print("✅ Сидинг завершён!")
    print()
    print("Дальше:")
    print("  1. Запусти сервер:  uvicorn app.main:app --reload --port 8000")
    print("  2. Прогон конфликтов: POST http://localhost:8000/recalculate")
    print("     (или curl -X POST http://localhost:8000/recalculate)")
    print("  3. Открой фронт http://localhost:5173")
    print()


if __name__ == "__main__":
    seed()
