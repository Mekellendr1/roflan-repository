"""Эндпоинты профиля сотрудника.

POST /profile/setup  — заполнить профиль (создаёт Employee + генерирует события)
GET  /profile/me     — текущий профиль авторизованного пользователя
PUT  /profile/me     — обновить профиль
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models import Employee, User
from app.services.events_generator import generate_events, maybe_generate_exception
from app.services.metrics import employee_to_dict

router = APIRouter(prefix="/profile", tags=["profile"])

TZ_OFFSETS = {
    "Europe/Moscow": ("МСК", 3),
    "Europe/Vilnius": ("VNO", 2),
    "Europe/Lisbon": ("LIS", 0),
    "Europe/London": ("LON", 0),
    "Europe/Berlin": ("BER", 1),
    "Asia/Novosibirsk": ("НСК", 7),
    "Asia/Yekaterinburg": ("ЕКБ", 5),
    "America/New_York": ("NYC", -5),
    "America/Los_Angeles": ("LAX", -8),
    "UTC": ("UTC", 0),
}


class ProfileSetupRequest(BaseModel):
    role: str           # должность
    team: str           # команда
    timezone: str       # Europe/Moscow и т.д.
    work_format: str    # Офис / Удалёнка / Гибрид
    work_start: int     # час начала работы (9)
    work_end: int       # час конца (18)
    schedule_days: str = "0,1,2,3,4"  # 0=Пн


class ProfileUpdateRequest(BaseModel):
    role: str | None = None
    team: str | None = None
    timezone: str | None = None
    work_format: str | None = None
    work_start: int | None = None
    work_end: int | None = None
    schedule_days: str | None = None


def _make_initials(full_name: str) -> str:
    parts = full_name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return full_name[:2].upper()


@router.post("/setup")
def setup_profile(
    body: ProfileSetupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Заполнить профиль сотрудника. Вызывается один раз после регистрации."""
    if current_user.profile_filled:
        raise HTTPException(status_code=400, detail="Профиль уже заполнен. Используйте PUT /profile/me")

    if body.timezone not in TZ_OFFSETS:
        raise HTTPException(status_code=400, detail=f"Неизвестный часовой пояс: {body.timezone}")

    tz_short, tz_offset = TZ_OFFSETS[body.timezone]

    emp = Employee(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=current_user.full_name or current_user.username,
        initials=_make_initials(current_user.full_name or current_user.username),
        role=body.role,
        team=body.team,
        timezone=body.timezone,
        tz_short=tz_short,
        tz_offset=tz_offset,
        work_format=body.work_format,
        hr_format=body.work_format,  # изначально совпадают
        schedule_days=body.schedule_days,
        work_start=body.work_start,
        work_end=body.work_end,
        last_update=datetime.now(timezone.utc).isoformat(),
        activity_tz_shift=False,
    )
    db.add(emp)
    db.flush()  # получаем emp.id

    # Генерируем синтетические события из "внешних систем"
    for event in generate_events(emp):
        db.add(event)
    for exc in maybe_generate_exception(emp):
        db.add(exc)

    # Помечаем профиль как заполненный
    current_user.profile_filled = True
    db.commit()
    db.refresh(emp)

    return employee_to_dict(emp)


@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.profile_filled:
        return {"profile_filled": False}

    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        return {"profile_filled": False}

    result = employee_to_dict(emp)
    result["profile_filled"] = True
    return result


@router.put("/me")
def update_my_profile(
    body: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Профиль не найден")

    if body.role is not None:
        emp.role = body.role
    if body.team is not None:
        emp.team = body.team
    if body.timezone is not None:
        if body.timezone not in TZ_OFFSETS:
            raise HTTPException(status_code=400, detail=f"Неизвестный часовой пояс: {body.timezone}")
        emp.timezone = body.timezone
        emp.tz_short, emp.tz_offset = TZ_OFFSETS[body.timezone]
    if body.work_format is not None:
        emp.work_format = body.work_format
    if body.work_start is not None:
        emp.work_start = body.work_start
    if body.work_end is not None:
        emp.work_end = body.work_end
    if body.schedule_days is not None:
        emp.schedule_days = body.schedule_days

    emp.last_update = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(emp)

    result = employee_to_dict(emp)
    result["profile_filled"] = True
    return result
