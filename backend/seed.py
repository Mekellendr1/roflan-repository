"""Генератор демо-данных. Точная копия фронтового src/lib/mockData.ts.

Запуск из папки be/:
    python seed.py

9 сотрудников, каждый со своей проблемой для демонстрации.
"""

from datetime import datetime, timedelta, timezone

from app.core.database import Base, SessionLocal, engine
from app.models import Employee, Event, Exception_, Source


def ago(days: int) -> str:
    """Сегодня минус N дней → ISO (как фронтовый ago())."""
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


# (id, title, day, start, end, type)
EMP = [
    dict(
        id="e1", name="Иван Петров", ini="ИП", role="Senior Backend", team="Backend",
        tz="Europe/Moscow", tzs="МСК", off=3, fmt="Гибрид", hr="Офис",
        ws=10, we=19, upd=47, shift=False, exc=[],
        ev=[("e1-1", "Sprint planning", 2, 10, 12, "meeting"),
            ("e1-2", "Design review", 2, 12, 13, "meeting"),
            ("e1-3", "Architecture sync", 2, 13, 15, "meeting"),
            ("e1-4", "Code review", 2, 15, 17, "meeting"),
            ("e1-5", "1:1 с командой", 2, 17, 19, "meeting"),
            ("e1-6", "Late night call", 2, 20, 21, "recurring"),
            ("e1-7", "Standup", 0, 10, 11, "meeting"),
            ("e1-8", "Refactoring block", 1, 13, 16, "focus"),
            ("e1-9", "Weekend hotfix", 5, 11, 13, "meeting")],
    ),
    dict(
        id="e2", name="Мария Косова", ini="МК", role="Tech Lead", team="Backend",
        tz="Europe/Lisbon", tzs="LIS", off=0, fmt="Удалёнка", hr="Гибрид",
        ws=9, we=18, upd=62, shift=True, exc=[],
        ev=[("e2-1", "Sync with US team", 3, 22, 23, "recurring"),
            ("e2-2", "Standup", 3, 10, 11, "meeting"),
            ("e2-3", "Design crit", 3, 11, 12, "meeting"),
            ("e2-4", "PR review", 3, 12, 13, "meeting"),
            ("e2-5", "Roadmap sync", 3, 14, 15, "meeting"),
            ("e2-6", "1:1", 3, 15, 16, "meeting"),
            ("e2-7", "Demo prep", 3, 16, 18, "meeting"),
            ("e2-8", "Architecture deep-dive", 1, 9, 11, "meeting")],
    ),
    dict(
        id="e3", name="Алексей Смирнов", ini="АС", role="Middle Backend", team="Backend",
        tz="Asia/Novosibirsk", tzs="НСК", off=7, fmt="Офис", hr="Удалёнка",
        ws=9, we=18, upd=78, shift=False,
        exc=[("e3-x1", "vacation", "Отпуск 15–19 мая")],
        ev=[("e3-1", "Project review", 4, 14, 15, "meeting"),
            ("e3-2", "Standup", 0, 9, 10, "meeting"),
            ("e3-3", "Standup", 1, 9, 10, "meeting"),
            ("e3-4", "Task sync", 2, 11, 12, "meeting")],
    ),
    dict(
        id="e4", name="Дмитрий Яковлев", ini="ДЯ", role="Senior Backend", team="Backend",
        tz="Europe/Moscow", tzs="МСК", off=3, fmt="Удалёнка", hr="Удалёнка",
        ws=11, we=20, upd=12, shift=False, exc=[],
        ev=[("e4-1", "Code review", 1, 15, 16, "meeting"),
            ("e4-2", "1:1 с менеджером", 1, 15, 16, "meeting"),
            ("e4-3", "Standup", 1, 11, 12, "meeting"),
            ("e4-4", "Focus block", 2, 13, 17, "focus")],
    ),
    dict(
        id="e5", name="Анна Морозова", ini="АМ", role="Tech Lead", team="Frontend",
        tz="Europe/Vilnius", tzs="VNO", off=2, fmt="Гибрид", hr="Гибрид",
        ws=9, we=18, upd=8, shift=False, exc=[],
        ev=[("e5-1", "Late retrospective", 4, 18, 19, "meeting"),
            ("e5-2", "Standup", 0, 9, 10, "meeting"),
            ("e5-3", "Design sync", 2, 14, 15, "meeting")],
    ),
    dict(
        id="e6", name="Елена Волкова", ini="ЕВ", role="Junior Backend", team="Backend",
        tz="Europe/Vilnius", tzs="VNO", off=2, fmt="Офис", hr="Офис",
        ws=9, we=18, upd=3, shift=False, exc=[],
        ev=[("e6-1", "Standup", 0, 10, 10.5, "meeting"),
            ("e6-2", "Standup", 2, 10, 10.5, "meeting"),
            ("e6-3", "Focus time", 1, 13, 15, "focus"),
            ("e6-4", "Mentoring", 3, 14, 15, "meeting")],
    ),
    dict(
        id="e7", name="Сергей Лебедев", ini="СЛ", role="Middle DevOps", team="Infra",
        tz="Europe/Moscow", tzs="МСК", off=3, fmt="Удалёнка", hr="Удалёнка",
        ws=10, we=19, upd=5, shift=False, exc=[],
        ev=[("e7-1", "Standup", 0, 11, 11.5, "meeting"),
            ("e7-2", "Infra review", 2, 14, 15, "meeting"),
            ("e7-3", "On-call handoff", 4, 12, 13, "meeting")],
    ),
    dict(
        id="e8", name="Ольга Никитина", ini="ОН", role="QA Engineer", team="QA",
        tz="America/New_York", tzs="NYC", off=-5, fmt="Удалёнка", hr="Удалёнка",
        ws=9, we=18, upd=34, shift=True,
        exc=[("e8-x1", "sick", "Больничный")],
        ev=[("e8-1", "Daily stand-up", 0, 7, 7.5, "recurring"),
            ("e8-2", "Daily stand-up", 1, 7, 7.5, "recurring"),
            ("e8-3", "Daily stand-up", 2, 7, 7.5, "recurring"),
            ("e8-4", "Test planning", 3, 14, 15, "meeting")],
    ),
    dict(
        id="e9", name="Павел Орлов", ini="ПО", role="Middle Frontend", team="Frontend",
        tz="Europe/Moscow", tzs="МСК", off=3, fmt="Гибрид", hr="Гибрид",
        ws=9, we=18, upd=21, shift=False,
        exc=[("e9-x1", "business_trip", "Командировка в офис Берлина")],
        ev=[("e9-1", "Standup", 0, 9, 10, "meeting"),
            ("e9-2", "UI sync", 2, 13, 14, "meeting"),
            ("e9-3", "Sprint review", 4, 15, 16, "meeting")],
    ),
]

