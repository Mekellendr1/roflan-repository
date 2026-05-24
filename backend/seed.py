"""Генератор демо-данных. Запуск: python seed.py из папки backend/

Создаёт:
  - 9 аккаунтов реальных сотрудников с заполненными профилями (пароль demo1234)
  - 1 демо-проект "WorkTime Sync — Демо"
  - Владелец и Администратор проекта — Мария Косова (Tech Lead)
  - Каждый сотрудник — участник проекта с соответствующей ролью
"""

import uuid
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext

from app.core.database import Base, SessionLocal, engine
from app.models import Employee, Event, Exception_, Project, ProjectMember, Source, User

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
DEMO_PW = "demo1234"
DEMO_ID = "demo-project-001"

# (emp_id, username, email, full_name, project_role, должность, команда)
# project_role — роль в проекте по ТЗ
EMPLOYEES = [
    ("e1", "ivan",   "ivan@worktimesync.demo",   "Иван Петров",     "Сотрудник",         "Senior Backend Developer", "Backend"),
    ("e2", "maria",  "maria@worktimesync.demo",  "Мария Косова",    "Администратор",     "Tech Lead",                "Backend"),
    ("e3", "alexey", "alexey@worktimesync.demo", "Алексей Смирнов", "Сотрудник",         "Middle Backend Developer", "Backend"),
    ("e4", "dmitry", "dmitry@worktimesync.demo", "Дмитрий Яковлев","Сотрудник",         "Senior Backend Developer", "Backend"),
    ("e5", "anna",   "anna@worktimesync.demo",   "Анна Морозова",   "Руководитель",      "Tech Lead",                "Frontend"),
    ("e6", "elena",  "elena@worktimesync.demo",  "Елена Волкова",   "Сотрудник",         "Junior Backend Developer", "Backend"),
    ("e7", "sergey", "sergey@worktimesync.demo", "Сергей Лебедев",  "Аналитик",          "Middle DevOps Engineer",   "Infra"),
    ("e8", "olga",   "olga@worktimesync.demo",   "Ольга Никитина",  "HR-специалист",     "QA Engineer",              "QA"),
    ("e9", "pavel",  "pavel@worktimesync.demo",  "Павел Орлов",     "Проектный менеджер","Middle Frontend Developer","Frontend"),
]

# emp_id владельца проекта
OWNER_EMP_ID = "e2"  # Мария Косова

def ago(days):
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

def make_initials(name):
    parts = name.split()
    return (parts[0][0] + parts[1][0]).upper() if len(parts) >= 2 else name[:2].upper()

