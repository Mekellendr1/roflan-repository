"""SQLAlchemy модели. Все таблицы в одном файле для простоты."""

from datetime import datetime, time

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    initials: Mapped[str] = mapped_column(String(4), nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    team: Mapped[str] = mapped_column(String, nullable=False)

    timezone: Mapped[str] = mapped_column(String, nullable=False)  # IANA, e.g. Europe/Moscow
    tz_short: Mapped[str] = mapped_column(String(5), nullable=False)  # для UI
    tz_offset: Mapped[int] = mapped_column(Integer, nullable=False)  # для UI
    work_format: Mapped[str] = mapped_column(String, nullable=False)  # office | remote | hybrid

    # Базовый график (упрощённо: одно окно пн-пт)
    work_start: Mapped[time] = mapped_column(Time, nullable=False)
    work_end: Mapped[time] = mapped_column(Time, nullable=False)

    schedule_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    events = relationship("Event", back_populates="employee", cascade="all, delete-orphan")
    exceptions = relationship("Exception_", back_populates="employee", cascade="all, delete-orphan")
    conflicts = relationship("Conflict", back_populates="employee", cascade="all, delete-orphan")


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)  # calendar | hr | tasks | manual
    icon: Mapped[str] = mapped_column(String, default="calendar")
    status: Mapped[str] = mapped_column(String, default="active")  # active | stale
    last_sync_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    records_count: Mapped[int] = mapped_column(Integer, default=0)


class Event(Base):
    """Встреча/задача/блок фокус-времени."""

    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)  # UTC
    end_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    event_type: Mapped[str] = mapped_column(String, default="meeting")  # meeting | task | focus
    source_id: Mapped[str | None] = mapped_column(ForeignKey("sources.id"), nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)

    employee = relationship("Employee", back_populates="events")


class Exception_(Base):
    """Отклонение от базового графика: отпуск, больничный, переработка."""

    __tablename__ = "exceptions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id"), nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)  # vacation | sick | day_off
    start_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_id: Mapped[str | None] = mapped_column(ForeignKey("sources.id"), nullable=True)

    employee = relationship("Employee", back_populates="exceptions")


class Conflict(Base):
    """Обнаруженный конфликт. Перезаписывается при каждом /recalculate."""

    __tablename__ = "conflicts"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id"), nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    severity: Mapped[str] = mapped_column(String, nullable=False)  # critical | warning | low
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    event_id: Mapped[str | None] = mapped_column(ForeignKey("events.id"), nullable=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)

    employee = relationship("Employee", back_populates="conflicts")


class RiskMetric(Base):
    """Снимок риска сотрудника на конкретную дату. Для графика истории."""

    __tablename__ = "risk_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    workload_pct: Mapped[float] = mapped_column(Float, default=0.0)
    overtime_hours: Mapped[float] = mapped_column(Float, default=0.0)
    conflict_count: Mapped[int] = mapped_column(Integer, default=0)
    staleness_days: Mapped[int] = mapped_column(Integer, default=0)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    who: Mapped[str] = mapped_column(String, nullable=False)  # отображаемое имя
    text: Mapped[str] = mapped_column(Text, nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)
    urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
