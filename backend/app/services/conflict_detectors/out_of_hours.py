"""Детектор: встречи вне рабочих часов сотрудника.

Учитывает часовой пояс! Встреча в 14:00 UTC может быть 17:00 для МСК
(в рабочих) и 23:00 для Австралии (вне рабочих).
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.core.time_utils import to_local
from app.models import Employee, Event

from .base import ConflictResult


def detect_out_of_hours(
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

    for event in events:
        local_start = to_local(event.start_at, employee.timezone)
        local_end = to_local(event.end_at, employee.timezone)

        # Выходные — отдельный случай (тоже out of hours)
        is_weekend = local_start.weekday() >= 5

        # Раннее утро или поздний вечер
        starts_too_early = local_start.time() < employee.work_start
        ends_too_late = local_end.time() > employee.work_end

        if is_weekend or starts_too_early or ends_too_late:
            local_time_str = local_start.strftime("%H:%M")
            day_label = local_start.strftime("%a %d %b")

            if is_weekend:
                desc = f"«{event.title}» в выходной день · {day_label}"
            elif starts_too_early:
                desc = f"«{event.title}» в {local_time_str} {employee.tz_short} (раньше {employee.work_start.strftime('%H:%M')})"
            else:
                desc = f"«{event.title}» в {local_time_str} {employee.tz_short} (позже {employee.work_end.strftime('%H:%M')})"

            results.append(
                ConflictResult(
                    employee_id=employee.id,
                    type="out_of_hours",
                    severity="critical" if starts_too_early or ends_too_late else "warning",
                    title=f"{employee.name} — встреча вне рабочих часов",
                    description=desc,
                    event_id=event.id,
                )
            )

    return results
