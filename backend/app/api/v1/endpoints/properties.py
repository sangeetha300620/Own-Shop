from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.crud import crud_property
from app.models.enums import ListingType
from app.models.property import Property
from app.models.user import User
from app.schemas.property import (
    PaginatedProperties,
    PropertyCreate,
    PropertyImageOut,
    PropertyListItem,
    PropertyOut,
    PropertyUpdate,
)
from app.services.images import save_property_images

router = APIRouter(prefix="/properties", tags=["properties"])


def _to_list_item(prop: Property) -> PropertyListItem:
    item = PropertyListItem.model_validate(prop)
    item.primary_image_url = crud_property.primary_image_url(prop)
    return item


def _get_owned_property_or_404(db: Session, property_id: int, user: User) -> Property:
    prop = db.get(Property, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.owner_id != user.id and user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to modify this listing")
    return prop


@router.get("", response_model=PaginatedProperties)
def search_properties(
    listing_type: ListingType | None = Query(None, description="RENT, LEASE, or SALE"),
    city_id: int | None = None,
    locality_id: int | None = None,
    category_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_area: float | None = None,
    max_area: float | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total, items = crud_property.list_properties(
        db,
        listing_type=listing_type,
        city_id=city_id,
        locality_id=locality_id,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        min_area=min_area,
        max_area=max_area,
        search=search,
        page=page,
        page_size=page_size,
    )
    return PaginatedProperties(
        total=total,
        page=page,
        page_size=page_size,
        items=[_to_list_item(p) for p in items],
    )


@router.get("/mine", response_model=list[PropertyListItem])
def my_properties(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    props = crud_property.list_properties_by_owner(db, current_user.id)
    return [_to_list_item(p) for p in props]


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = crud_property.get_property(db, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    prop.views_count += 1
    db.commit()
    db.refresh(prop)
    return prop


@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
def create_property(
    data: PropertyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud_property.create_property(db, current_user.id, data)


@router.put("/{property_id}", response_model=PropertyOut)
def update_property(
    property_id: int,
    data: PropertyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = _get_owned_property_or_404(db, property_id, current_user)
    return crud_property.update_property(db, prop, data)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = _get_owned_property_or_404(db, property_id, current_user)
    crud_property.delete_property(db, prop)


@router.post("/{property_id}/images", response_model=list[PropertyImageOut])
def upload_property_images(
    property_id: int,
    files: list[UploadFile],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_property_or_404(db, property_id, current_user)
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    urls = save_property_images(property_id, files)
    if not urls:
        raise HTTPException(status_code=400, detail="No valid image files (jpg/png/webp, max 5MB each)")

    return crud_property.add_property_images(db, property_id, urls)
