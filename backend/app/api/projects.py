"""Маршруты управления проектами и участниками.

GET    /projects               — список проектов текущего пользователя
POST   /projects               — создать проект
GET    /projects/{id}          — детали проекта
PUT    /projects/{id}          — обновить проект
DELETE /projects/{id}          — удалить проект (только owner)

GET    /projects/{id}/members              — список участников
POST   /projects/{id}/members             — пригласить пользователя
PUT    /projects/{id}/members/{member_id}  — изменить роль
DELETE /projects/{id}/members/{member_id}  — удалить участника
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models import Project, ProjectMember, User

router = APIRouter(prefix="/projects", tags=["projects"])

PROJECT_ROLES = {
    "owner",
    "Администратор",
    "Руководитель",
    "HR-специалист",
    "Проектный менеджер",
    "Аналитик",
    "Сотрудник",
}

MANAGER_ROLES = {"owner", "Администратор"}


# ─── schemas ──────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: str = ""


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class MemberOut(BaseModel):
    id: str
    user_id: str
    username: str
    full_name: str
    email: str
    role: str
    invited_at: datetime

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str
    owner_id: str
    created_at: datetime
    members: list[MemberOut] = []

    model_config = {"from_attributes": True}


class InviteRequest(BaseModel):
    username_or_email: str
    role: str = 'Сотрудник'


class RoleUpdate(BaseModel):
    role: str


# ─── helpers ──────────────────────────────────────────────────────────────────

def _get_project_or_404(project_id: str, db: Session) -> Project:
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return p


def _require_role(project: Project, user: User, *allowed_roles: str):
    """Проверяет, что user имеет одну из allowed_roles в проекте."""
    if project.owner_id == user.id:
        return  # owner всегда имеет полный доступ
    member = next((m for m in project.members if m.user_id == user.id), None)
    if not member or member.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Недостаточно прав")


def _member_to_dict(m: ProjectMember) -> dict:
    return {
        "id": m.id,
        "user_id": m.user_id,
        "username": m.user.username,
        "full_name": m.user.full_name,
        "email": m.user.email,
        "role": m.role,
        "invited_at": m.invited_at,
    }


def _project_to_dict(p: Project) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "owner_id": p.owner_id,
        "created_at": p.created_at,
        "members": [_member_to_dict(m) for m in p.members],
    }


def _user_is_member(project: Project, user: User) -> bool:
    if project.owner_id == user.id:
        return True
    return any(m.user_id == user.id for m in project.members)


# ─── endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    owned = db.query(Project).filter(Project.owner_id == current_user.id).all()
    member_project_ids = [
        m.project_id
        for m in db.query(ProjectMember).filter(ProjectMember.user_id == current_user.id).all()
    ]
    member_projects = (
        db.query(Project).filter(Project.id.in_(member_project_ids)).all()
        if member_project_ids
        else []
    )
    # объединяем без дубликатов
    seen = {p.id for p in owned}
    all_projects = list(owned) + [p for p in member_projects if p.id not in seen]
    return [_project_to_dict(p) for p in all_projects]


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    body: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        name=body.name,
        description=body.description,
        owner_id=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _project_to_dict(project)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = _get_project_or_404(project_id, db)
    if not _user_is_member(p, current_user):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")
    return _project_to_dict(p)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    body: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = _get_project_or_404(project_id, db)
    _require_role(p, current_user, "admin", "owner")
    if body.name is not None:
        p.name = body.name
    if body.description is not None:
        p.description = body.description
    db.commit()
    db.refresh(p)
    return _project_to_dict(p)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = _get_project_or_404(project_id, db)
    if p.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только владелец может удалить проект")
    db.delete(p)
    db.commit()


# ─── members ──────────────────────────────────────────────────────────────────

@router.get("/{project_id}/members", response_model=list[MemberOut])
def list_members(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = _get_project_or_404(project_id, db)
    if not _user_is_member(p, current_user):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")
    return [_member_to_dict(m) for m in p.members]


@router.post("/{project_id}/members", response_model=MemberOut, status_code=201)
def invite_member(
    project_id: str,
    body: InviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = _get_project_or_404(project_id, db)
    _require_role(p, current_user, *MANAGER_ROLES)

    if body.role not in PROJECT_ROLES or body.role == 'owner':
        raise HTTPException(status_code=400, detail=f"Допустимые роли: {', '.join(r for r in PROJECT_ROLES if r != 'owner')}")

    target = (
        db.query(User).filter(User.username == body.username_or_email).first()
        or db.query(User).filter(User.email == body.username_or_email).first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if target.id == p.owner_id:
        raise HTTPException(status_code=400, detail="Владелец уже состоит в проекте")

    existing = next((m for m in p.members if m.user_id == target.id), None)
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь уже добавлен в проект")

    member = ProjectMember(project_id=p.id, user_id=target.id, role=body.role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return _member_to_dict(member)


@router.put("/{project_id}/members/{member_id}", response_model=MemberOut)
def update_member_role(
    project_id: str,
    member_id: str,
    body: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = _get_project_or_404(project_id, db)
    _require_role(p, current_user, *MANAGER_ROLES)

    if body.role not in PROJECT_ROLES or body.role == 'owner':
        raise HTTPException(status_code=400, detail=f"Допустимые роли: {', '.join(r for r in PROJECT_ROLES if r != 'owner')}")

    member = db.query(ProjectMember).filter(
        ProjectMember.id == member_id,
        ProjectMember.project_id == project_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Участник не найден")

    member.role = body.role
    db.commit()
    db.refresh(member)
    return _member_to_dict(member)


@router.delete("/{project_id}/members/{member_id}", status_code=204)
def remove_member(
    project_id: str,
    member_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = _get_project_or_404(project_id, db)
    _require_role(p, current_user, *MANAGER_ROLES)

    member = db.query(ProjectMember).filter(
        ProjectMember.id == member_id,
        ProjectMember.project_id == project_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Участник не найден")

    db.delete(member)
    db.commit()
