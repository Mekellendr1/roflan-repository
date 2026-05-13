"""Эндпоинты конфликтов."""

import time
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Conflict, Employee
from app.schemas import RecalculateResponse
from app.services.conflict_detectors import DETECTORS
from app.services.notifications import regenerate_notifications
from app.services.risk_calculator import calculate_risk, save_risk_snapshot

router = APIRouter(tags=["conflicts"])


@router.get("/conflicts")
def list_conflicts(
    severity: str | None = Query(None),
    type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Список всех конфликтов с фильтрами."""
    query = db.query(Conflict).filter(Conflict.is_resolved == False)  # noqa: E712
    if severity and severity != "all":
        query = query.filter(Conflict.severity == severity)
    if type and type != "all":
        query = query.filter(Conflict.type == type)
    conflicts = query.order_by(
        # Сортировка по серьёзности
        Conflict.severity.desc(), Conflict.detected_at.desc()
    ).all()
    return [
        {
            "id": c.id,
            "severity": c.severity,
            "type": c.type,
            "empId": c.employee_id,
            "title": c.title,
            "desc": c.description,
        }
        for c in conflicts
    ]


@router.post("/recalculate", response_model=RecalculateResponse)
def recalculate(db: Session = Depends(get_db)):
    """Прогнать все детекторы и обновить таблицу конфликтов + риск + уведомления."""
    start = time.time()

    # 1. Очищаем старые конфликты
    db.query(Conflict).delete()
    db.commit()

    # 2. Прогоняем детекторы по всем сотрудникам
    employees = db.query(Employee).filter(Employee.is_active == True).all()  # noqa: E712
    now = datetime.utcnow()
    period_start = now - timedelta(days=7)
    period_end = now + timedelta(days=14)

    total = 0
    for emp in employees:
        for detector in DETECTORS:
            results = detector(db, emp, period_start, period_end)
            for r in results:
                db.add(
                    Conflict(
                        id=str(uuid.uuid4()),
                        employee_id=r.employee_id,
                        type=r.type,
                        severity=r.severity,
                        title=r.title,
                        description=r.description,
                        event_id=r.event_id,
                    )
                )
                total += 1
    db.commit()

    # 3. Пересчитываем риск для каждого
    for emp in employees:
        metrics = calculate_risk(db, emp, period_days=7)
        save_risk_snapshot(db, emp, metrics)

    # 4. Перегенерируем уведомления
    regenerate_notifications(db)

    duration_ms = int((time.time() - start) * 1000)
    return RecalculateResponse(
        conflicts_found=total,
        employees_processed=len(employees),
        duration_ms=duration_ms,
    )
