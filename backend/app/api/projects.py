"""Маршруты управления проектами и участниками."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models import Employee, Project, ProjectMember, User

router = APIRouter(prefix="/projects", tags=["projects"])

PROJECT_ROLES = {
    "Администратор",
    "Руководитель",
    "HR-специалист",
    "Проектный менеджер",
    "Аналитик",
    "Сотрудник",
}
ADMIN_ROLES = {"Администратор"}


class ProjectCreate(BaseModel):
    name: str
    description: str = ""


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class InviteRequest(BaseModel):
    username_or_email: str
    role: str = "Сотрудник"


class RoleUpdate(BaseModel):
    role: str


def _get_project_or_404(project_id: str, db: Session) -> Project:
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return p


def _is_admin(project: Project, user: User) -> bool:
    """Владелец проекта или участник с ролью Администратор."""
    if project.owner_id == user.id:
        return True
    return any(m.user_id == user.id and m.role == "Администратор" for m in project.members)


def _is_member(project: Project, user: User) -> bool:
    if project.owner_id == user.id:
        return True
    return any(m.user_id == user.id for m in project.members)


def _require_admin(project: Project, user: User):
    if not _is_admin(project, user):
        raise HTTPException(status_code=403, detail="Нужна роль Администратор")


def _member_dict(m: ProjectMember) -> dict:
    emp = None
    if hasattr(m.user, 'id'):
        from app.core.database import SessionLocal
        # получаем Employee через user_id из объекта сессии
        pass
    return {
        "id": m.id,
        "user_id": m.user_id,
        "username": m.user.username,
        "full_name": m.user.full_name,
        "email": m.user.email,
        "role": m.role,
        "profile_filled": m.user.profile_filled,
        "invited_at": m.invited_at,
    }


def _project_dict(p: Project) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "owner_id": p.owner_id,
        "created_at": p.created_at,
        "members": [_member_dict(m) for m in p.members],
    }


# ─── endpoints ────────────────────────────────────────────────────────────────

@router.get("")
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    owned = db.query(Project).filter(Project.owner_id == current_user.id).all()
    member_ids = [m.project_id for m in db.query(ProjectMember).filter(ProjectMember.user_id == current_user.id).all()]
    member_projects = db.query(Project).filter(Project.id.in_(member_ids)).all() if member_ids else []
    seen = {p.id for p in owned}
    all_projects = list(owned) + [p for p in member_projects if p.id not in seen]
    return [_project_dict(p) for p in all_projects]


@router.post("", status_code=201)
def create_project(body: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = Project(name=body.name, description=body.description, owner_id=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    # Создателя добавляем как Администратора в members тоже
    db.add(ProjectMember(project_id=project.id, user_id=current_user.id, role="Администратор"))
    db.commit()
    db.refresh(project)
    return _project_dict(project)


@router.get("/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = _get_project_or_404(project_id, db)
    if not _is_member(p, current_user):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")
    return _project_dict(p)


@router.put("/{project_id}")
def update_project(project_id: str, body: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = _get_project_or_404(project_id, db)
    _require_admin(p, current_user)
    if body.name is not None:
        p.name = body.name
    if body.description is not None:
        p.description = body.description
    db.commit()
    db.refresh(p)
    return _project_dict(p)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = _get_project_or_404(project_id, db)
    if p.owner_id != current_user.id and not _is_admin(p, current_user):
        raise HTTPException(status_code=403, detail="Нет прав на удаление")
    db.delete(p)
    db.commit()


@router.get("/{project_id}/members")
def list_members(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = _get_project_or_404(project_id, db)
    if not _is_member(p, current_user):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")
    return [_member_dict(m) for m in p.members]


@router.post("/{project_id}/members", status_code=201)
def invite_member(project_id: str, body: InviteRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = _get_project_or_404(project_id, db)
    _require_admin(p, current_user)

    if body.role not in PROJECT_ROLES:
        raise HTTPException(status_code=400, detail=f"Недопустимая роль. Допустимые: {', '.join(PROJECT_ROLES)}")

    target = (
        db.query(User).filter(User.username == body.username_or_email).first()
        or db.query(User).filter(User.email == body.username_or_email).first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if any(m.user_id == target.id for m in p.members):
        raise HTTPException(status_code=400, detail="Пользователь уже в проекте")

    member = ProjectMember(project_id=p.id, user_id=target.id, role=body.role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return _member_dict(member)


@router.put("/{project_id}/members/{member_id}")
def update_member_role(project_id: str, member_id: str, body: RoleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = _get_project_or_404(project_id, db)
    _require_admin(p, current_user)

    if body.role not in PROJECT_ROLES:
        raise HTTPException(status_code=400, detail=f"Недопустимая роль")

    member = db.query(ProjectMember).filter(ProjectMember.id == member_id, ProjectMember.project_id == project_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Участник не найден")

    member.role = body.role
    db.commit()
    db.refresh(member)
    return _member_dict(member)


@router.delete("/{project_id}/members/{member_id}", status_code=204)
def remove_member(project_id: str, member_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = _get_project_or_404(project_id, db)
    _require_admin(p, current_user)
    member = db.query(ProjectMember).filter(ProjectMember.id == member_id, ProjectMember.project_id == project_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Участник не найден")
    db.delete(member)
    db.commit()


@router.get("/{project_id}/employees")
def list_project_employees(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Возвращает Employee-профили всех участников проекта.
    Участники без заполненного профиля возвращаются с profile_filled=False.
    """
    from app.services.metrics import employee_to_dict

    p = _get_project_or_404(project_id, db)
    if not _is_member(p, current_user):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")

    # Все user_id участников проекта (включая владельца)
    member_user_ids = list({m.user_id for m in p.members} | {p.owner_id})

    # Employee-профили этих пользователей
    emps = db.query(Employee).filter(Employee.user_id.in_(member_user_ids)).all()
    filled_user_ids = {emp.user_id for emp in emps}

    result = []

    # Заполненные профили
    for emp in emps:
        d = employee_to_dict(emp)
        d["profile_filled"] = True
        result.append(d)

    # Участники без профиля
    for uid in member_user_ids:
        if uid in filled_user_ids:
            continue
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            continue
        member = next((m for m in p.members if m.user_id == uid), None)
        result.append({
            "profile_filled": False,
            "id": uid,
            "name": user.full_name or user.username,
            "initials": (user.full_name or user.username)[:2].upper(),
            "role": member.role if member else "Сотрудник",
            "team": "—",
            "user_id": uid,
            "username": user.username,
        })

    return result
