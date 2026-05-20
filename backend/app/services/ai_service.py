"""AI-сервис: сборка контекста из БД и запросы к Chat Completions API.

Все обращения к LLM проходят через этот модуль. Промпты хранятся здесь же.
Провайдер — любой с OpenAI-совместимым API (OpenAI / Groq / Gemini / Ollama),
выбирается через settings.openai_base_url (.env -> OPENAI_BASE_URL).

Если ключ не задан или провайдер вернул ошибку — бросаем RuntimeError,
слой api/ai.py перехватывает и отдаёт 502 с понятным текстом.

Файл написан под текущую схему БД: модели Employee/Event/Exception_
и compute_metrics из app/services/metrics.py.
"""

import json
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Employee, Event, Exception_
from app.services.derived import all_conflicts
from app.services.metrics import compute_metrics

MAX_TOKENS = 1024

WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

EXCEPTION_LABEL = {
    "vacation": "отпуск",
    "sick": "больничный",
    "business_trip": "командировка",
    "personal": "личные часы",
}


def _chat_completions_url() -> str:
    """Полный URL до /chat/completions из настроенного base_url."""
    base = settings.openai_base_url.rstrip("/")
    return f"{base}/chat/completions"


# ---------------------------------------------------------------------------
# Низкоуровневый вызов LLM
# ---------------------------------------------------------------------------

async def _call_openai(
    system: str, messages: list[dict], max_tokens: int = MAX_TOKENS
) -> str:
    """Запрос к Chat Completions API, вернуть текст ответа.

    На 4xx/5xx достаём error.message/error.code из тела и пробрасываем наверх
    осмысленным RuntimeError — иначе видно только голый код статуса.
    """
    api_key = settings.openai_api_key
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY не задан в .env")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    full_messages = [{"role": "system", "content": system}] + messages
    payload = {
        "model": settings.openai_model,
        "max_tokens": max_tokens,
        "messages": full_messages,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            _chat_completions_url(), headers=headers, json=payload
        )

    if resp.status_code >= 400:
        try:
            body = resp.json()
            err = body.get("error", {}) if isinstance(body, dict) else {}
            code = err.get("code") or err.get("type") or ""
            msg = err.get("message") or resp.text[:300]
        except Exception:
            code = ""
            msg = resp.text[:300]

        status = resp.status_code

        if status == 401:
            raise RuntimeError(
                "API-ключ невалиден или отозван. Проверь OPENAI_API_KEY в backend/.env."
            )

        if status == 429:
            low = (code + " " + msg).lower()
            if "insufficient_quota" in low or "quota" in low or "billing" in low:
                raise RuntimeError(
                    "Закончилась квота провайдера. Пополни счёт или переключись на "
                    "бесплатный провайдер (Groq/Gemini) — пресеты в .env.example. "
                    f"Ответ API: {msg}"
                )
            raise RuntimeError(
                "Слишком частые запросы (rate limit). Подожди ~30 секунд и повтори. "
                f"{msg}"
            )

        if status == 404 and "model" in msg.lower():
            raise RuntimeError(
                f"Провайдер не знает модель «{settings.openai_model}». "
                "Проверь OPENAI_MODEL в .env."
            )

        raise RuntimeError(f"AI {status} {code}: {msg}")

    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


# Алиас — внутри сервиса нейтральное имя, чтобы api/ai.py не зависел от провайдера
_call_llm = _call_openai


# ---------------------------------------------------------------------------
# Хелперы
# ---------------------------------------------------------------------------

def _schedule_days(emp: Employee) -> list[int]:
    return [int(x) for x in emp.schedule_days.split(",") if x != ""]


def _schedule_str(emp: Employee) -> str:
    days = _schedule_days(emp)
    day_names = "-".join(WEEKDAYS[d] for d in days) if days else "—"
    return f"{day_names}, {emp.work_start}:00-{emp.work_end}:00 {emp.tz_short}"


def _employee_events(db: Session, employee: Employee) -> list[Event]:
    return (
        db.query(Event)
        .filter(Event.employee_id == employee.id)
        .order_by(Event.day, Event.start_hour)
        .all()
    )


def _employee_exceptions(db: Session, employee: Employee) -> list[Exception_]:
    return db.query(Exception_).filter(Exception_.employee_id == employee.id).all()


# ---------------------------------------------------------------------------
# Сборка контекста сотрудника
# ---------------------------------------------------------------------------

