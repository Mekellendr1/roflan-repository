"""Хелпер: превращение модели Employee в формат для фронта."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Conflict, Employee
from app.schemas import EmployeeOut
from app.services.risk_calculator import calculate_risk, score_to_color


def employee_to_dict(db: Session, emp: Employee) -> dict:
    """Собрать EmployeeOut для фронта."""
    metrics = calculate_risk(db, emp, period_days=7)
    color = score_to_color(metrics["risk_score"])

    # Соберём теги для карточки
    conflicts = db.query(Conflict).filter(Conflict.employee_id == emp.id).all()
    tags: list[str] = []
    if metrics["workload_pct"] > 100:
        tags.append(f"{metrics['workload_pct']}% загрузка")
    if metrics["conflict_count"] > 0:
        tags.append(f"{metrics['conflict_count']} конфликта" if metrics['conflict_count'] < 5 else f"{metrics['conflict_count']} конфликтов")
    # Найдём специфичные типы для фишек
    types = {c.type for c in conflicts}
    if "out_of_hours" in types:
        tags.append("встречи 22:00+")
    if "back_to_back" in types:
        tags.append("back-to-back")
    if "hr_mismatch" in types:
        tags.append("HR ≠ календарь")
    if "stale_schedule" in types:
        tags.append(f"график {metrics['staleness_days']} дн")
    if not tags:
        tags = ["в норме"]

    schedule_str = f"{emp.work_start.strftime('%H:%M')}–{emp.work_end.strftime('%H:%M')}"

    return {
        "id": emp.id,
        "name": emp.name,
        "initials": emp.initials,
        "role": emp.role,
        "team": emp.team,
        "tz": emp.timezone,
        "tzShort": emp.tz_short,
        "tzOffset": emp.tz_offset,
        "format": emp.work_format,
        "schedule": schedule_str,
        "scheduleUpdated": metrics["staleness_days"],
        "riskScore": metrics["risk_score"],
        "workload": metrics["workload_pct"],
        "overtime": metrics["overtime_hours"],
        "conflicts": metrics["conflict_count"],
        "color": color,
        "tags": tags[:3],  # максимум 3
    }
