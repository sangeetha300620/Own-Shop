from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.crud import crud_property, crud_saved_property
from app.models.property import Property
from app.models.user import User
from app.schemas.property import PropertyListItem
from app.schemas.saved_property import SavedStatus

router = APIRouter(prefix="/saved-properties", tags=["saved-properties"])


@router.get("", response_model=list[PropertyListItem])
def list_saved_properties(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    props = crud_saved_property.list_saved_properties(db, current_user.id)
    items = []
    for p in props:
        item = PropertyListItem.model_validate(p)
        item.primary_image_url = crud_property.primary_image_url(p)
        items.append(item)
    return items


@router.get("/{property_id}/status", response_model=SavedStatus)
def saved_status(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SavedStatus(is_saved=crud_saved_property.is_saved(db, current_user.id, property_id))


@router.post("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def save_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.get(Property, property_id):
        raise HTTPException(status_code=404, detail="Property not found")
    crud_saved_property.save_property(db, current_user.id, property_id)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crud_saved_property.unsave_property(db, current_user.id, property_id)
