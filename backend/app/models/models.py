"""Модели БД. Хранят СЫРЫЕ данные (профиль, события, исключения).

Показатели (Ai, Ci, Li, Ri ...) НЕ хранятся — они считаются на лету
сервисом app/services/metrics.py по формулам из ТЗ. Это удовлетворяет
требование раздела 14 «показатели в работающем коде».
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ===== AUTH / PROJECTS =====

class User(Base):
    """Системный пользователь (аккаунт)."""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    owned_projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    memberships = relationship("ProjectMember", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    """Проект."""
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    owner = relationship("User", back_populates="owned_projects")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")


class ProjectMember(Base):
    """Участник проекта с ролью."""
    __tablename__ = "project_members"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    # owner | admin | editor | viewer
    role: Mapped[str] = mapped_column(String, default="viewer")
    invited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="memberships")


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    initials: Mapped[str] = mapped_column(String(4), nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    team: Mapped[str] = mapped_column(String, nullable=False)

    # ti — часовой пояс
    timezone: Mapped[str] = mapped_column(String, nullable=False)
    tz_short: Mapped[str] = mapped_column(String(8), nullable=False)
    tz_offset: Mapped[int] = mapped_column(Integer, nullable=False)

    # zi — формат работы; hr_format — что записано в HR (может расходиться)
    work_format: Mapped[str] = mapped_column(String, nullable=False)
    hr_format: Mapped[str] = mapped_column(String, nullable=False)

    # si — стандартный график (упрощённо: одно окно пн-пт)
    schedule_days: Mapped[str] = mapped_column(String, default="0,1,2,3,4")
    work_start: Mapped[int] = mapped_column(Integer, nullable=False)
    work_end: Mapped[int] = mapped_column(Integer, nullable=False)

    # ui — дата последнего обновления (ISO-строка)
    last_update: Mapped[str] = mapped_column(String, nullable=False)

    # признак фактической смены пояса по активности (для Zi)
    activity_tz_shift: Mapped[bool] = mapped_column(Boolean, default=False)

    events = relationship(
        "Event", back_populates="employee", cascade="all, delete-orphan"
    )
    exceptions = relationship(
        "Exception_", back_populates="employee", cascade="all, delete-orphan"
    )


class Event(Base):
    """fi — фактическое событие в демо-неделе."""

    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(
        ForeignKey("employees.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    day: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Пн..6=Вс
    start_hour: Mapped[float] = mapped_column(Float, nullable=False)
    end_hour: Mapped[float] = mapped_column(Float, nullable=False)
    event_type: Mapped[str] = mapped_column(String, default="meeting")
    source: Mapped[str] = mapped_column(String, default="Google Calendar")

    employee = relationship("Employee", back_populates="events")


class Exception_(Base):
    """ai — отсутствие/исключение."""

    __tablename__ = "exceptions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    employee_id: Mapped[str] = mapped_column(
        ForeignKey("employees.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String, nullable=False)
    note: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String, default="HR System")

    employee = relationship("Employee", back_populates="exceptions")


class Source(Base):
    """Источник данных (для окна загрузки)."""

    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    icon: Mapped[str] = mapped_column(String, default="calendar")
    status: Mapped[str] = mapped_column(String, default="active")
    last_sync: Mapped[str] = mapped_column(String, default="только что")
    records: Mapped[int] = mapped_column(Integer, default=0)
