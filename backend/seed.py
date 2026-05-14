"""Генератор демо-данных — WorkTime Sync.

Запуск из папки backend/:
    python seed.py

Режимы:
  --demo     Загрузить преднастроенные демо-данные (быстро)
  --manual   Интерактивный ввод сотрудников через CLI
  --help     Показать справку

После запуска seed.py — обязательно дёрнуть POST /recalculate, чтобы
прогнать детекторы и пересчитать риск.
"""

import argparse
import random
import sys
import uuid
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.core.database import Base, SessionLocal, engine
from app.models import Employee, Event, Exception_, Notification, Conflict, RiskMetric, Source


# ---------------------------------------------------------------------------
# Вспомогательные функции
# ---------------------------------------------------------------------------

def _utc(year: int, month: int, day: int, hour: int, minute: int = 0) -> datetime:
    return datetime(year, month, day, hour, minute, 0, tzinfo=ZoneInfo("UTC")).replace(tzinfo=None)


def _local_to_utc(tz: str, year: int, month: int, day: int, hour: int, minute: int = 0) -> datetime:
    """Локальное время → UTC (naive, как храним в БД)."""
    local = datetime(year, month, day, hour, minute, 0, tzinfo=ZoneInfo(tz))
    return local.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)


def _ask(prompt: str, default: str = "") -> str:
    """Задать вопрос пользователю с опциональным дефолтом."""
    if default:
        prompt = f"{prompt} [{default}]: "
    else:
        prompt = f"{prompt}: "
    answer = input(prompt).strip()
    return answer if answer else default


def _ask_time(prompt: str, default: str = "09:00") -> time:
    """Спросить время в формате HH:MM."""
    while True:
        raw = _ask(prompt, default)
        try:
            h, m = map(int, raw.split(":"))
            return time(h, m)
        except (ValueError, TypeError):
            print("  ⚠ Неверный формат. Введите время как HH:MM (например, 09:00).")


def _ask_int(prompt: str, default: int, min_val: int = 0, max_val: int = 9999) -> int:
    """Спросить целое число в заданном диапазоне."""
    while True:
        raw = _ask(prompt, str(default))
        try:
            val = int(raw)
            if min_val <= val <= max_val:
                return val
            print(f"  ⚠ Введите число от {min_val} до {max_val}.")
        except ValueError:
            print("  ⚠ Нужно целое число.")


def _ask_choice(prompt: str, options: list[str], default: str = "") -> str:
    """Выбрать один из вариантов."""
    opts_str = " / ".join(options)
    while True:
        raw = _ask(f"{prompt} ({opts_str})", default)
        if raw in options:
            return raw
        print(f"  ⚠ Допустимые варианты: {opts_str}")


def _ask_timezone(prompt: str, default: str = "Europe/Moscow") -> str:
    """Спросить IANA-таймзону с валидацией."""
    while True:
        tz = _ask(prompt, default)
        try:
            ZoneInfo(tz)
            return tz
        except ZoneInfoNotFoundError:
            print(f"  ⚠ Неизвестная таймзона: {tz}. Пример: Europe/Moscow, Asia/Novosibirsk.")


# ---------------------------------------------------------------------------
# Интерактивный ввод одного сотрудника
# ---------------------------------------------------------------------------

def input_employee(index: int) -> dict:
    """Собрать данные об одном сотруднике интерактивно."""
    print(f"\n── Сотрудник #{index} ──────────────────────────────────────")

    emp_id     = _ask("ID (уникальный)", f"e{index}")
    name       = _ask("ФИО", f"Сотрудник {index}")
    initials   = _ask("Инициалы (2–4 символа)", "".join(w[0] for w in name.split()[:2]).upper())
    role       = _ask("Должность", "Middle Backend")
    team       = _ask("Команда", "Backend")
    timezone   = _ask_timezone("Таймзона (IANA)", "Europe/Moscow")
    tz_short   = _ask("Короткое название пояса (3–5 букв)", "МСК")
    tz_offset  = _ask_int("Смещение от UTC (часов)", 3, -12, 14)
    work_fmt   = _ask_choice("Формат работы", ["Офис", "Удалёнка", "Гибрид"], "Гибрид")
    work_start = _ask_time("Начало рабочего дня (HH:MM)", "10:00")
    work_end   = _ask_time("Конец рабочего дня (HH:MM)", "19:00")
    days_old   = _ask_int("Дней с обновления графика (для риск-скора)", 3, 0, 365)

    return dict(
        id=emp_id,
        name=name,
        initials=initials,
        role=role,
        team=team,
        timezone=timezone,
        tz_short=tz_short,
        tz_offset=tz_offset,
        work_format=work_fmt,
        work_start=work_start,
        work_end=work_end,
        schedule_days_old=days_old,
    )


