from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import crud_property
from app.models.enums import ListingType
from app.models.lookup import Amenity, City, Locality, ShopCategory
from app.schemas.chat import AppliedFilters, ChatSearchRequest, ChatSearchResponse
from app.schemas.property import PaginatedProperties, PropertyListItem
from app.services.chat_ai import ExtractedFilters, build_reply, extract_filters

router = APIRouter(prefix="/chat", tags=["chat"])


def _match_name(name: str | None, options: dict[str, int]) -> tuple[int | None, str | None]:
    """Case-insensitive, then substring, match of a model-extracted name
    against the real DB values it was grounded on. Falls back to (None, None)
    rather than guessing, since an unmatched filter should just be skipped."""
    if not name:
        return None, None
    lower = name.strip().lower()
    for opt_name, opt_id in options.items():
        if opt_name.lower() == lower:
            return opt_id, opt_name
    for opt_name, opt_id in options.items():
        if lower in opt_name.lower() or opt_name.lower() in lower:
            return opt_id, opt_name
    return None, None


@router.post("/search", response_model=ChatSearchResponse)
def chat_search(data: ChatSearchRequest, db: Session = Depends(get_db)):
    cities = db.query(City).all()
    categories = db.query(ShopCategory).all()
    amenities = db.query(Amenity).all()

    extracted: ExtractedFilters | None = extract_filters(
        data.message,
        cities=[c.name for c in cities],
        categories=[c.name for c in categories],
        amenities=[a.name for a in amenities],
    )

    if extracted is None or not extracted.has_any_signal():
        empty = PaginatedProperties(total=0, page=1, page_size=12, items=[])
        return ChatSearchResponse(
            reply=build_reply(extracted, 0),
            filters_applied=AppliedFilters(),
            results=empty,
        )

    city_id, city_name = _match_name(extracted.city, {c.name: c.id for c in cities})
    category_id, category_name = _match_name(extracted.category, {c.name: c.id for c in categories})

    locality_id: int | None = None
    locality_name: str | None = None
    if extracted.locality:
        locality_q = db.query(Locality)
        if city_id:
            locality_q = locality_q.filter(Locality.city_id == city_id)
        localities = {loc.name: loc.id for loc in locality_q.all()}
        locality_id, locality_name = _match_name(extracted.locality, localities)
        if locality_id and not city_id:
            matched_locality = db.get(Locality, locality_id)
            if matched_locality:
                city_id = matched_locality.city_id
                city_name = next((c.name for c in cities if c.id == city_id), None)

    amenity_options = {a.name: a.id for a in amenities}
    matched_amenity_ids: list[int] = []
    matched_amenity_names: list[str] = []
    for name in extracted.amenities:
        amenity_id, amenity_name = _match_name(name, amenity_options)
        if amenity_id and amenity_id not in matched_amenity_ids:
            matched_amenity_ids.append(amenity_id)
            matched_amenity_names.append(amenity_name)

    listing_type = ListingType(extracted.listing_type) if extracted.listing_type else None

    total, items = crud_property.list_properties(
        db,
        listing_type=listing_type,
        city_id=city_id,
        locality_id=locality_id,
        category_id=category_id,
        min_price=extracted.min_price,
        max_price=extracted.max_price,
        min_area=extracted.min_area,
        max_area=extracted.max_area,
        amenity_ids=matched_amenity_ids or None,
        page=1,
        page_size=12,
    )

    list_items = [
        PropertyListItem(
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
            }
        )
        for p in items
    ]

    resolved = ExtractedFilters(
        listing_type=extracted.listing_type,
        city=city_name,
        locality=locality_name,
        category=category_name,
        min_price=extracted.min_price,
        max_price=extracted.max_price,
        min_area=extracted.min_area,
        max_area=extracted.max_area,
        amenities=matched_amenity_names,
    )

    return ChatSearchResponse(
        reply=build_reply(resolved, total),
        filters_applied=AppliedFilters(listing_type=listing_type, **resolved.model_dump(exclude={"listing_type"})),
        results=PaginatedProperties(total=total, page=1, page_size=12, items=list_items),
    )
