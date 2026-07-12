from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.crud import crud_inquiry
from app.models.property import Property
from app.models.user import User
from app.schemas.inquiry import InquiryCreate, InquiryOut, InquiryReceived

router = APIRouter(tags=["inquiries"])


@router.post("/properties/{property_id}/inquiries", response_model=InquiryOut, status_code=201)
def send_inquiry(
    property_id: int,
    data: InquiryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = db.get(Property, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot inquire about your own listing")

    return crud_inquiry.create_inquiry(db, property_id, current_user.id, data)


@router.get("/inquiries/received", response_model=list[InquiryReceived])
def received_inquiries(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inquiries = crud_inquiry.list_received_inquiries(db, current_user.id)
    return [
        InquiryReceived(
            id=i.id,
            property_id=i.property_id,
            name=i.name,
            phone=i.phone,
            email=i.email,
            message=i.message,
            status=i.status,
            created_at=i.created_at,
            property_title=i.property.title,
        )
        for i in inquiries
    ]


@router.delete("/inquiries/{inquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_received_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not crud_inquiry.delete_received_inquiry(db, inquiry_id, current_user.id):
        raise HTTPException(status_code=404, detail="Inquiry not found")
