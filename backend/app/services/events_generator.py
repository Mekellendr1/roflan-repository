"""Генерация синтетических событий для нового сотрудника.

Имитирует данные из Google Calendar / Jira / Табеля.
Вызывается один раз при заполнении профиля.
"""

import random
import uuid

from app.models import Employee, Event, Exception_

MEETING_TITLES = [
    "Standup", "Sprint planning", "Ретроспектива", "Code review",
    "1:1 с менеджером", "Design review", "Roadmap sync", "Демо",
    "Архитектурное совещание", "Планёрка", "Онбординг", "Техдолг",
    "PR review", "Командный синк", "Обсуждение задач",
]

FOCUS_TITLES = [
    "Глубокая работа", "Время без встреч", "Focus block", "Разработка",
]


def generate_events(emp: Employee) -> list[Event]:
    """Создаёт реалистичные события на 5 рабочих дней."""
    random.seed(emp.user_id)  # детерминировано по user_id
    events = []
    days = [int(d) for d in emp.schedule_days.split(",") if d]

    for day in days[:5]:
        # 2-5 встреч в день
        n_meetings = random.randint(2, 5)
        hour = emp.work_start

        for _ in range(n_meetings):
            duration = random.choice([0.5, 1, 1.5, 2])
            # иногда встреча выходит за рамки рабочего времени (конфликт)
            if random.random() < 0.15:
                start = emp.work_end - 0.5
            else:
                start = hour + random.uniform(0, 1)
            start = round(start * 2) / 2  # кратно 30 мин
            end = start + duration

            if end > 24:
                continue

            title = random.choice(MEETING_TITLES)
            events.append(Event(
                id=str(uuid.uuid4()),
                employee_id=emp.id,
                title=title,
                day=day,
                start_hour=start,
                end_hour=end,
                event_type="meeting",
                source="Google Calendar",
            ))
            hour = end + random.uniform(0, 0.5)

        # 1 фокус-блок в день с вероятностью 40%
        if random.random() < 0.4:
            focus_start = round((emp.work_start + random.uniform(1, 3)) * 2) / 2
            focus_end = focus_start + 2
            if focus_end <= emp.work_end:
                events.append(Event(
                    id=str(uuid.uuid4()),
                    employee_id=emp.id,
                    title=random.choice(FOCUS_TITLES),
                    day=day,
                    start_hour=focus_start,
                    end_hour=focus_end,
                    event_type="focus",
                    source="Google Calendar",
                ))

    return events


def maybe_generate_exception(emp: Employee) -> list[Exception_]:
    """С вероятностью 25% создаёт одно исключение (отпуск/больничный/командировка)."""
    random.seed(emp.user_id + "_exc")
    if random.random() > 0.25:
        return []

    exc_type = random.choice(["vacation", "sick", "business_trip"])
    notes = {
        "vacation": "Ежегодный отпуск",
        "sick": "Больничный лист",
        "business_trip": "Командировка",
    }
    return [Exception_(
        id=str(uuid.uuid4()),
        employee_id=emp.id,
        type=exc_type,
        note=notes[exc_type],
        source="HR System",
    )]
