"""СВОЁ ПРАВИЛО: встречи подряд без перерыва 4+ часов = выгорание."""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.time_utils import hours_between
from app.models import Employee, Event

from .base import ConflictResult


# Считаем встречи смежными если перерыв < 10 минут
ADJACENCY_GAP = timedelta(minutes=10)
MIN_CHAIN_HOURS = 4.0


def detect_back_to_back(
    db: Session, employee: Employee, period_start: datetime, period_end: datetime
) -> list[ConflictResult]:
    results: list[ConflictResult] = []

    events = (
        db.query(Event)
        .filter(
            Event.employee_id == employee.id,
            Event.event_type == "meeting",
            Event.start_at >= period_start,
            Event.start_at <= period_end,
        )
        .order_by(Event.start_at)
        .all()
    )

    if len(events) < 2:
        return results

    # Группируем события в "цепочки" смежных
    chain_start = events[0].start_at
    chain_end = events[0].end_at
    chain_count = 1

    for ev in events[1:]:
        if ev.start_at - chain_end <= ADJACENCY_GAP:
            chain_end = max(chain_end, ev.end_at)
            chain_count += 1
        else:
            # Цепочка прервалась — проверяем не была ли она слишком длинной
            duration = hours_between(chain_start, chain_end)
            if duration >= MIN_CHAIN_HOURS and chain_count >= 3:
                day = chain_start.strftime("%d %b")
                severity = "critical" if duration >= 6 else "warning"
                results.append(
                    ConflictResult(
                        employee_id=employee.id,
                        type="back_to_back",
                        severity=severity,
                        title=f"{employee.name} — back-to-back {duration:.0f}ч",
                        description=f"{chain_count} встреч подряд без перерыва · {day}",
                    )
                )
            chain_start = ev.start_at
            chain_end = ev.end_at
            chain_count = 1

    # Проверяем последнюю цепочку
    duration = hours_between(chain_start, chain_end)
    if duration >= MIN_CHAIN_HOURS and chain_count >= 3:
        day = chain_start.strftime("%d %b")
        severity = "critical" if duration >= 6 else "warning"
        results.append(
            ConflictResult(
                employee_id=employee.id,
                type="back_to_back",
                severity=severity,
                title=f"{employee.name} — back-to-back {duration:.0f}ч",
                description=f"{chain_count} встреч подряд без перерыва · {day}",
            )
        )

    return results
