from sqlalchemy.orm import Session, joinedload

from app.models.inquiry import Inquiry
from app.models.property import Property
from app.schemas.inquiry import InquiryCreate


def create_inquiry(db: Session, property_id: int, user_id: int, data: InquiryCreate) -> Inquiry:
    inquiry = Inquiry(property_id=property_id, user_id=user_id, **data.model_dump())
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return inquiry


def list_received_inquiries(db: Session, owner_id: int) -> list[Inquiry]:
    return (
        db.query(Inquiry)
        .join(Property, Inquiry.property_id == Property.id)
        .options(joinedload(Inquiry.property))
        .filter(Property.owner_id == owner_id)
        .order_by(Inquiry.created_at.desc())
        .all()
    )