EMP_DATA = {
    "e1": dict(tz="Europe/Moscow",    tzs="МСК", off=3,  fmt="Гибрид",   hr="Офис",     ws=10, we=19, upd=47, shift=False,
               exc=[], ev=[
                   ("Sprint planning",      2, 10, 12, "meeting"),
                   ("Design review",        2, 12, 13, "meeting"),
                   ("Architecture sync",    2, 13, 15, "meeting"),
                   ("Code review",          2, 15, 17, "meeting"),
                   ("1:1 с командой",       2, 17, 19, "meeting"),
                   ("Late night call",      2, 20, 21, "recurring"),
                   ("Standup",              0, 10, 11, "meeting"),
                   ("Refactoring block",    1, 13, 16, "focus"),
                   ("Weekend hotfix",       5, 11, 13, "meeting"),
               ]),
    "e2": dict(tz="Europe/Lisbon",    tzs="LIS", off=0,  fmt="Удалёнка", hr="Гибрид",   ws=9,  we=18, upd=62, shift=True,
               exc=[], ev=[
                   ("Sync with US team",      3, 22, 23, "recurring"),
                   ("Standup",                3, 10, 11, "meeting"),
                   ("Design crit",            3, 11, 12, "meeting"),
                   ("PR review",              3, 12, 13, "meeting"),
                   ("Roadmap sync",           3, 14, 15, "meeting"),
                   ("1:1",                    3, 15, 16, "meeting"),
                   ("Demo prep",              3, 16, 18, "meeting"),
                   ("Architecture deep-dive", 1,  9, 11, "meeting"),
               ]),
    "e3": dict(tz="Asia/Novosibirsk", tzs="НСК", off=7,  fmt="Офис",     hr="Удалёнка", ws=9,  we=18, upd=78, shift=False,
               exc=[("vacation", "Отпуск 15–19 мая")], ev=[
                   ("Project review", 4, 14, 15, "meeting"),
                   ("Standup",        0,  9, 10, "meeting"),
                   ("Standup",        1,  9, 10, "meeting"),
                   ("Task sync",      2, 11, 12, "meeting"),
               ]),
    "e4": dict(tz="Europe/Moscow",    tzs="МСК", off=3,  fmt="Удалёнка", hr="Удалёнка", ws=11, we=20, upd=12, shift=False,
               exc=[], ev=[
                   ("Code review",      1, 15, 16, "meeting"),
                   ("1:1 с менеджером", 1, 15, 16, "meeting"),
                   ("Standup",          1, 11, 12, "meeting"),
                   ("Focus block",      2, 13, 17, "focus"),
               ]),
    "e5": dict(tz="Europe/Vilnius",   tzs="VNO", off=2,  fmt="Гибрид",   hr="Гибрид",   ws=9,  we=18, upd=8,  shift=False,
               exc=[], ev=[
                   ("Late retrospective", 4, 18, 19, "meeting"),
                   ("Standup",            0,  9, 10, "meeting"),
                   ("Design sync",        2, 14, 15, "meeting"),
               ]),
    "e6": dict(tz="Europe/Vilnius",   tzs="VNO", off=2,  fmt="Офис",     hr="Офис",     ws=9,  we=18, upd=3,  shift=False,
               exc=[], ev=[
                   ("Standup",    0, 10, 10.5, "meeting"),
                   ("Standup",    2, 10, 10.5, "meeting"),
                   ("Focus time", 1, 13, 15,   "focus"),
                   ("Mentoring",  3, 14, 15,   "meeting"),
               ]),
    "e7": dict(tz="Europe/Moscow",    tzs="МСК", off=3,  fmt="Удалёнка", hr="Удалёнка", ws=10, we=19, upd=5,  shift=False,
               exc=[], ev=[
                   ("Standup",         0, 11, 11.5, "meeting"),
                   ("Infra review",    2, 14, 15,   "meeting"),
                   ("On-call handoff", 4, 12, 13,   "meeting"),
               ]),
    "e8": dict(tz="America/New_York", tzs="NYC", off=-5, fmt="Удалёнка", hr="Удалёнка", ws=9,  we=18, upd=34, shift=True,
               exc=[("sick", "Больничный")], ev=[
                   ("Daily stand-up", 0, 7,  7.5, "recurring"),
                   ("Daily stand-up", 1, 7,  7.5, "recurring"),
                   ("Daily stand-up", 2, 7,  7.5, "recurring"),
                   ("Test planning",  3, 14, 15,  "meeting"),
               ]),
    "e9": dict(tz="Europe/Moscow",    tzs="МСК", off=3,  fmt="Гибрид",   hr="Гибрид",   ws=9,  we=18, upd=21, shift=False,
               exc=[("business_trip", "Командировка в Берлин")], ev=[
                   ("Standup",       0,  9, 10, "meeting"),
                   ("UI sync",       2, 13, 14, "meeting"),
                   ("Sprint review", 4, 15, 16, "meeting"),
               ]),
}

