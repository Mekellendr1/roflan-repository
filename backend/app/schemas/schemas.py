from pydantic import BaseModel


class MeetingRequest(BaseModel):
    employee_ids: list[str]
    duration: float = 1.0  # часы


class RecalcResponse(BaseModel):
    employees_processed: int
    conflicts_found: int
    duration_ms: int


class CreateMeetingRequest(BaseModel):
    employee_ids: list[str]
    day: int
    start_hour: float
    end_hour: float
    title: str = "Встреча"
