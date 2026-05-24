from pydantic import BaseModel


class MeetingRequest(BaseModel):
    employee_ids: list[str]
    duration: float = 1.0  # часы


class RecalcResponse(BaseModel):
    employees_processed: int
    conflicts_found: int
    duration_ms: int