def _build_employee_context(db: Session, employee: Employee) -> str:
    """Текстовый контекст об одном сотруднике для промпта."""
    metrics = compute_metrics(employee)
    events = _employee_events(db, employee)
    exceptions = _employee_exceptions(db, employee)

    lines = [
        f"Сотрудник: {employee.name} ({employee.role}, команда {employee.team})",
        f"Часовой пояс: {employee.timezone} (UTC{employee.tz_offset:+d}, {employee.tz_short})",
        f"Формат работы (профиль): {employee.work_format}",
        f"Формат работы (HR-система): {employee.hr_format}",
        f"График: {_schedule_str(employee)}",
        f"График обновлён: {metrics['daysSinceUpdate']} дн. назад "
        f"(актуальность Ai = {metrics['actuality']:.2f})",
        "",
        f"Интегральный риск Ri = {metrics['integralRisk']:.2f} ({metrics['riskLevel']})",
        f"Загрузка Li = {metrics['workload']:.2f} "
        f"({metrics['busyHours']}ч из {metrics['workHours']}ч)",
        f"Доля встреч вне графика Ci = {metrics['outOfHoursRatio']:.2f} "
        f"({metrics['meetingsOutOfHours']} из {metrics['meetingsTotal']})",
        f"Смена пояса Zi = {metrics['timezoneShift']}, "
        f"HR-расхождение Hi = {metrics['hrMismatch']}",
        f"Всего конфликтов: {metrics['conflictCount']}",
    ]

    if events:
        lines += ["", "События в демо-неделе:"]
        for ev in events[:15]:
            lines.append(
                f"  - {WEEKDAYS[ev.day]} {ev.start_hour:>4.1f}-{ev.end_hour:.1f} "
                f"{ev.title} [{ev.event_type}]"
            )

    if exceptions:
        lines += ["", "Активные исключения:"]
        for ex in exceptions:
            label = EXCEPTION_LABEL.get(ex.type, ex.type)
            lines.append(f"  - {label}: {ex.note or '—'} (источник: {ex.source})")

    if metrics["recommendations"]:
        lines += ["", "Системные рекомендации (для справки):"]
        for r in metrics["recommendations"]:
            lines.append(f"  - [{r['priority']}] {r['action']} — {r['reason']}")

    return "\n".join(lines)


def _build_team_context(db: Session) -> str:
    """Общий контекст по команде для чат-ассистента."""
    employees = db.query(Employee).all()
    lines = [f"В системе {len(employees)} активных сотрудников:"]

    for emp in employees:
        m = compute_metrics(emp)
        lines.append(
            f"- {emp.name} ({emp.role}, {emp.team}): "
            f"риск Ri={m['integralRisk']:.2f} ({m['riskLevel']}), "
            f"загрузка {round(m['workload'] * 100)}%, "
            f"конфликтов {m['conflictCount']}, "
            f"пояс {emp.tz_short} UTC{emp.tz_offset:+d}, "
            f"график обновлён {m['daysSinceUpdate']} дн. назад"
        )

    conflicts = all_conflicts(db)
    critical = [c for c in conflicts if c["severity"] == "critical"]
    lines.append(
        f"\nВсего конфликтов: {len(conflicts)} (критических: {len(critical)})"
    )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Системный промпт ассистента
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """Ты — AI-ассистент системы WorkTime Sync. Твоя задача — помогать
руководителям и HR понимать рабочую ситуацию в команде: у кого перегрузка, чей
график устарел, какие конфликты требуют внимания, когда лучше назначать встречи.

Отвечай коротко и конкретно. Предлагай конкретные действия, а не общие советы.
Всегда объясняй причину своих рекомендаций. Пиши по-русски.

Метрики системы:
- Ai — актуальность графика (1 = свежий, 0 = очень устарел)
- Ci — доля встреч вне рабочих часов
- Li — загрузка (доля рабочих часов, занятых встречами)
- Zi — смена часового пояса (0/1)
- Hi — расхождение HR / профиль (0/1)
- Ri — интегральный риск 0..1 (критический >= 0.7, высокий >= 0.5)

{team_context}"""


# ---------------------------------------------------------------------------
# Публичные функции сервиса
# ---------------------------------------------------------------------------

def _strip_json(raw: str) -> str:
    """Убрать markdown-обёртку ```json ... ``` если LLM её добавила."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        if len(parts) >= 2:
            cleaned = parts[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    return cleaned.strip()


async def chat(db: Session, user_message: str, history: list[dict]) -> str:
    """Ответить на вопрос пользователя в контексте всей команды."""
    team_ctx = _build_team_context(db)
    system = SYSTEM_PROMPT.format(team_context=team_ctx)
    messages = history + [{"role": "user", "content": user_message}]
    return await _call_llm(system, messages)


async def get_recommendations(db: Session, employee: Employee) -> dict:
    """Сгенерировать персональные рекомендации для сотрудника."""
    emp_ctx = _build_employee_context(db, employee)

    system = """Ты — AI-ассистент WorkTime Sync. Тебе дан контекст одного
сотрудника. Сгенерируй структурированные рекомендации.

Ответь ТОЛЬКО валидным JSON без markdown.
Структура:
{
  "summary": "Краткий вывод о ситуации (1-2 предложения)",
  "risk_explanation": "Почему такой риск-скор (1-3 предложения)",
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "Конкретное действие (до 80 символов)",
      "reason": "Почему это нужно сделать"
    }
  ],
  "schedule_status": "ok|needs_update|critical",
  "schedule_comment": "Комментарий по актуальности графика"
}

