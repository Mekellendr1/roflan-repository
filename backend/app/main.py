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
from app.core.config import settings
from app.core.database import Base, engine, get_db
from app.models import Employee, Source
from app.schemas import MeetingRequest
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


@app.get("/", tags=["root"])
def root():
    return {"name": "WorkTime Sync API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health", tags=["root"])
def health():
    return {"status": "ok"}


# ===== EMPLOYEES =====
@app.get("/employees", tags=["employees"])
def list_employees(
    team: str | None = Query(None), db: Session = Depends(get_db)
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
