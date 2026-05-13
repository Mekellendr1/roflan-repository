"""Детектор: суммарная загрузка > 100% за день."""

from collections import defaultdict
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.time_utils import hours_between, to_local
from app.models import Employee, Event

from .base import ConflictResult


def detect_overload(
    db: Session, employee: Employee, period_start: datetime, period_end: datetime
) -> list[ConflictResult]:
    results: list[ConflictResult] = []

    events = (
        db.query(Event)
        .filter(
            Event.employee_id == employee.id,
            Event.start_at >= period_start,
            Event.start_at <= period_end,
        )
        .all()
    )

    # Группируем часы по локальной дате (важно: в поясе сотрудника)
    hours_by_day: dict[str, float] = defaultdict(float)
    for ev in events:
        local_date = to_local(ev.start_at, employee.timezone).date()
        hours_by_day[local_date.isoformat()] += hours_between(ev.start_at, ev.end_at)

    norm = settings.workday_hours

    for day, hours in hours_by_day.items():
        pct = (hours / norm) * 100
        if pct > 100:
            severity = "critical" if pct > 120 else "warning"
            results.append(
                ConflictResult(
                    employee_id=employee.id,
                    type="overload",
                    severity=severity,
                    title=f"{employee.name} — перегрузка {pct:.0f}%",
                    description=f"{hours:.1f}ч событий при норме {norm:.0f}ч · {day}",
                )
            )

    return results
