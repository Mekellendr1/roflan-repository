"""Сервис уведомлений: правила «кому что нужно сделать»."""

import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Conflict, Employee, Notification


def regenerate_notifications(db: Session) -> int:
    """Перегенерировать список уведомлений из текущего состояния системы."""
    # Очищаем старые
    db.query(Notification).delete()

    count = 0

    # Правило 1: критические риски
    high_risk = (
        db.query(Employee)
        .join(Conflict)
        .filter(Conflict.severity == "critical")
        .distinct()
        .all()
    )
    for emp in high_risk:
        name_short = _short_name(emp.name)
        db.add(
            Notification(
                id=str(uuid.uuid4()),
                employee_id=emp.id,
                who=name_short,
                text="обнови график — критический риск",
                action="Открыть",
                urgent=True,
            )
        )
        count += 1

    # Правило 2: HR mismatch — нужно решить
    hr_conflicts = (
        db.query(Conflict).filter(Conflict.type == "hr_mismatch").all()
    )
    for c in hr_conflicts:
        emp = db.query(Employee).filter(Employee.id == c.employee_id).first()
        if not emp:
            continue
        db.add(
            Notification(
                id=str(uuid.uuid4()),
                employee_id=emp.id,
                who=_short_name(emp.name),
                text="подтверди отпуск — есть конфликт с календарём",
                action="Решить",
                urgent=True,
            )
        )
        count += 1

    # Правило 3: устаревшие графики
    stale = (
        db.query(Conflict).filter(Conflict.type == "stale_schedule").all()
    )
    for c in stale:
        emp = db.query(Employee).filter(Employee.id == c.employee_id).first()
        if not emp:
            continue
        db.add(
            Notification(
                id=str(uuid.uuid4()),
                employee_id=emp.id,
                who=_short_name(emp.name),
                text="график давно не обновлялся — подтверди или обнови",
                action="Обновить",
                urgent=False,
            )
        )
        count += 1

    # Правило 4: out of hours
    out_of_hours = (
        db.query(Conflict).filter(Conflict.type == "out_of_hours").all()
    )
    seen_emp = set()
    for c in out_of_hours:
        if c.employee_id in seen_emp:
            continue
        seen_emp.add(c.employee_id)
        emp = db.query(Employee).filter(Employee.id == c.employee_id).first()
        if not emp:
            continue
        db.add(
            Notification(
                id=str(uuid.uuid4()),
                employee_id=emp.id,
                who=_short_name(emp.name),
                text="есть встречи вне рабочих часов — рассмотреть перенос",
                action="Перенести",
                urgent=False,
            )
        )
        count += 1

    db.commit()
    return count


def _short_name(full_name: str) -> str:
    """Иван Петров → Иван П."""
    parts = full_name.split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[1][0]}."
    return full_name
