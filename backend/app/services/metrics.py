"""ЯДРО СИСТЕМЫ. Все показатели из ТЗ (раздел 6,7,9,10) в работающем коде.

Порт фронтового src/lib/metrics.ts на Python. Возвращает структуры,
идентичные тем, что ожидает фронт (EmployeeComputed, метрики и т.д.).
"""

from datetime import datetime, timezone

from app.core.config import settings
from app.models import Employee

D_MAX = settings.d_max_days  # 90 — макс. период без обновления
OVERLOAD = settings.overload_threshold  # 0.8 — порог перегрузки

# Веса Ri = w1(1-Ai) + w2·Ci + w3·Li + w4·Zi + w5·Hi (раздел 10)
W = {"a": 0.25, "c": 0.30, "l": 0.25, "z": 0.10, "h": 0.10}


def _days_since(iso: str) -> int:
    then = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    if then.tzinfo is None:
        then = then.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    return max(0, (now - then).days)


def _sched_days(emp: Employee) -> list[int]:
    return [int(x) for x in emp.schedule_days.split(",") if x != ""]


def _in_schedule(ev, emp: Employee) -> bool:
    days = _sched_days(emp)
    return (
        ev.day in days
        and ev.start_hour >= emp.work_start
        and ev.end_hour <= emp.work_end
    )


def compute_metrics(emp: Employee) -> dict:
    """Посчитать все показатели сотрудника. Возвращает dict под фронт."""
    di = _days_since(emp.last_update)

    # Ai = 1 - di/D (раздел 6)
    Ai = max(0.0, 1 - di / D_MAX)

    # Ci = Mout / Mall (раздел 7)
    all_ev = [e for e in emp.events if e.event_type != "focus"]
    out = [e for e in all_ev if not _in_schedule(e, emp)]
    Ci = (len(out) / len(all_ev)) if all_ev else 0.0

    # Li = Hbusy / Hwork (раздел 9)
    work = (emp.work_end - emp.work_start) * len(_sched_days(emp))
    busy = sum(
        (e.end_hour - e.start_hour)
        for e in emp.events
        if e.event_type != "focus"
    )
    Li = (busy / work) if work else 0.0

    # Количество конфликтов: двойные брони + вне графика
    conf = 0
    srt = sorted(emp.events, key=lambda e: (e.day, e.start_hour))
    for i in range(len(srt)):
        for j in range(i + 1, len(srt)):
            if srt[j].day != srt[i].day:
                break
            if srt[j].start_hour < srt[i].end_hour:
                conf += 1
    conf += len(
        [e for e in emp.events if not _in_schedule(e, emp) and e.event_type != "focus"]
    )

    # Zi — смена пояса; Hi — расхождение HR/профиль
    Zi = 1 if emp.activity_tz_shift else 0
    Hi = 1 if emp.work_format != emp.hr_format else 0

    # Ri = w1(1-Ai)+w2·Ci+w3·Li+w4·Zi+w5·Hi (раздел 10)
    Ri = min(
        1.0,
        W["a"] * (1 - Ai)
        + W["c"] * Ci
        + W["l"] * min(Li, 1.5)
        + W["z"] * Zi
        + W["h"] * Hi,
    )

    if Ri >= 0.7:
        lvl = "critical"
    elif Ri >= 0.5:
        lvl = "high"
    elif Ri >= 0.3:
        lvl = "medium"
    else:
        lvl = "low"

    has_exc = len(emp.exceptions) > 0

    # Рекомендации (раздел 16) — объяснимые
    recs = []

    def push(action, reason, prio, cat):
        recs.append(
            {
                "id": f"{emp.id}-{len(recs)}",
                "empId": emp.id,
                "empName": emp.name,
                "action": action,
                "reason": reason,
                "priority": prio,
                "category": cat,
            }
        )

    if Ai < 0.6:
        push(
            "Попросить сотрудника подтвердить график",
            f"График не обновлялся {di} дн. (актуальность {round(Ai*100)}%)",
            "high",
            "schedule",
        )
    if Ci > 0.25:
        push(
            "Перенести регулярные встречи в рабочее окно",
            f"{round(Ci*100)}% встреч проходят вне графика",
            "high",
            "meeting",
        )
    if Li > OVERLOAD:
        push(
            "Снизить количество встреч на этой неделе",
            f"Загрузка {round(Li*100)}% — выше порога перегрузки 80%",
            "high",
            "workload",
        )
    if Zi:
        push(
            "Обновить часовой пояс в профиле",
            "Фактическая активность не совпадает с заявленным поясом",
            "medium",
            "timezone",
        )
    if Hi:
        push(
            "Сверить формат работы с HR-системой",
            f"HR: {emp.hr_format}, профиль: {emp.work_format}",
            "medium",
            "hr",
        )
    if has_exc:
        push(
            "Не назначать задачи на период отсутствия",
            "У сотрудника есть активные исключения",
            "low",
            "schedule",
        )
    if not recs:
        push("Действий не требуется", "График актуален, конфликтов нет", "low", "schedule")

    prio = round(min(100, Ri * 80 + (di / D_MAX) * 20))

    return {
        "daysSinceUpdate": di,
        "actuality": Ai,
        "outOfHoursRatio": Ci,
        "conflictCount": conf,
        "workload": Li,
        "hasExceptions": has_exc,
        "timezoneShift": Zi,
        "hrMismatch": Hi,
        "integralRisk": Ri,
        "riskLevel": lvl,
        "recommendations": recs,
        "actualizationPriority": prio,
        "busyHours": busy,
        "workHours": work,
        "meetingsTotal": len(all_ev),
        "meetingsOutOfHours": len(out),
    }


def employee_to_dict(emp: Employee) -> dict:
    """Полный EmployeeComputed под фронтовый тип."""
    return {
        "id": emp.id,
        "name": emp.name,
        "initials": emp.initials,
        "role": emp.role,
        "team": emp.team,
        "timezone": emp.timezone,
        "tzShort": emp.tz_short,
        "tzOffset": emp.tz_offset,
        "format": emp.work_format,
        "hrFormat": emp.hr_format,
        "schedule": {
            "days": _sched_days(emp),
            "startHour": emp.work_start,
            "endHour": emp.work_end,
        },
        "lastUpdate": emp.last_update,
        "activityTimezoneShift": emp.activity_tz_shift,
        "events": [
            {
                "id": e.id,
                "title": e.title,
                "day": e.day,
                "startHour": e.start_hour,
                "endHour": e.end_hour,
                "type": e.event_type,
                "source": e.source,
            }
            for e in emp.events
        ],
        "exceptions": [
            {
                "id": x.id,
                "type": x.type,
                "startDate": "",
                "endDate": "",
                "note": x.note,
                "source": x.source,
            }
            for x in emp.exceptions
        ],
        "metrics": compute_metrics(emp),
    }
