"""Маршруты аутентификации.

POST /auth/register  — регистрация
POST /auth/login     — вход (JWT)
GET  /auth/me        — текущий пользователь
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import Project, ProjectMember, User

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

DEMO_PROJECT_ID = "demo-project-001"


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    payload["exp"] = expire
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Недействительный токен",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise exc
    except JWTError:
        raise exc

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise exc
    return user


class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str
    full_name: str = ""


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    profile_filled: bool
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email уже занят")
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Имя пользователя уже занято")

    user = User(
        email=body.email,
        username=body.username,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        profile_filled=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Добавляем в демо-проект как Сотрудника
    demo = db.query(Project).filter(Project.id == DEMO_PROJECT_ID).first()
    if demo:
        already = db.query(ProjectMember).filter(
            ProjectMember.project_id == DEMO_PROJECT_ID,
            ProjectMember.user_id == user.id,
        ).first()
        if not already:
            db.add(ProjectMember(project_id=DEMO_PROJECT_ID, user_id=user.id, role="Сотрудник"))
            db.commit()

    return user


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = (
        db.query(User).filter(User.email == form_data.username).first()
        or db.query(User).filter(User.username == form_data.username).first()
    )
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )
    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
