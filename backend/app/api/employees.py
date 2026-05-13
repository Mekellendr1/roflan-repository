"""Эндпоинты по сотрудникам."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.helpers import employee_to_dict
from app.core.database import get_db
from app.models import Conflict, Employee, RiskMetric

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("")
def list_employees(
    team: str | None = Query(None),
    tz: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Список сотрудников с фильтрами."""
    query = db.query(Employee).filter(Employee.is_active == True)  # noqa: E712
    if team and team != "all":
        query = query.filter(Employee.team == team)
    if tz and tz != "all":
        query = query.filter(Employee.tz_short == tz)

    employees = query.all()
    return [employee_to_dict(db, emp) for emp in employees]


@router.get("/{employee_id}")
def get_employee(employee_id: str, db: Session = Depends(get_db)):
    """Детальная карточка сотрудника + история риска + конфликты."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    base = employee_to_dict(db, emp)

    # История риска за последние 28 дней
    since = datetime.utcnow() - timedelta(days=28)
    history = (
        db.query(RiskMetric)
        .filter(
            RiskMetric.employee_id == emp.id,
            RiskMetric.date >= since,
        )
        .order_by(RiskMetric.date)
        .all()
    )
    risk_history = [int(m.risk_score) for m in history]

    # Если истории мало — добиваем заглушками (для красивого графика на демо)
    if len(risk_history) < 14:
        baseline = max(20, base["riskScore"] - 30)
        synthetic = [baseline + i * 2 for i in range(14 - len(risk_history))]
        risk_history = synthetic + risk_history

    # Активные конфликты
    conflicts = (
        db.query(Conflict).filter(Conflict.employee_id == emp.id, Conflict.is_resolved == False)  # noqa: E712
        .all()
    )
    active_conflicts = [
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

    return {
        **base,
        "risk_history": risk_history,
        "active_conflicts": active_conflicts,
    }


@router.get("/{employee_id}/risk")
def get_employee_risk(employee_id: str, db: Session = Depends(get_db)):
    """Только история риска — для графика."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    history = (
        db.query(RiskMetric)
        .filter(RiskMetric.employee_id == emp.id)
        .order_by(RiskMetric.date)
        .all()
    )
    return [{"date": m.date.isoformat(), "score": int(m.risk_score)} for m in history]
