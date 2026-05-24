"""Производные данные — порт src/lib/derived.ts.

Диагностические группы, конфликты, рекомендации, уведомления,
дорожная карта, командная доступность, подбор времени встреч.
"""

from sqlalchemy.orm import Session

from app.models import Employee
from app.services.metrics import compute_metrics, employee_to_dict

WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]


def _all(db: Session) -> list[dict]:
    emps = db.query(Employee).all()
    return [employee_to_dict(e) for e in emps]


# ===== Диагностические группы (раздел 4, 9 групп) =====
def diagnostic_groups(db: Session) -> list[dict]:
    cd = _all(db)

    def f(pred):
        return [e for e in cd if pred(e["metrics"], e)]

    return [
        {"id": "g1", "title": "Актуальный график", "desc": "Данные свежие, конфликтов нет", "color": "green",
         "employees": f(lambda m, e: m["actuality"] >= 0.7 and m["conflictCount"] == 0)},
        {"id": "g2", "title": "Устаревший график", "desc": "Актуальность < 60%", "color": "amber",
         "employees": f(lambda m, e: m["actuality"] < 0.6)},
        {"id": "g3", "title": "Встречи вне рабочего времени", "desc": "Доля встреч вне графика > 25%", "color": "red",
         "employees": f(lambda m, e: m["outOfHoursRatio"] > 0.25)},
        {"id": "g4", "title": "Высокая нагрузка", "desc": "Загрузка выше порога 80%", "color": "red",
         "employees": f(lambda m, e: m["workload"] > 0.8)},
        {"id": "g5", "title": "Есть временные исключения", "desc": "Отпуск, больничный или командировка", "color": "blue",
         "employees": f(lambda m, e: m["hasExceptions"])},
        {"id": "g6", "title": "Конфликт HR ↔ календарь", "desc": "Формат в HR не совпадает с профилем", "color": "amber",
         "employees": f(lambda m, e: m["hrMismatch"] == 1)},
        {"id": "g7", "title": "Конфликт часового пояса", "desc": "Активность не совпадает с поясом", "color": "amber",
         "employees": f(lambda m, e: m["timezoneShift"] == 1)},
        {"id": "g8", "title": "Нужно подтвердить данные", "desc": "Средний риск", "color": "stone",
         "employees": f(lambda m, e: m["riskLevel"] == "medium")},
        {"id": "g9", "title": "Нужно пересмотреть график", "desc": "Высокий или критический риск", "color": "red",
         "employees": f(lambda m, e: m["riskLevel"] in ("high", "critical"))},
    ]


# ===== Конфликты =====
def all_conflicts(db: Session) -> list[dict]:
    out = []
    emps = db.query(Employee).all()

    def add(e, sev, ty, title, desc):
        out.append({
            "id": f"{e.id}-{ty}-{len(out)}",
            "empId": e.id,
            "empName": e.name,
            "severity": sev,
            "type": ty,
            "title": title,
            "desc": desc,
        })

    for e in emps:
        m = compute_metrics(e)
        if m["workload"] > 1:
            add(e, "critical", "overload", f"{e.name} — перегрузка {round(m['workload']*100)}%",
                f"{m['busyHours']}ч занятости при норме {m['workHours']}ч")
        elif m["workload"] > 0.8:
            add(e, "warning", "overload", f"{e.name} — высокая нагрузка {round(m['workload']*100)}%",
                "Близко к порогу перегрузки")
        if m["outOfHoursRatio"] > 0.25:
            add(e, "critical", "out_of_hours", f"{e.name} — встречи вне графика",
                f"{m['meetingsOutOfHours']} из {m['meetingsTotal']} событий вне рабочего времени")
        if m["hrMismatch"]:
            add(e, "warning", "hr_mismatch", f"{e.name} — HR ≠ профиль",
                f"HR: {e.hr_format}, профиль: {e.work_format}")
        if m["timezoneShift"]:
            add(e, "warning", "timezone", f"{e.name} — смена часового пояса",
                "Активность расходится с заявленным поясом")
        if m["actuality"] < 0.6:
            add(e, "low", "stale_schedule", f"{e.name} — устаревший график",
                f"Не обновлялся {m['daysSinceUpdate']} дней")
        if m["hasExceptions"]:
            note = e.exceptions[0].note if e.exceptions else "Период отсутствия"
            add(e, "low", "exception_overlap", f"{e.name} — активное исключение", note)
        srt = sorted(e.events, key=lambda x: (x.day, x.start_hour))
        for i in range(len(srt)):
            for j in range(i + 1, len(srt)):
                if srt[j].day != srt[i].day:
                    break
                if srt[j].start_hour < srt[i].end_hour:
                    add(e, "warning", "double_booking", f"{e.name} — двойное бронирование",
                        f"«{srt[i].title}» и «{srt[j].title}» пересекаются")

    order = {"critical": 0, "warning": 1, "low": 2}
    return sorted(out, key=lambda c: order[c["severity"]])


