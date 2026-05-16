"""Модели БД. Хранят СЫРЫЕ данные (профиль, события, исключения).

Показатели (Ai, Ci, Li, Ri ...) НЕ хранятся — они считаются на лету
сервисом app/services/metrics.py по формулам из ТЗ. Это удовлетворяет
требование раздела 14 «показатели в работающем коде».
"""

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


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
