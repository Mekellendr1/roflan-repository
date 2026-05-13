"""Алгоритм подбора оптимального времени встречи.

Логика:
1. Для каждого получасового слота в окне поиска
2. Проверяем что все участники в рабочих часах в своих поясах
3. Проверяем что ни у кого нет конфликтов
4. Считаем score по нескольким факторам:
   - близость к середине рабочего дня каждого участника
   - наличие буфера до/после
   - в рабочих часах ли (жёсткое требование)
5. Возвращаем топ-N слотов
"""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.core.time_utils import overlaps, to_local
from app.models import Employee, Event, Exception_
from app.schemas import MeetingSlotOut


# Параметры алгоритма
SLOT_GRANULARITY_MIN = 30  # рассматриваем слоты с шагом 30 минут
MAX_RESULTS = 4


def find_meeting_slots(
    db: Session,
    employee_ids: list[str],
    duration_minutes: int = 60,
    window_days: int = 7,
    priority: str = "comfort",
) -> list[MeetingSlotOut]:
    """Главная функция: вернуть топ-N оптимальных слотов."""
    employees = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
    if len(employees) < 2:
        return []

    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    window_end = now + timedelta(days=window_days)
    duration = timedelta(minutes=duration_minutes)
    step = timedelta(minutes=SLOT_GRANULARITY_MIN)

    # Загружаем события и исключения один раз
    events_by_emp: dict[str, list[Event]] = {}
    exceptions_by_emp: dict[str, list[Exception_]] = {}
    for emp in employees:
        events_by_emp[emp.id] = (
            db.query(Event)
            .filter(
                Event.employee_id == emp.id,
                Event.end_at >= now,
                Event.start_at <= window_end,
            )
            .all()
        )
        exceptions_by_emp[emp.id] = (
            db.query(Exception_)
            .filter(
                Exception_.employee_id == emp.id,
                Exception_.end_at >= now,
                Exception_.start_at <= window_end,
            )
            .all()
        )

    candidates: list[tuple[int, datetime, str]] = []  # (score, start_utc, reason)

    current = now
    while current + duration <= window_end:
        slot_start = current
        slot_end = current + duration

        # Проверяем каждого участника
        valid = True
        comfort_scores = []
        warnings: list[str] = []

        for emp in employees:
            # 1. В рабочих часах ли в локальном поясе?
            local_start = to_local(slot_start, emp.timezone)
            local_end = to_local(slot_end, emp.timezone)

            if local_start.weekday() >= 5:
                valid = False
                break

            # Жёсткое окно
            if local_start.time() < emp.work_start or local_end.time() > emp.work_end:
                valid = False
                break

            # 2. Нет ли пересечений с событиями
            has_conflict = False
            for ev in events_by_emp[emp.id]:
                if overlaps(slot_start, slot_end, ev.start_at, ev.end_at):
                    has_conflict = True
                    break
            if has_conflict:
                valid = False
                break

            # 3. Нет ли пересечений с отпусками
            has_exception = False
            for exc in exceptions_by_emp[emp.id]:
                if overlaps(slot_start, slot_end, exc.start_at, exc.end_at):
                    has_exception = True
                    break
            if has_exception:
                valid = False
                break

            # 4. Comfort score — насколько близко к середине рабочего дня
            work_mid_hours = (emp.work_start.hour + emp.work_end.hour) / 2
            slot_hour = local_start.hour + local_start.minute / 60
            distance_from_mid = abs(slot_hour - work_mid_hours)
            comfort = max(0, 100 - distance_from_mid * 20)
            comfort_scores.append(comfort)

            # Тэги
            if local_start.hour < emp.work_start.hour + 1:
                warnings.append(f"рановато для {emp.name.split()[0]} ({emp.tz_short})")
            elif local_end.hour > emp.work_end.hour - 1:
                warnings.append(f"поздновато для {emp.name.split()[0]} ({emp.tz_short})")

        if not valid:
            current += step
            continue

        # Финальный score = среднее comfort + бонусы
        score = int(sum(comfort_scores) / len(comfort_scores))
        if not warnings:
            score += 5  # бонус "комфортно всем"
        score = min(score, 100)

        if warnings:
            reason = " · ".join(warnings[:2])
        else:
            reason = "Середина дня для всех · в рабочих часах · нет переработок"

        candidates.append((score, slot_start, reason))
        current += step

    # Сортируем по убыванию score
    candidates.sort(key=lambda x: (-x[0], x[1]))

    # Дедуплицируем по дню (один слот на день)
    seen_days = set()
    unique = []
    for score, start_utc, reason in candidates:
        day = start_utc.date()
        if day in seen_days:
            continue
        seen_days.add(day)
        unique.append((score, start_utc, reason))
        if len(unique) >= MAX_RESULTS:
            break

    # Формируем ответ для фронта
    results = []
    for i, (score, start_utc, reason) in enumerate(unique):
        end_utc = start_utc + duration
        date_str = _format_date_ru(start_utc)
        # Время в МСК как базовом
        msk_start = to_local(start_utc, "Europe/Moscow")
        msk_end = to_local(end_utc, "Europe/Moscow")
        time_str = f"{msk_start.strftime('%H:%M')}–{msk_end.strftime('%H:%M')} МСК"

        # Все пояса
        tzs_parts = []
        for emp in employees:
            local = to_local(start_utc, emp.timezone)
            tzs_parts.append(f"{local.strftime('%H:%M')} {emp.tz_short}")
        # Дедупликация по поясу
        seen_tz = set()
        unique_tzs = []
        for part in tzs_parts:
            tz_label = part.split()[-1]
            if tz_label not in seen_tz:
                seen_tz.add(tz_label)
                unique_tzs.append(part)
        tzs_str = " · ".join(unique_tzs)

        results.append(
            MeetingSlotOut(
                score=score,
                optimal=(i == 0),
                date=date_str,
                time=time_str,
                tzs=tzs_str,
                reason=reason,
            )
        )

    return results


def _format_date_ru(dt: datetime) -> str:
    """13 мая (среда) → 'Ср, 13 мая'."""
    weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    months = [
        "янв", "фев", "мар", "апр", "мая", "июн",
        "июл", "авг", "сен", "окт", "ноя", "дек",
    ]
    return f"{weekdays[dt.weekday()]}, {dt.day} {months[dt.month - 1]}"