Рекомендаций должно быть от 2 до 5. Пиши по-русски."""

    raw = await _call_llm(system, [{"role": "user", "content": emp_ctx}])
    try:
        return json.loads(_strip_json(raw))
    except (json.JSONDecodeError, IndexError):
        return {
            "summary": raw[:300],
            "risk_explanation": "",
            "recommendations": [],
            "schedule_status": "ok",
            "schedule_comment": "",
        }


async def suggest_meeting_slot(
    db: Session,
    employee_ids: list[str],
    duration_minutes: int,
    window_days: int,
) -> dict[str, Any]:
    """Предложить оптимальное окно для встречи с учётом всех участников."""
    employees = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
    if not employees:
        return {"error": "Сотрудники не найдены"}

    parts = []
    for emp in employees:
        m = compute_metrics(emp)
        events = _employee_events(db, emp)
        exceptions = _employee_exceptions(db, emp)

        busy = [
            f"{WEEKDAYS[e.day]} {e.start_hour:.1f}-{e.end_hour:.1f}"
            for e in events
            if e.event_type != "focus"
        ]
        exc_info = [
            f"{EXCEPTION_LABEL.get(x.type, x.type)} ({x.note or '—'})"
            for x in exceptions
        ]
        days = "/".join(WEEKDAYS[d] for d in _schedule_days(emp))

        parts.append(
            f"{emp.name} ({emp.tz_short} UTC{emp.tz_offset:+d}, "
            f"рабочие дни {days}, часы {emp.work_start}:00-{emp.work_end}:00)\n"
            f"  Загрузка: {round(m['workload'] * 100)}%"
            + (f"\n  Исключения: {', '.join(exc_info)}" if exc_info else "")
            + (
                f"\n  Занят: {'; '.join(busy[:8])}"
                if busy
                else "\n  Нет событий в графике"
            )
        )

    context = (
        f"Нужно найти окно для встречи длительностью {duration_minutes} мин "
        f"в ближайшие {window_days} дн.\n\n"
        + "\n\n".join(parts)
    )

    system = """Ты — планировщик встреч в системе WorkTime Sync.
Найди лучшее время для встречи.

Учитывай:
1. Часовые пояса всех участников — встреча должна быть в рабочих часах для каждого.
2. Уже занятые слоты (не пересекайся).
3. Исключения (отпуска, больничные).
4. Уровень загрузки — не дави на перегруженных.
5. Предпочитай середину рабочего дня.

Дни недели: Пн/Вт/Ср/Чт/Пт.

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "slot": {
    "day": "Пн|Вт|Ср|Чт|Пт",
    "time_utc": "ЧЧ:ММ UTC",
    "times_local": ["ЧЧ:ММ ТЗ для каждого участника"],
    "duration_minutes": число
  },
  "score": число от 0 до 100,
  "reason": "Почему это время оптимально",
  "warnings": ["Предупреждения, иначе []"],
  "alternative": {
    "day": "Пн|Вт|...",
    "time_utc": "ЧЧ:ММ UTC",
    "reason": "Краткое объяснение"
  }
}"""

    raw = await _call_llm(
        system, [{"role": "user", "content": context}], max_tokens=512
    )
    try:
        return json.loads(_strip_json(raw))
    except (json.JSONDecodeError, IndexError):
        return {"raw": raw, "error": "Не удалось распарсить ответ"}


async def generate_smart_notifications(db: Session) -> list[dict]:
    """AI выбирает кому, что и зачем отправить уведомление — без спама."""
    team_ctx = _build_team_context(db)
    conflicts = all_conflicts(db)

    conflict_summary = "\n".join(
        f"- {c['empId']} | {c['type']} | {c['severity']} | {c['title']}"
        for c in conflicts[:20]
    )

    context = (
        f"{team_ctx}\n\n"
        f"Активные конфликты:\n{conflict_summary or 'Нет конфликтов'}"
    )

    system = """Ты — AI-модуль умных уведомлений системы WorkTime Sync.
Твоя задача: выбрать, кому отправить уведомление прямо сейчас.

НЕ отправляй всем подряд. Отправляй только если:
- ситуация действительно требует внимания
- сотрудник или менеджер может что-то изменить
- уведомление не дублирует то, о чём человек уже знает

Ответь ТОЛЬКО валидным JSON — массивом уведомлений (не более 5):
[
  {
    "employee_id": "e1",
    "recipient": "manager|employee",
    "priority": "urgent|normal",
    "message": "Текст уведомления (до 120 символов)",
    "action": "Что нужно сделать (глагол, до 20 символов)",
    "reason": "Почему именно сейчас"
  }
]

Если уведомлять некого — верни пустой массив []."""

    raw = await _call_llm(
        system, [{"role": "user", "content": context}], max_tokens=768
    )
    try:
        result = json.loads(_strip_json(raw))
        return result if isinstance(result, list) else []
    except (json.JSONDecodeError, IndexError):
        return []
