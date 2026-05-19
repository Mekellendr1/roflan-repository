"""AI-эндпоинты: чат-ассистент, рекомендации, подбор времени, умные уведомления.

Все ответы генерируются через OpenAI Chat Completions API.
Ключ OPENAI_API_KEY должен быть в .env (см. .env.example).
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Employee
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


# ---------------------------------------------------------------------------
# Схемы запросов
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    message: str
    history: list[dict] = []  # [{"role": "user"|"assistant", "content": "..."}]


class SuggestSlotRequest(BaseModel):
    employee_ids: list[str]
    duration_minutes: int = 60
    window_days: int = 7


# ---------------------------------------------------------------------------
# POST /ai/chat — чат-ассистент
# ---------------------------------------------------------------------------

@router.post("/chat")
async def ai_chat(body: ChatMessage, db: Session = Depends(get_db)):
    """Ответить на вопрос пользователя о команде, конфликтах, расписании.

    История передаётся клиентом — сервер stateless.

    Пример запроса:
    ```json
    {
      "message": "У кого сейчас самый высокий риск и почему?",
      "history": []
    }
    ```
    """
    if not body.message.strip():
        raise HTTPException(status_code=422, detail="Сообщение не может быть пустым")

    valid_roles = {"user", "assistant"}
    for turn in body.history:
        if turn.get("role") not in valid_roles or not isinstance(turn.get("content"), str):
            raise HTTPException(
                status_code=422,
                detail="История должна содержать объекты с role (user|assistant) и content (str)",
            )

    try:
        answer = await ai_service.chat(db, body.message, body.history)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI недоступен: {e}")

    return {
        "answer": answer,
        "history": body.history + [
            {"role": "user", "content": body.message},
            {"role": "assistant", "content": answer},
        ],
    }


# ---------------------------------------------------------------------------
# GET /ai/recommendations/{employee_id} — персональные рекомендации
# ---------------------------------------------------------------------------

@router.get("/recommendations/{employee_id}")
async def ai_recommendations(employee_id: str, db: Session = Depends(get_db)):
    """Сгенерировать персональные рекомендации для сотрудника.

    Возвращает структурированный JSON с выводом о ситуации, объяснением
    риск-скора и конкретными действиями (prioritized).
    """
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")

    try:
        result = await ai_service.get_recommendations(db, emp)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI недоступен: {e}")

    return {"employee_id": employee_id, "employee_name": emp.name, **result}


# ---------------------------------------------------------------------------
# POST /ai/suggest-slot — подбор времени встречи
# ---------------------------------------------------------------------------

@router.post("/suggest-slot")
async def ai_suggest_slot(body: SuggestSlotRequest, db: Session = Depends(get_db)):
    """Найти оптимальное окно для встречи с учётом поясов, загрузки и отсутствий.

    Пример запроса:
    ```json
    {
      "employee_ids": ["e1", "e2", "e8"],
      "duration_minutes": 45,
      "window_days": 5
    }
    ```
    """
    if not body.employee_ids:
        raise HTTPException(status_code=422, detail="Список участников не может быть пустым")
    if body.duration_minutes < 15 or body.duration_minutes > 480:
        raise HTTPException(status_code=422, detail="duration_minutes должен быть от 15 до 480")

    try:
        result = await ai_service.suggest_meeting_slot(
            db,
            employee_ids=body.employee_ids,
            duration_minutes=body.duration_minutes,
            window_days=body.window_days,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI недоступен: {e}")

    return result


# ---------------------------------------------------------------------------
# POST /ai/smart-notifications — умные уведомления
# ---------------------------------------------------------------------------

@router.post("/smart-notifications")
async def ai_smart_notifications(db: Session = Depends(get_db)):
    """AI выбирает кому, что и когда отправить уведомление — без спама.

    Анализирует текущее состояние системы и возвращает список
    уведомлений с приоритетами и обоснованием.
    """
    try:
        notifications = await ai_service.generate_smart_notifications(db)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI недоступен: {e}")

    return {
        "count": len(notifications),
        "notifications": notifications,
    }


# ---------------------------------------------------------------------------
# GET /ai/analyze/{employee_id} — быстрый анализ одним запросом
# ---------------------------------------------------------------------------

@router.get("/analyze/{employee_id}")
async def ai_analyze(employee_id: str, db: Session = Depends(get_db)):
    """Короткий AI-анализ сотрудника: одно предложение о статусе + главный совет.

    Используется для подсказок прямо в карточке сотрудника (tooltip/hint).
    """
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")

    emp_ctx = ai_service._build_employee_context(db, emp)
    system = (
        "Ты — краткий AI-аналитик WorkTime Sync. "
        "Дай ровно 2 предложения: сначала статус сотрудника, потом главный совет. "
        "Никаких списков, никакого markdown. Только 2 предложения по-русски."
    )

    try:
        hint = await ai_service._call_llm(
            system, [{"role": "user", "content": emp_ctx}], max_tokens=120
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI недоступен: {e}")

    return {"employee_id": employee_id, "hint": hint}