SOURCES = [
    ("Google Calendar",           "calendar",  "calendar", "active", "2 мин назад",   1247),
    ("HR System (БОСС-Кадровик)", "hr",        "users",    "active", "15 мин назад",     9),
    ("Jira (задачи)",             "tasks",     "tasks",    "active", "5 мин назад",    318),
    ("Табель учёта времени",      "timesheet", "clock",    "stale",  "6 часов назад",  540),
    ("Slack статусы",             "manual",    "message",  "error",  "нет связи",        0),
]


def seed():
    print("⏳ Пересоздаю таблицы...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    pw = pwd_context.hash(DEMO_PW)

    # 1. Создаём аккаунты всех 9 сотрудников
    print("👥 Создаю аккаунты...")
    users = {}  # emp_id -> User
    for emp_id, uname, email, fname, _, _, _ in EMPLOYEES:
        u = User(
            email=email,
            username=uname,
            hashed_password=pw,
            full_name=fname,
            profile_filled=True,  # профили уже заполнены в seed
        )
        db.add(u)
        users[emp_id] = u
    db.commit()

    # 2. Создаём демо-проект (владелец — Мария Косова)
    print("📁 Создаю демо-проект...")
    project = Project(
        id=DEMO_ID,
        name="WorkTime Sync — Демо",
        description=(
            "Демонстрационный проект с реальными данными о рабочем времени команды. "
            "9 сотрудников с разными проблемами: устаревшие графики, перегрузки, "
            "конфликты HR-данных, встречи вне рабочего времени."
        ),
        owner_id=users[OWNER_EMP_ID].id,
    )
    db.add(project)
    db.commit()

    # 3. Добавляем всех как участников проекта
    print("🔗 Добавляю участников...")
    for emp_id, _, _, _, project_role, _, _ in EMPLOYEES:
        db.add(ProjectMember(
            project_id=DEMO_ID,
            user_id=users[emp_id].id,
            role=project_role,
        ))
    db.commit()

    # 4. Создаём Employee-профили с событиями
    print("📋 Создаю профили и события...")
    for emp_id, _, _, fname, _, job_title, team in EMPLOYEES:
        d = EMP_DATA[emp_id]
        emp = Employee(
            id=emp_id,
            user_id=users[emp_id].id,
            name=fname,
            initials=make_initials(fname),
            role=job_title,
            team=team,
            timezone=d["tz"],
            tz_short=d["tzs"],
            tz_offset=d["off"],
            work_format=d["fmt"],
            hr_format=d["hr"],
            schedule_days="0,1,2,3,4",
            work_start=d["ws"],
            work_end=d["we"],
            last_update=ago(d["upd"]),
            activity_tz_shift=d["shift"],
        )
        db.add(emp)
        db.flush()
        for title, day, s, e, ty in d["ev"]:
            db.add(Event(
                id=str(uuid.uuid4()),
                employee_id=emp_id,
                title=title, day=day,
                start_hour=s, end_hour=e,
                event_type=ty,
            ))
        for exc_type, note in d["exc"]:
            db.add(Exception_(
                id=str(uuid.uuid4()),
                employee_id=emp_id,
                type=exc_type,
                note=note,
            ))
    db.commit()

    # 5. Источники данных
    print("📡 Создаю источники...")
    for name, ty, ic, st, sy, rc in SOURCES:
        db.add(Source(
            id=str(uuid.uuid4()),
            name=name, type=ty, icon=ic,
            status=st, last_sync=sy, records=rc,
        ))
    db.commit()
    db.close()

    print("\n✅ Готово!\n")
    print("Демо-аккаунты (пароль: demo1234):")
    print(f"  {'Логин':<12} {'Имя':<22} {'Роль в проекте':<22} {'Должность'}")
    print("  " + "-" * 80)
    for emp_id, uname, _, fname, proj_role, job, team in EMPLOYEES:
        owner = " ★" if emp_id == OWNER_EMP_ID else ""
        print(f"  {uname:<12} {fname:<22} {proj_role:<22} {job}{owner}")
    print()
    print(f"  ★ — Администратор/владелец проекта")


if __name__ == "__main__":
    seed()
