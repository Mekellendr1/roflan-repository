"""Эндпоинты доступности и подбора времени."""

from datetime import date as date_type, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import MeetingRequest, MeetingSlotOut
from app.services.availability import get_availability_grid
from app.services.meeting_finder import find_meeting_slots

router = APIRouter(tags=["availability"])


@router.get("/availability")
def availability(
    employee_ids: str = Query(..., description="Через запятую: e1,e2,e3"),
    target_date: str | None = Query(None, description="ISO дата, по умолчанию сегодня"),
    viewer_tz: str = Query("Europe/Moscow"),
    db: Session = Depends(get_db),
):
    """Сетка доступности по сотрудникам и часам."""
    ids = [x.strip() for x in employee_ids.split(",") if x.strip()]
    target = (
        date_type.fromisoformat(target_date) if target_date else datetime.utcnow().date()
    )
    return get_availability_grid(db, ids, target, viewer_tz)


@router.post("/meetings/suggest-time")
def suggest_meeting_time(request: MeetingRequest, db: Session = Depends(get_db)):
    """Подобрать топ-N оптимальных слотов."""
    slots = find_meeting_slots(
        db,
        employee_ids=request.employee_ids,
        duration_minutes=request.duration_minutes,
        window_days=request.window_days,
        priority=request.priority,
    )
    return slots
