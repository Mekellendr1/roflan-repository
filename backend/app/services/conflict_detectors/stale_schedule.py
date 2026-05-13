"""Детектор: график не обновлялся слишком долго."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Employee

from .base import ConflictResult


STALE_THRESHOLD_DAYS = 14


def detect_stale_schedule(
    db: Session, employee: Employee, period_start: datetime, period_end: datetime
) -> list[ConflictResult]:
    days_old = (datetime.utcnow() - employee.schedule_updated_at).days

    if days_old <= STALE_THRESHOLD_DAYS:
        return []

    return [
        ConflictResult(
            employee_id=employee.id,
            type="stale_schedule",
            severity="low",
            title=f"{employee.name} — устаревший график",
            description=f"График не обновлялся {days_old} дней · требуется подтверждение",
        )
    ]
