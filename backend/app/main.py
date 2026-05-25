"""WorkTime Sync — FastAPI бэкенд.

Запуск из папки be/:
    python -m uvicorn app.main:app --reload --port 8000

Документация: http://localhost:8000/docs

Эндпоинты повторяют структуры фронта (src/lib/types.ts), поэтому
фронт работает без переписывания компонентов — только api-слой.
"""

import time
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.api import ai as ai_routes
from app.api import auth as auth_routes
from app.api import projects as project_routes
from app.api import profile as profile_routes
from app.core.config import settings
from app.core.database import Base, engine, get_db
from app.models import Employee, Event, Source
from app.schemas import CreateMeetingRequest, MeetingRequest
from app.services.derived import (
    actualization_roadmap,
    all_conflicts,
    all_recommendations,
    dashboard_stats,
    diagnostic_groups,
    find_meeting_slots,
    smart_notifications,
    team_availability,
)
from app.services.metrics import employee_to_dict


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="WorkTime Sync API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# AI-эндпоинты (/ai/chat, /ai/recommendations/{id}, /ai/suggest-slot, ...)
app.include_router(ai_routes.router)
# Auth + Projects
app.include_router(auth_routes.router)
app.include_router(project_routes.router)
app.include_router(profile_routes.router)


@app.get("/", tags=["root"])
def root():
    return {"name": "WorkTime Sync API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health", tags=["root"])
def health():
    return {"status": "ok"}


# ===== EMPLOYEES =====
@app.get("/employees", tags=["employees"])
def list_employees(
    team: str | None = Query(None),
    db: Session = Depends(get_db),
):
    emps = db.query(Employee).all()
    result = [employee_to_dict(e) for e in emps]
    if team and team != "Все команды":
        result = [e for e in result if e["team"] == team]
    return result


@app.get("/employees/{emp_id}", tags=["employees"])
def get_employee(emp_id: str, db: Session = Depends(get_db)):
    e = db.query(Employee).filter(Employee.id == emp_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee_to_dict(e)


# ===== DIAGNOSTICS =====
@app.get("/diagnostics", tags=["diagnostics"])
def get_diagnostics(db: Session = Depends(get_db)):
    return diagnostic_groups(db)


# ===== CONFLICTS =====
@app.get("/conflicts", tags=["conflicts"])
def get_conflicts(
    severity: str | None = Query(None),
    type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    res = all_conflicts(db)
    if severity and severity != "all":
        res = [c for c in res if c["severity"] == severity]
    if type and type != "all":
        res = [c for c in res if c["type"] == type]
    return res


@app.post("/recalculate", tags=["conflicts"])
def recalculate(db: Session = Depends(get_db)):
    """Пересчёт. Показатели считаются на лету, так что просто
    возвращаем сводку (для кнопки «Пересчитать» на фронте)."""
    start = time.time()
    emps = db.query(Employee).all()
    conf = all_conflicts(db)
    return {
        "employees_processed": len(emps),
        "conflicts_found": len(conf),
        "duration_ms": int((time.time() - start) * 1000),
    }


# ===== RECOMMENDATIONS =====
@app.get("/recommendations", tags=["recommendations"])
def get_recommendations(db: Session = Depends(get_db)):
    return all_recommendations(db)


# ===== NOTIFICATIONS =====
@app.get("/notifications", tags=["notifications"])
def get_notifications(db: Session = Depends(get_db)):
    return smart_notifications(db)


# ===== ROADMAP =====
@app.get("/roadmap", tags=["roadmap"])
def get_roadmap(db: Session = Depends(get_db)):
    return actualization_roadmap(db)


# ===== AVAILABILITY =====
@app.get("/availability", tags=["availability"])
def get_availability(
    team: str = Query("Backend"),
    day: int = Query(2),
    db: Session = Depends(get_db),
):
    return team_availability(db, team, day)


@app.post("/meetings/suggest-time", tags=["availability"])
def suggest_time(req: MeetingRequest, db: Session = Depends(get_db)):
    return find_meeting_slots(db, req.employee_ids, req.duration)


@app.post("/meetings/create", tags=["availability"])
def create_meeting(req: CreateMeetingRequest, db: Session = Depends(get_db)):
    """Создаёт событие-встречу для каждого участника."""
    import uuid as _uuid
    created = []
    for emp_id in req.employee_ids:
        emp = db.query(Employee).filter(Employee.id == emp_id).first()
        if not emp:
            continue
        from datetime import datetime, timezone as _tz
        ev = Event(
            id=str(_uuid.uuid4()),
            employee_id=emp_id,
            title=req.title,
            day=req.day,
            start_hour=req.start_hour,
            end_hour=req.end_hour,
            event_type="meeting",
            source="WorkTime Sync",
            created_at=datetime.now(_tz.utc).isoformat(),
        )
        db.add(ev)
        created.append({
            "employee_id": emp_id,
            "event_id": ev.id,
            "title": req.title,
            "day": req.day,
            "start_hour": req.start_hour,
            "end_hour": req.end_hour,
        })
    db.commit()
    return {"ok": True, "created": len(created), "events": created}


# ===== SOURCES =====
@app.get("/sources", tags=["sources"])
def get_sources(db: Session = Depends(get_db)):
    srcs = db.query(Source).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "type": s.type,
            "icon": s.icon,
            "status": s.status,
            "lastSync": s.last_sync,
            "records": s.records,
        }
        for s in srcs
    ]


