from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)
    password: str = Field(min_length=6, max_length=72)
    company_name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone: str
    role: UserRole
    company_name: str | None
    is_active: bool
    created_at: datetime


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
