"""Детектор: одно и то же время — две встречи."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.core.time_utils import overlaps
from app.models import Employee, Event

from .base import ConflictResult


def detect_double_booking(
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
        .order_by(Event.start_at)
        .all()
    )

    # Проверяем каждую пару событий на пересечение
    for i, ev1 in enumerate(events):
        for ev2 in events[i + 1 :]:
            # Если ev2 начинается после конца ev1 — дальше пар не будет
            if ev2.start_at >= ev1.end_at:
                break
            if overlaps(ev1.start_at, ev1.end_at, ev2.start_at, ev2.end_at):
                day = ev1.start_at.strftime("%d %b")
                t1 = ev1.start_at.strftime("%H:%M")
                results.append(
                    ConflictResult(
                        employee_id=employee.id,
                        type="double_booking",
                        severity="warning",
                        title=f"{employee.name} — двойное бронирование",
                        description=f"«{ev1.title}» и «{ev2.title}» в одно время · {day} {t1}",
                        event_id=ev1.id,
                    )
                )

    return results