# ===== STATS =====
@app.get("/stats", tags=["stats"])
def get_stats(
    team: str = Query("Все команды"), db: Session = Depends(get_db)
):
    return dashboard_stats(db, team)


# ===== EMPLOYEE MUTATIONS (обновление профиля конкретного сотрудника) =====

from pydantic import BaseModel as _BM
from app.models import Exception_ as _Exc
from app.api.auth import get_current_user as _gcu

class _ScheduleUpdate(_BM):
    days: list[int]
    start_hour: int
    end_hour: int

class _FormatUpdate(_BM):
    work_format: str

class _ExceptionCreate(_BM):
    type: str
    note: str = ""

# ===== EVENTS CRUD =====

from app.models import ProjectMember as _PM

def _can_manage_events(user, db) -> bool:
    memberships = db.query(_PM).filter(_PM.user_id == user.id).all()
    return any(m.role != "Сотрудник" for m in memberships)


class _EventCreate(_BM):
    employee_ids: list[str]
    title: str
    day: int
    start_hour: float
    end_hour: float
    event_type: str = "meeting"
    source: str = "WorkTime Sync"


class _EventUpdate(_BM):
    title: str | None = None
    day: int | None = None
    start_hour: float | None = None
    end_hour: float | None = None
    event_type: str | None = None


def _event_dict(ev: Event) -> dict:
    return {
        "id": ev.id,
        "employee_id": ev.employee_id,
        "title": ev.title,
        "day": ev.day,
        "start_hour": ev.start_hour,
        "end_hour": ev.end_hour,
        "event_type": ev.event_type,
        "source": ev.source,
        "created_at": ev.created_at,
    }


@app.get("/events", tags=["events"])
def list_events(
    employee_id: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Event)
    if employee_id:
        q = q.filter(Event.employee_id == employee_id)
    evs = q.order_by(Event.day, Event.start_hour).all()
    return [_event_dict(ev) for ev in evs]


