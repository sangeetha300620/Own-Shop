from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserRegister


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_phone(db: Session, phone: str) -> User | None:
    return db.query(User).filter(User.phone == phone).first()


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
