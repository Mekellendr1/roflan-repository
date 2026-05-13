"""Pydantic схемы — формат данных для API.

Поля совпадают с типами на фронте (src/lib/types.ts), чтобы фронт работал
без правок при подключении бэка.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

# ============ EMPLOYEES ============


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    initials: str
    role: str
    team: str
    tz: str  # выводим как tz, в БД хранится как timezone
    tzShort: str
    tzOffset: int
    format: str
    schedule: str  # "10:00–19:00" собранное на лету
    scheduleUpdated: int  # дней с момента обновления
    riskScore: int
    workload: int  # %
    overtime: float  # часов
    conflicts: int  # count
    color: Literal["red", "amber", "green"]
    tags: list[str]


# ============ CONFLICTS ============


class ConflictOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    severity: Literal["critical", "warning", "low"]
    type: str
    empId: str
    title: str
    desc: str


# ============ MEETING SCHEDULER ============


class MeetingRequest(BaseModel):
    employee_ids: list[str]
    duration_minutes: int = 60
    window_days: int = 7
    priority: Literal["comfort", "asap", "no_overtime"] = "comfort"


class MeetingSlotOut(BaseModel):
    score: int
    optimal: bool
    date: str
    time: str
    tzs: str
    reason: str


# ============ AVAILABILITY ============


class AvailabilityCell(BaseModel):
    hour: int
    state: Literal["off", "free", "busy", "all"]


class AvailabilityRow(BaseModel):
    employee_id: str
    employee_name: str
    tz_short: str
    cells: list[AvailabilityCell]


class AvailabilityResponse(BaseModel):
    date: str
    hours: list[int]
    rows: list[AvailabilityRow]
    recommendation: dict | None = None


# ============ SOURCES & NOTIFICATIONS ============


class SourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: str
    icon: str
    status: str
    lastSync: str  # "2 мин назад"
    records: int


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    urgent: bool
    who: str
    text: str
    action: str


# ============ EMPLOYEE DETAIL EXTRAS ============


class RiskHistoryPoint(BaseModel):
    date: str
    score: int


class EmployeeDetailOut(EmployeeOut):
    risk_history: list[int]
    active_conflicts: list[ConflictOut]


# ============ STATS ============


class DashboardStats(BaseModel):
    conflicts: int
    at_risk: int
    avg_load: int
    stale: int


class RecalculateResponse(BaseModel):
    conflicts_found: int
    employees_processed: int
    duration_ms: int
