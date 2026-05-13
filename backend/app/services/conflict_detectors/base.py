"""Базовый интерфейс детектора конфликтов.

Все детекторы возвращают список словарей с одинаковой структурой,
которые потом сохраняются как объекты Conflict.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

from sqlalchemy.orm import Session

from app.models import Employee


@dataclass
class ConflictResult:
    """Найденный конфликт. Конструктор для словаря, удобнее чем dict."""

    employee_id: str
    type: str
    severity: str  # critical | warning | low
    title: str
    description: str
    event_id: str | None = None

    def to_dict(self) -> dict:
        return {
            "employee_id": self.employee_id,
            "type": self.type,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "event_id": self.event_id,
        }


class Detector(Protocol):
    """Интерфейс детектора."""

    def __call__(
        self, db: Session, employee: Employee, period_start: datetime, period_end: datetime
    ) -> list[ConflictResult]: ...
