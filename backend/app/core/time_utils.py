"""Утилиты для работы с часовыми поясами и временем.

КРИТИЧЕСКАЯ ЧАСТЬ ПРОЕКТА. Все детекторы конфликтов завязаны на корректные
конвертации UTC ↔ локальное время сотрудника.
"""

from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo


def to_utc(dt: datetime) -> datetime:
    """Привести datetime к UTC. Если naive — считаем что уже UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=ZoneInfo("UTC"))
    return dt.astimezone(ZoneInfo("UTC"))


def to_local(dt: datetime, tz: str) -> datetime:
    """Перевести UTC datetime в локальное время сотрудника."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))
    return dt.astimezone(ZoneInfo(tz))


def is_within_hours(dt: datetime, start: time, end: time, tz: str) -> bool:
    """Попадает ли момент времени в рабочее окно сотрудника (в его поясе)."""
    local = to_local(dt, tz)
    return start <= local.time() <= end


def is_workday(dt: datetime, tz: str) -> bool:
    """Это будний день в поясе сотрудника? (пн-пт)"""
    local = to_local(dt, tz)
    return local.weekday() < 5  # 0=Mon, 6=Sun


def overlaps(start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> bool:
    """Пересекаются ли два интервала."""
    return start1 < end2 and start2 < end1


def hours_between(start: datetime, end: datetime) -> float:
    """Количество часов между двумя моментами."""
    return (end - start).total_seconds() / 3600


def date_range(start: date, end: date):
    """Итератор по датам от start до end включительно."""
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)
