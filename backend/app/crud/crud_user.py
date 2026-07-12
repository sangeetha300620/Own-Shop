from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserRegister


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_phone(db: Session, phone: str) -> User | None:
    return db.query(User).filter(User.phone == phone).first()


def get_by_google_id(db: Session, google_id: str) -> User | None:
    return db.query(User).filter(User.google_id == google_id).first()


def create_user(db: Session, data: UserRegister) -> User:
    user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        company_name=data.company_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_google_user(
    db: Session, *, google_id: str, email: str, full_name: str, avatar_url: str | None
) -> User:
    user = get_by_google_id(db, google_id)
    if user:
        return user

    user = get_by_email(db, email)
    if user:
        user.google_id = google_id
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)
        return user

    user = User(
        full_name=full_name,
        email=email,
        google_id=google_id,
        avatar_url=avatar_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