# ===== Рекомендации =====
def all_recommendations(db: Session) -> list[dict]:
    emps = db.query(Employee).all()
    recs = []
    for e in emps:
        recs += compute_metrics(e)["recommendations"]
    recs = [r for r in recs if r["action"] != "Действий не требуется"]
    order = {"high": 0, "medium": 1, "low": 2}
    return sorted(recs, key=lambda r: order[r["priority"]])


# ===== Умные уведомления (раздел 16) =====
def smart_notifications(db: Session) -> list[dict]:
    out = []
    for e in db.query(Employee).all():
        m = compute_metrics(e)
        parts = e.name.split(" ")
        short = f"{parts[0]} {parts[1][0]}." if len(parts) > 1 else e.name
        if m["riskLevel"] == "critical":
            out.append({"id": f"n-{e.id}-1", "empId": e.id, "who": short,
                        "text": "обнови график — критический риск неактуальности",
                        "reason": f"Ri = {round(m['integralRisk']*100)}/100",
                        "action": "Открыть", "urgent": True, "category": "Риск"})
        if m["hrMismatch"]:
            out.append({"id": f"n-{e.id}-2", "empId": e.id, "who": short,
                        "text": f"подтверди формат работы (HR: {e.hr_format}, профиль: {e.work_format})",
                        "reason": "Расхождение HR ↔ календарь",
                        "action": "Решить", "urgent": m["riskLevel"] == "high", "category": "HR"})
        if m["outOfHoursRatio"] > 0.25:
            out.append({"id": f"n-{e.id}-3", "empId": e.id, "who": short,
                        "text": "рассмотри перенос встреч в рабочее окно",
                        "reason": f"{round(m['outOfHoursRatio']*100)}% встреч вне графика",
                        "action": "Перенести", "urgent": False, "category": "Встречи"})
        if m["actuality"] < 0.6 and m["riskLevel"] != "critical":
            out.append({"id": f"n-{e.id}-4", "empId": e.id, "who": short,
                        "text": f"подтверди актуальность графика ({m['daysSinceUpdate']} дн. без обновления)",
                        "reason": f"Актуальность {round(m['actuality']*100)}%",
                        "action": "Подтвердить", "urgent": False, "category": "График"})
    return sorted(out, key=lambda n: not n["urgent"])


# ===== Дорожная карта актуализации =====
def actualization_roadmap(db: Session) -> list[dict]:
    cd = _all(db)
    return sorted(
        cd, key=lambda e: e["metrics"]["actualizationPriority"], reverse=True
    )


