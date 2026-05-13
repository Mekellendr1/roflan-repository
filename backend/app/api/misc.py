"""Эндпоинты источников, уведомлений, общей статистики."""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Conflict, Employee, Notification, Source
from app.schemas import DashboardStats
from app.services.risk_calculator import calculate_risk

router = APIRouter(tags=["misc"])


@router.get("/sources")
def list_sources(db: Session = Depends(get_db)):
    """Список источников данных со статусом."""
    sources = db.query(Source).all()
    result = []
    for s in sources:
        delta_min = (datetime.utcnow() - s.last_sync_at).total_seconds() / 60
        if delta_min < 60:
            last_sync = f"{int(delta_min)} мин назад"
        elif delta_min < 60 * 24:
            last_sync = f"{int(delta_min / 60)} ч назад"
        else:
            last_sync = f"{int(delta_min / 60 / 24)} дн назад"
        result.append(
            {
                "id": s.id,
                "name": s.name,
                "type": s.type,
                "icon": s.icon,
                "status": s.status,
                "lastSync": last_sync,
                "records": s.records_count,
            }
        )
    return result


@router.get("/notifications")
def list_notifications(db: Session = Depends(get_db)):
    """Список уведомлений «что нужно сделать»."""
    items = db.query(Notification).order_by(
        Notification.urgent.desc(), Notification.created_at.desc()
    ).all()
    return [
        {
            "id": n.id,
            "urgent": n.urgent,
            "who": n.who,
            "text": n.text,
            "action": n.action,
        }
        for n in items
    ]


@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    """Карточки сверху дашборда."""
    employees = db.query(Employee).filter(Employee.is_active == True).all()  # noqa: E712
    total_conflicts = db.query(Conflict).filter(Conflict.is_resolved == False).count()  # noqa: E712

    at_risk = 0
    total_load = 0
    stale = 0
    for emp in employees:
        metrics = calculate_risk(db, emp)
        if metrics["risk_score"] >= 70:
            at_risk += 1
        total_load += metrics["workload_pct"]
        if metrics["staleness_days"] > 14:
            stale += 1

    avg_load = round(total_load / len(employees)) if employees else 0

    return DashboardStats(
        conflicts=total_conflicts,
        at_risk=at_risk,
        avg_load=avg_load,
        stale=stale,
    )