def collect_employees() -> list[dict]:
    """Интерактивно собрать список сотрудников."""
    print("\n═══════════════════════════════════════════")
    print("  WorkTime Sync — создание сотрудников")
    print("═══════════════════════════════════════════")

    count = _ask_int("Сколько сотрудников создать?", 3, 1, 50)
    employees = []
    for i in range(1, count + 1):
        emp = input_employee(i)
        employees.append(emp)
        print(f"  ✔ {emp['name']} ({emp['role']}) добавлен.")

    print(f"\n✅ Собрано {len(employees)} сотрудников.\n")
    return employees


# ---------------------------------------------------------------------------
# Преднастроенные демо-данные (оригинальные 8 человек)
# ---------------------------------------------------------------------------

EMPLOYEES_DEMO = [
    dict(id="e1", name="Иван Петров", initials="ИП", role="Senior Backend",
         team="Backend", timezone="Europe/Moscow", tz_short="МСК", tz_offset=3,
         work_format="Гибрид", work_start=time(10, 0), work_end=time(19, 0),
         schedule_days_old=5),

    dict(id="e2", name="Мария Косова", initials="МК", role="Tech Lead",
         team="Backend", timezone="Europe/Lisbon", tz_short="LIS", tz_offset=0,
         work_format="Удалёнка", work_start=time(9, 0), work_end=time(18, 0),
         schedule_days_old=2),

    dict(id="e3", name="Алексей Смирнов", initials="АС", role="Middle Backend",
         team="Backend", timezone="Asia/Novosibirsk", tz_short="НСК", tz_offset=7,
         work_format="Офис", work_start=time(9, 0), work_end=time(18, 0),
         schedule_days_old=18),

    dict(id="e4", name="Дмитрий Яковлев", initials="ДЯ", role="Senior Backend",
         team="Backend", timezone="Europe/Moscow", tz_short="МСК", tz_offset=3,
         work_format="Удалёнка", work_start=time(11, 0), work_end=time(20, 0),
         schedule_days_old=7),

    dict(id="e5", name="Анна Морозова", initials="АМ", role="Tech Lead",
         team="Frontend", timezone="Europe/Vilnius", tz_short="VNO", tz_offset=2,
         work_format="Гибрид", work_start=time(9, 0), work_end=time(18, 0),
         schedule_days_old=3),

    dict(id="e6", name="Елена Волкова", initials="ЕВ", role="Junior Backend",
         team="Backend", timezone="Europe/Vilnius", tz_short="VNO", tz_offset=2,
         work_format="Офис", work_start=time(9, 0), work_end=time(18, 0),
         schedule_days_old=1),

    dict(id="e7", name="Сергей Лебедев", initials="СЛ", role="Middle DevOps",
         team="Infra", timezone="Europe/Moscow", tz_short="МСК", tz_offset=3,
         work_format="Удалёнка", work_start=time(10, 0), work_end=time(19, 0),
         schedule_days_old=4),

    dict(id="e8", name="Ольга Никитина", initials="ОН", role="QA Engineer",
         team="QA", timezone="America/New_York", tz_short="NYC", tz_offset=-5,
         work_format="Удалёнка", work_start=time(9, 0), work_end=time(18, 0),
         schedule_days_old=6),
]


# ---------------------------------------------------------------------------
# Создание событий и исключений (демо-конфликты)
# ---------------------------------------------------------------------------

