"""Сервис расчёта доступности сотрудников.

Доступность = рабочий график − занятые слоты − исключения (отпуска).
"""

from datetime import date, datetime, time, timedelta
from typing import Literal

from sqlalchemy.orm import Session

from app.core.time_utils import overlaps, to_local
from app.models import Employee, Event, Exception_


CellState = Literal["off", "free", "busy", "all"]


def get_availability_grid(
    db: Session,
    employee_ids: list[str],
    target_date: date,
    viewer_tz: str = "Europe/Moscow",
    hours_range: tuple[int, int] = (8, 20),
) -> dict:
    """Вернуть сетку доступности: для каждого сотрудника, для каждого часа — состояние.

    Часы показаны в `viewer_tz` (поясе пользователя, который смотрит).
    """
    employees = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
    emp_map = {e.id: e for e in employees}

    hours = list(range(hours_range[0], hours_range[1] + 1))

    rows = []
    for emp_id in employee_ids:
        if emp_id not in emp_map:
            continue
        emp = emp_map[emp_id]
        cells = []
        for h in hours:
            state = _compute_cell_state(db, emp, target_date, h, viewer_tz)
            cells.append({"hour": h, "state": state})
        rows.append({
            "employee_id": emp.id,
            "employee_name": emp.name,
            "tz_short": emp.tz_short,
            "cells": cells,
        })

    # Найдём часы где ВСЕ свободны
    if rows:
        for i, h in enumerate(hours):
            all_free = all(row["cells"][i]["state"] == "free" for row in rows)
            if all_free:
                for row in rows:
                    row["cells"][i]["state"] = "all"

    # Рекомендация: первый "all" слот
    recommendation = _find_recommendation(rows, hours, target_date)

    return {
        "date": target_date.isoformat(),
        "hours": hours,
        "rows": rows,
        "recommendation": recommendation,
    }


def _compute_cell_state(
    db: Session, emp: Employee, target_date: date, hour_in_viewer_tz: int, viewer_tz: str
) -> CellState:
    """Состояние одной ячейки часа для конкретного сотрудника."""
    from zoneinfo import ZoneInfo

    # Час в поясе зрителя -> UTC -> локальный пояс сотрудника
    viewer_dt = datetime.combine(target_date, time(hour=hour_in_viewer_tz)).replace(
        tzinfo=ZoneInfo(viewer_tz)
    )
    utc_dt = viewer_dt.astimezone(ZoneInfo("UTC"))
    local_dt = to_local(utc_dt, emp.timezone)

    # Вне рабочих часов?
    is_weekend = local_dt.weekday() >= 5
    if is_weekend or not (emp.work_start <= local_dt.time() < emp.work_end):
        return "off"

    # Час в UTC: с utc_dt до utc_dt + 1 час
    slot_start = utc_dt.replace(tzinfo=None)
    slot_end = slot_start + timedelta(hours=1)

    # Проверка событий
    events = (
        db.query(Event)
        .filter(
            Event.employee_id == emp.id,
            Event.start_at < slot_end,
            Event.end_at > slot_start,
        )
        .first()
    )
    if events:
        return "busy"

    # Проверка отпусков/больничных
    exceptions = (
        db.query(Exception_)
        .filter(
            Exception_.employee_id == emp.id,
            Exception_.start_at < slot_end,
            Exception_.end_at > slot_start,
        )
        .first()
    )
    if exceptions:
        return "busy"

    return "free"


def _find_recommendation(rows: list[dict], hours: list[int], target_date: date) -> dict | None:
    """Найти первый час, когда все свободны."""
    if not rows:
        return None

    for i, h in enumerate(hours):
        if all(row["cells"][i]["state"] == "all" for row in rows):
            return {
                "hour": h,
                "time": f"{h:02d}:00–{h + 1:02d}:00",
                "score": 94,
                "reason": f"Все {len(rows)} участников свободны и в рабочих часах",
            }
    return None
