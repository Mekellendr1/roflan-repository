"""Детектор: HR говорит «отпуск», а в календаре стоит встреча."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.core.time_utils import overlaps
from app.models import Employee, Event, Exception_

from .base import ConflictResult


HR_TYPES = {"vacation", "sick", "day_off"}


def detect_hr_mismatch(
    db: Session, employee: Employee, period_start: datetime, period_end: datetime
) -> list[ConflictResult]:
    results: list[ConflictResult] = []

    # Все исключения из HR в периоде
    exceptions = (
        db.query(Exception_)
        .filter(
            Exception_.employee_id == employee.id,
            Exception_.type.in_(HR_TYPES),
            Exception_.end_at >= period_start,
            Exception_.start_at <= period_end,
        )
        .all()
    )

    if not exceptions:
        return results

    # Все события
    events = (
        db.query(Event)
        .filter(
            Event.employee_id == employee.id,
            Event.start_at >= period_start,
            Event.start_at <= period_end,
        )
        .all()
    )

    for exc in exceptions:
        for event in events:
            if overlaps(exc.start_at, exc.end_at, event.start_at, event.end_at):
                exc_label = {"vacation": "отпуск", "sick": "больничный", "day_off": "выходной"}.get(
                    exc.type, exc.type
                )
                day = event.start_at.strftime("%d %b")
                t = event.start_at.strftime("%H:%M")
                results.append(
                    ConflictResult(
                        employee_id=employee.id,
                        type="hr_mismatch",
                        severity="warning",
                        title=f"{employee.name} — HR ≠ календарь",
                        description=f"HR: {exc_label} · Календарь: «{event.title}» {day} {t}",
                        event_id=event.id,
                    )
                )

    return results