def _seed_events(db, employees_seed: list[dict]) -> list[Event]:
    """Создать события для демо-конфликтов.

    Используем только тех сотрудников, чьи ID присутствуют в списке.
    """
    ids = {e["id"] for e in employees_seed}
    today = datetime.utcnow().date()
    monday = today + timedelta(days=(7 - today.weekday()) % 7 or 7)
    Y, M, D = monday.year, monday.month, monday.day

    events: list[Event] = []

    # === ИВАН (e1) — перегрузка + back-to-back ===
    if "e1" in ids:
        iv_day = monday + timedelta(days=2)
        for title, sh, sm, eh, em in [
            ("Sprint planning", 10, 0, 11, 30),
            ("Design review", 11, 30, 13, 0),
            ("Lunch debug session", 13, 0, 14, 0),
            ("Architecture sync", 14, 0, 15, 30),
            ("Code review", 15, 30, 17, 0),
            ("1:1 с командой", 17, 0, 18, 30),
            ("Late night call", 18, 30, 19, 30),
        ]:
            events.append(Event(
                id=str(uuid.uuid4()), employee_id="e1", title=title,
                start_at=_local_to_utc("Europe/Moscow", iv_day.year, iv_day.month, iv_day.day, sh, sm),
                end_at=_local_to_utc("Europe/Moscow", iv_day.year, iv_day.month, iv_day.day, eh, em),
                event_type="meeting", source_id="s1",
            ))

    # === МАРИЯ (e2) — встречи 22:00 LIS + back-to-back ===
    if "e2" in ids:
        mk_day = monday + timedelta(days=3)
        events.append(Event(
            id=str(uuid.uuid4()), employee_id="e2", title="Sync with US team",
            start_at=_local_to_utc("Europe/Lisbon", mk_day.year, mk_day.month, mk_day.day, 22, 0),
            end_at=_local_to_utc("Europe/Lisbon", mk_day.year, mk_day.month, mk_day.day, 23, 0),
            event_type="meeting", source_id="s1", is_recurring=True,
        ))
        for title, sh, sm, eh, em in [
            ("Standup", 10, 0, 10, 30), ("Design crit", 10, 30, 11, 30),
            ("PR review session", 11, 30, 12, 30), ("Lunch & learn", 12, 30, 13, 30),
            ("Roadmap sync", 13, 30, 14, 30), ("1:1", 14, 30, 15, 30),
            ("Demo prep", 15, 30, 16, 30),
        ]:
            events.append(Event(
                id=str(uuid.uuid4()), employee_id="e2", title=title,
                start_at=_local_to_utc("Europe/Lisbon", mk_day.year, mk_day.month, mk_day.day, sh, sm),
                end_at=_local_to_utc("Europe/Lisbon", mk_day.year, mk_day.month, mk_day.day, eh, em),
                event_type="meeting", source_id="s1",
            ))

    # === АЛЕКСЕЙ (e3) — встреча во время отпуска ===
    if "e3" in ids:
        al_day = monday + timedelta(days=4)
        events.append(Event(
            id=str(uuid.uuid4()), employee_id="e3", title="Project review",
            start_at=_local_to_utc("Asia/Novosibirsk", al_day.year, al_day.month, al_day.day, 14, 0),
            end_at=_local_to_utc("Asia/Novosibirsk", al_day.year, al_day.month, al_day.day, 15, 0),
            event_type="meeting", source_id="s1",
        ))

    # === ДМИТРИЙ (e4) — двойное бронирование ===
    if "e4" in ids:
        dm_day = monday + timedelta(days=1)
        dm_start = _local_to_utc("Europe/Moscow", dm_day.year, dm_day.month, dm_day.day, 15, 0)
        dm_end   = _local_to_utc("Europe/Moscow", dm_day.year, dm_day.month, dm_day.day, 16, 0)
        events.append(Event(id=str(uuid.uuid4()), employee_id="e4", title="Code review",
                            start_at=dm_start, end_at=dm_end, event_type="meeting", source_id="s1"))
        events.append(Event(id=str(uuid.uuid4()), employee_id="e4", title="1:1 с менеджером",
                            start_at=dm_start + timedelta(minutes=15),
                            end_at=dm_end + timedelta(minutes=15),
                            event_type="meeting", source_id="s1"))

    # === АННА (e5) — встреча 17:45 VNO в пятницу ===
    if "e5" in ids:
        an_day = monday + timedelta(days=4)
        events.append(Event(
            id=str(uuid.uuid4()), employee_id="e5", title="Late retrospective",
            start_at=_local_to_utc("Europe/Vilnius", an_day.year, an_day.month, an_day.day, 17, 45),
            end_at=_local_to_utc("Europe/Vilnius", an_day.year, an_day.month, an_day.day, 18, 30),
            event_type="meeting", source_id="s1",
        ))

    # === ОЛЬГА (e8) — стендап в 7:00 NYC ===
    if "e8" in ids:
        for offset in range(3):
            d = monday + timedelta(days=offset)
            events.append(Event(
                id=str(uuid.uuid4()), employee_id="e8", title="Daily stand-up",
                start_at=_local_to_utc("America/New_York", d.year, d.month, d.day, 7, 0),
                end_at=_local_to_utc("America/New_York", d.year, d.month, d.day, 7, 30),
                event_type="meeting", source_id="s1", is_recurring=True,
            ))

    # === Обычные события для e6, e7 ===
    for emp_id, tz_name in [("e6", "Europe/Vilnius"), ("e7", "Europe/Moscow")]:
        if emp_id not in ids:
            continue
        for day_offset in range(5):
            d = monday + timedelta(days=day_offset)
            events.append(Event(
                id=str(uuid.uuid4()), employee_id=emp_id, title="Standup",
                start_at=_local_to_utc(tz_name, d.year, d.month, d.day, 10, 0),
                end_at=_local_to_utc(tz_name, d.year, d.month, d.day, 10, 15),
                event_type="meeting", source_id="s1",
            ))
            events.append(Event(
                id=str(uuid.uuid4()), employee_id=emp_id, title="Focus time",
                start_at=_local_to_utc(tz_name, d.year, d.month, d.day, 13, 0),
                end_at=_local_to_utc(tz_name, d.year, d.month, d.day, 14, 30),
                event_type="focus", source_id="s1",
            ))

    return events