# ===== Командное окно: Tteam = W1 ∩ ... ∩ Wn (раздел 8) =====
def team_availability(db: Session, team: str, day: int) -> dict:
    emps = db.query(Employee).all()
    if team != "Все команды":
        emps = [e for e in emps if e.team == team]

    hours = list(range(8, 21))
    rows = []
    for e in emps:
        days = [int(x) for x in e.schedule_days.split(",") if x != ""]
        cells = []
        for h in hours:
            in_sch = day in days and e.work_start <= h < e.work_end
            busy = any(
                ev.day == day and ev.start_hour <= h < ev.end_hour
                for ev in e.events
            )
            state = "off" if not in_sch else ("busy" if busy else "free")
            cells.append({"hour": h, "state": state})
        rows.append({
            "employee_id": e.id,
            "employee_name": e.name,
            "tz_short": e.tz_short,
            "work_start": e.work_start,
            "work_end": e.work_end,
            "cells": cells,
        })

    # сводка по часам
    summary = []
    for idx, h in enumerate(hours):
        free = sum(1 for r in rows if r["cells"][idx]["state"] == "free")
        summary.append({"hour": h, "free": free, "total": len(rows)})

    best = max(summary, key=lambda s: s["free"]) if summary else None
    all_free = [s for s in summary if s["total"] > 0 and s["free"] == s["total"]]

    return {
        "day": day,
        "day_label": WD[day],
        "hours": hours,
        "rows": rows,
        "summary": summary,
        "best": best,
        "all_free": all_free,
    }


# ===== Подбор времени встречи =====
def find_meeting_slots(
    db: Session, emp_ids: list[str], duration: float
) -> list[dict]:
    emps = [
        e for e in db.query(Employee).all() if e.id in emp_ids
    ]
    if len(emps) < 2:
        return []

    out = []
    for day in range(5):
        for start in range(8, 20):
            end = start + duration
            if end > 20:
                continue
            available = 0
            warnings = []
            for e in emps:
                days = [int(x) for x in e.schedule_days.split(",") if x != ""]
                in_sch = day in days and start >= e.work_start and end <= e.work_end
                busy = any(
                    ev.day == day and start < ev.end_hour and ev.start_hour < end
                    for ev in e.events
                )
                if in_sch and not busy:
                    available += 1
                    mid = (e.work_start + e.work_end) / 2
                    if abs(start - mid) > 4:
                        warnings.append(f"неудобно для {e.name.split(' ')[0]}")
            if available == 0:
                continue
            ratio = available / len(emps)
            score = round(ratio * 85 + (15 if not warnings else 5))
            tzs = " · ".join(
                sorted({f"{start}:00 {e.tz_short}" for e in emps})
            )
            out.append({
                "score": score,
                "optimal": False,
                "day": WD[day],
                "time": f"{start}:00–{int(end) if end == int(end) else end}:00",
                "tzs": tzs,
                "availableCount": available,
                "totalCount": len(emps),
                "reason": "Все участники свободны и в рабочих часах"
                if not warnings
                else " · ".join(list(dict.fromkeys(warnings))[:2]),
            })

    out.sort(key=lambda s: -s["score"])
    seen = set()
    uniq = []
    for s in out:
        if s["day"] in seen:
            continue
        seen.add(s["day"])
        uniq.append(s)
    if uniq:
        uniq[0]["optimal"] = True
    return uniq[:4]


# ===== Сводная статистика дашборда =====
def dashboard_stats(db: Session, team: str = "Все команды") -> dict:
    cd = _all(db)
    if team != "Все команды":
        cd = [e for e in cd if e["team"] == team]
    n = len(cd) or 1
    return {
        "total": len(cd),
        "conflicts": len(all_conflicts(db)),
        "critical": len([e for e in cd if e["metrics"]["riskLevel"] in ("critical", "high")]),
        "stale": len([e for e in cd if e["metrics"]["actuality"] < 0.6]),
        "avgActuality": round(sum(e["metrics"]["actuality"] for e in cd) / n * 100),
        "avgWorkload": round(sum(e["metrics"]["workload"] for e in cd) / n * 100),
        "overloaded": len([e for e in cd if e["metrics"]["workload"] > 0.8]),
    }
