from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.crud import crud_property
from app.models.user import User
from app.schemas.property import AdminPropertyListItem, PaginatedAdminProperties

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/properties", response_model=PaginatedAdminProperties)
def list_all_properties(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total, items = crud_property.list_all_properties_for_admin(db, page=page, page_size=page_size)
    out_items = [
        AdminPropertyListItem(
            **{
                "id": p.id,
                "title": p.title,
                "listing_type": p.listing_type,
                "price": p.price,
                "carpet_area_sqft": p.carpet_area_sqft,
                "city": p.city,
                "locality": p.locality,
                "category": p.category,
                "status": p.status,
                "primary_image_url": crud_property.primary_image_url(p),
                "created_at": p.created_at,
                "owner_id": p.owner_id,
                "owner_name": p.owner.full_name,
                "owner_email": p.owner.email,
            }
        )
        for p in items
    ]
    return PaginatedAdminProperties(total=total, page=page, page_size=page_size, items=out_items)