SOURCES = [
    ("s1", "Google Calendar", "calendar", "calendar", "active", "2 мин назад", 1247),
    ("s2", "HR System (БОСС-Кадровик)", "hr", "users", "active", "15 мин назад", 9),
    ("s3", "Jira (задачи)", "tasks", "tasks", "active", "5 мин назад", 318),
    ("s4", "Табель учёта времени", "timesheet", "clock", "stale", "6 часов назад", 540),
    ("s5", "Slack статусы", "manual", "message", "error", "нет связи", 0),
]


def seed():
    print("⏳ Создаю таблицы...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("👥 Создаю 9 сотрудников...")
    for e in EMP:
        db.add(Employee(
            id=e["id"], name=e["name"], initials=e["ini"], role=e["role"],
            team=e["team"], timezone=e["tz"], tz_short=e["tzs"], tz_offset=e["off"],
            work_format=e["fmt"], hr_format=e["hr"],
            schedule_days="0,1,2,3,4", work_start=e["ws"], work_end=e["we"],
            last_update=ago(e["upd"]), activity_tz_shift=e["shift"],
        ))
    db.commit()

    print("📅 Создаю события...")
    n_ev = 0
    for e in EMP:
        for (eid, title, day, s, en, ty) in e["ev"]:
            db.add(Event(
                id=eid, employee_id=e["id"], title=title, day=day,
                start_hour=s, end_hour=en, event_type=ty,
            ))
            n_ev += 1
    db.commit()
    print(f"   создано {n_ev} событий")

    print("🏖 Создаю исключения...")
    n_x = 0
    for e in EMP:
        for (xid, xtype, note) in e["exc"]:
            db.add(Exception_(
                id=xid, employee_id=e["id"], type=xtype, note=note,
            ))
            n_x += 1
    db.commit()
    print(f"   создано {n_x} исключений")

    print("📡 Создаю источники...")
    for (sid, name, ty, ic, st, sy, rc) in SOURCES:
        db.add(Source(
            id=sid, name=name, type=ty, icon=ic, status=st,
            last_sync=sy, records=rc,
        ))
    db.commit()

    db.close()
    print()
    print("✅ Сидинг завершён!")
    print()
    print("Дальше:")
    print("  python -m uvicorn app.main:app --reload --port 8000")
    print("  открой http://localhost:8000/docs")
    print()


if __name__ == "__main__":
    seed()