def _seed_exceptions(db, employees_seed: list[dict]) -> list[Exception_]:
    """Создать исключения (отпуска, больничные)."""
    ids = {e["id"] for e in employees_seed}
    today = datetime.utcnow().date()
    monday = today + timedelta(days=(7 - today.weekday()) % 7 or 7)
    exceptions = []

    # Алексей в отпуске → HR mismatch со встречей
    if "e3" in ids:
        al_vac_start = monday + timedelta(days=4)
        al_vac_end   = monday + timedelta(days=8)
        exceptions.append(Exception_(
            id=str(uuid.uuid4()), employee_id="e3", type="vacation",
            start_at=datetime.combine(al_vac_start, time(0, 0)),
            end_at=datetime.combine(al_vac_end, time(23, 59)),
            description="Отпуск", source_id="s2",
        ))

    return exceptions


# ---------------------------------------------------------------------------
# Основная функция сидинга
# ---------------------------------------------------------------------------

def create_employee_record(emp: dict) -> Employee:
    """Создать ORM-объект Employee из словаря."""
    return Employee(
        id=emp["id"],
        name=emp["name"],
        initials=emp["initials"],
        role=emp["role"],
        team=emp["team"],
        timezone=emp["timezone"],
        tz_short=emp["tz_short"],
        tz_offset=emp["tz_offset"],
        work_format=emp["work_format"],
        work_start=emp["work_start"],
        work_end=emp["work_end"],
        schedule_updated_at=datetime.utcnow() - timedelta(days=emp["schedule_days_old"]),
    )


def seed(employees_data: list[dict], add_demo_events: bool = True) -> None:
    """Записать всё в БД."""
    print("\n⏳ Пересоздаю таблицы...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    print(f"👥 Создаю {len(employees_data)} сотрудников...")
    for emp_dict in employees_data:
        db.add(create_employee_record(emp_dict))
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

    if add_demo_events:
        print("📅 Создаю события (с демо-конфликтами)...")
        events = _seed_events(db, employees_data)
        db.add_all(events)
        db.commit()
        print(f"   создано {len(events)} событий")

        print("🏖  Создаю исключения (отпуска)...")
        exceptions = _seed_exceptions(db, employees_data)
        db.add_all(exceptions)
        db.commit()
        print(f"   создано {len(exceptions)} исключений")

    db.close()

    print()
    print("✅ Сидинг завершён!")
    _print_next_steps()


def _print_next_steps() -> None:
    print()
    print("Следующие шаги:")
    print("  1. Запусти сервер:       uvicorn app.main:app --reload --port 8000")
    print("  2. Прогон конфликтов:    POST http://localhost:8000/recalculate")
    print("     (или: curl -X POST http://localhost:8000/recalculate)")
    print("  3. Открой фронт:         http://localhost:5173")
    print()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="seed.py",
        description="WorkTime Sync — генератор начальных данных",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Примеры:\n"
            "  python seed.py --demo            # загрузить 8 готовых сотрудников\n"
            "  python seed.py --manual          # ввести сотрудников вручную\n"
            "  python seed.py --manual --no-events  # вручную, без демо-событий\n"
        ),
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--demo",   action="store_true", help="Использовать преднастроенные демо-данные")
    mode.add_argument("--manual", action="store_true", help="Вводить сотрудников интерактивно")

    parser.add_argument(
        "--no-events", action="store_true",
        help="Не создавать демо-события/исключения (только сотрудники и источники)",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.demo:
        print("\n🚀 Режим: демо-данные (8 преднастроенных сотрудников)")
        employees_data = EMPLOYEES_DEMO
    else:
        employees_data = collect_employees()

    add_events = not args.no_events
    if not add_events:
        print("ℹ  Режим --no-events: события и исключения пропускаются.")

    seed(employees_data, add_demo_events=add_events)


if __name__ == "__main__":
    main()