@app.post("/events", tags=["events"])
def create_event(
    body: _EventCreate,
    db: Session = Depends(get_db),
    current_user=Depends(_gcu),
):
    if not _can_manage_events(current_user, db):
        raise HTTPException(status_code=403, detail="Недостаточно прав для создания событий")
    import uuid as _uuid
    from datetime import datetime, timezone as _tz
    created = []
    for emp_id in body.employee_ids:
        emp = db.query(Employee).filter(Employee.id == emp_id).first()
        if not emp:
            continue
        ev = Event(
            id=str(_uuid.uuid4()),
            employee_id=emp_id,
            title=body.title,
            day=body.day,
            start_hour=body.start_hour,
            end_hour=body.end_hour,
            event_type=body.event_type,
            source=body.source,
            created_at=datetime.now(_tz.utc).isoformat(),
        )
        db.add(ev)
        created.append(_event_dict(ev))
    db.commit()
    return {"ok": True, "created": len(created), "events": created}


@app.put("/events/{event_id}", tags=["events"])
def update_event(
    event_id: str,
    body: _EventUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(_gcu),
):
    if not _can_manage_events(current_user, db):
        raise HTTPException(status_code=403, detail="Недостаточно прав для редактирования событий")
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    if body.title is not None:
        ev.title = body.title
    if body.day is not None:
        ev.day = body.day
    if body.start_hour is not None:
        ev.start_hour = body.start_hour
    if body.end_hour is not None:
        ev.end_hour = body.end_hour
    if body.event_type is not None:
        ev.event_type = body.event_type
    db.commit()
    return _event_dict(ev)


@app.delete("/events/{event_id}", tags=["events"], status_code=204)
def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(_gcu),
):
    if not _can_manage_events(current_user, db):
        raise HTTPException(status_code=403, detail="Недостаточно прав для удаления событий")
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(ev)
    db.commit()


@app.post("/employees/{emp_id}/confirm-actuality", tags=["employees"])
def confirm_actuality(
    emp_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(_gcu),
):
    e = db.query(Employee).filter(Employee.id == emp_id).first()
    if not e:
        raise HTTPException(status_code=404)
    from datetime import datetime, timezone as _tz
    e.last_update = datetime.now(_tz.utc).isoformat()
    db.commit()
    return employee_to_dict(e)

@app.put("/employees/{emp_id}/schedule", tags=["employees"])
def update_employee_schedule(
    emp_id: str,
    body: _ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(_gcu),
):
    e = db.query(Employee).filter(Employee.id == emp_id).first()
    if not e:
        raise HTTPException(status_code=404)
    from datetime import datetime, timezone as _tz
    e.schedule_days = ",".join(str(d) for d in sorted(body.days))
    e.work_start = body.start_hour
    e.work_end = body.end_hour
    e.last_update = datetime.now(_tz.utc).isoformat()
    db.commit()
    return employee_to_dict(e)

@app.put("/employees/{emp_id}/format", tags=["employees"])
def update_employee_format(
    emp_id: str,
    body: _FormatUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(_gcu),
):
    e = db.query(Employee).filter(Employee.id == emp_id).first()
    if not e:
        raise HTTPException(status_code=404)
    from datetime import datetime, timezone as _tz
    e.work_format = body.work_format
    e.last_update = datetime.now(_tz.utc).isoformat()
    db.commit()
    return employee_to_dict(e)

@app.post("/employees/{emp_id}/exceptions", tags=["employees"])
def add_employee_exception(
    emp_id: str,
    body: _ExceptionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(_gcu),
):
    import uuid as _uuid
    e = db.query(Employee).filter(Employee.id == emp_id).first()
    if not e:
        raise HTTPException(status_code=404)
    exc = _Exc(id=str(_uuid.uuid4()), employee_id=emp_id, type=body.type, note=body.note)
    db.add(exc)
    db.commit()
    return employee_to_dict(e)

@app.delete("/employees/{emp_id}/exceptions/{exc_id}", tags=["employees"], status_code=204)
def remove_employee_exception(
    emp_id: str,
    exc_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(_gcu),
):
    exc = db.query(_Exc).filter(_Exc.id == exc_id, _Exc.employee_id == emp_id).first()
    if not exc:
        raise HTTPException(status_code=404)
    db.delete(exc)
    db.commit()
