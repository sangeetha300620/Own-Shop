from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token, verify_password
from app.crud import crud_user
from app.models.user import User
from app.schemas.user import (
    AccessTokenOut,
    RefreshRequest,
    TokenPair,
    UserLogin,
    UserOut,
    UserRegister,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if crud_user.get_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if crud_user.get_by_phone(db, data.phone):
        raise HTTPException(status_code=400, detail="Phone number already registered")

    user = crud_user.create_user(db, data)
    return TokenPair(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenPair)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = crud_user.get_by_email(db, data.email)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return TokenPair(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=AccessTokenOut)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    return AccessTokenOut(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
