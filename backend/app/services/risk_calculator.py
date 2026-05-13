"""Расчёт риск-скора сотрудника.

Формула — взвешенная сумма 4 компонентов:
- 40% загрузка (workload)
- 30% конфликты за период
- 20% доля встреч вне рабочих часов
- 10% давность обновления графика

Веса обоснованы тем, что загрузка — самый объективный и важный сигнал,
а давность графика — самый слабый (это административный, а не операционный фактор).
"""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.time_utils import hours_between, is_within_hours, to_local
from app.models import Conflict, Employee, Event, RiskMetric


# Веса в формуле
W_WORKLOAD = 0.4
W_CONFLICTS = 0.3
W_OUT_OF_HOURS = 0.2
W_STALENESS = 0.1


def calculate_risk(
    db: Session, employee: Employee, period_days: int = 7
) -> dict:
    """Вернуть метрики риска для сотрудника за last 7 + next 14 days."""
    now = datetime.utcnow()
    period_start = now - timedelta(days=7)
    period_end = now + timedelta(days=14)

    # 1. Загрузка — берём максимум по дням (для демо нагляднее)
    events = (
        db.query(Event)
        .filter(
            Event.employee_id == employee.id,
            Event.start_at >= period_start,
            Event.start_at <= period_end,
        )
        .all()
    )

    # Группируем часы по локальному дню сотрудника
    hours_by_day: dict = {}
    for e in events:
        local = to_local(e.start_at, employee.timezone)
        day = local.date()
        hours_by_day.setdefault(day, 0)
        hours_by_day[day] += hours_between(e.start_at, e.end_at)

    if hours_by_day:
        max_day_hours = max(hours_by_day.values())
        workload_pct = (max_day_hours / 8) * 100
        overtime_hours = max(0, max_day_hours - 8)
    else:
        workload_pct = 0
        overtime_hours = 0

    # 2. Конфликты
    conflict_count = (
        db.query(Conflict).filter(Conflict.employee_id == employee.id).count()
    )

    # 3. Доля встреч вне рабочих часов
    out_of_hours = 0
    for ev in events:
        if not is_within_hours(ev.start_at, employee.work_start, employee.work_end, employee.timezone):
            out_of_hours += 1
        else:
            # Проверим выходные
            local = to_local(ev.start_at, employee.timezone)
            if local.weekday() >= 5:
                out_of_hours += 1

    out_of_hours_pct = (out_of_hours / len(events) * 100) if events else 0

    # 4. Давность графика
    staleness_days = (now - employee.schedule_updated_at).days

    # Нормализуем всё в шкалу 0..100. Критические конфликты сильно поднимают риск.
    critical_count = (
        db.query(Conflict)
        .filter(Conflict.employee_id == employee.id, Conflict.severity == "critical")
        .count()
    )
    critical_bonus = min(critical_count * 15, 40)  # каждый критический +15, max +40

    score = (
        W_WORKLOAD * min(workload_pct, 150) / 150 * 100
        + W_CONFLICTS * min(conflict_count, 8) / 8 * 100
        + W_OUT_OF_HOURS * out_of_hours_pct
        + W_STALENESS * min(staleness_days, 30) / 30 * 100
        + critical_bonus
    )

    return {
        "workload_pct": round(workload_pct),
        "overtime_hours": round(overtime_hours, 1),
        "conflict_count": conflict_count,
        "staleness_days": staleness_days,
        "risk_score": round(min(score, 100)),
    }


def save_risk_snapshot(db: Session, employee: Employee, metrics: dict) -> None:
    """Сохранить снимок риска на сегодня."""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    existing = (
        db.query(RiskMetric)
        .filter(RiskMetric.employee_id == employee.id, RiskMetric.date == today)
        .first()
    )

    if existing:
        existing.workload_pct = metrics["workload_pct"]
        existing.overtime_hours = metrics["overtime_hours"]
        existing.conflict_count = metrics["conflict_count"]
        existing.staleness_days = metrics["staleness_days"]
        existing.risk_score = metrics["risk_score"]
    else:
        db.add(
            RiskMetric(
                employee_id=employee.id,
                date=today,
                workload_pct=metrics["workload_pct"],
                overtime_hours=metrics["overtime_hours"],
                conflict_count=metrics["conflict_count"],
                staleness_days=metrics["staleness_days"],
                risk_score=metrics["risk_score"],
            )
        )
    db.commit()


def score_to_color(score: int) -> str:
    if score >= 70:
        return "red"
    if score >= 40:
        return "amber"
    return "green"
