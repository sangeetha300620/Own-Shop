from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import InquiryStatus


class InquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    phone: str = Field(min_length=7, max_length=20)
    email: str | None = None
    message: str | None = None


class InquiryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    property_id: int
    name: str
    phone: str
    email: str | None
    message: str | None
    status: InquiryStatus
    created_at: datetime


class InquiryReceived(InquiryOut):
    property_title: str
