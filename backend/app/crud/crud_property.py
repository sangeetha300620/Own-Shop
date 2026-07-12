from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.enums import ListingType, PropertyStatus
from app.models.lookup import Amenity
from app.models.property import Property, PropertyImage
from app.schemas.property import PropertyCreate, PropertyUpdate

LIST_LOAD_OPTIONS = (
    joinedload(Property.city),
    joinedload(Property.locality),
    joinedload(Property.category),
    joinedload(Property.images),
)

DETAIL_LOAD_OPTIONS = (
    *LIST_LOAD_OPTIONS,
    joinedload(Property.amenities),
    joinedload(Property.owner),
)


def get_property(db: Session, property_id: int) -> Property | None:
    return (
        db.query(Property)
        .options(*DETAIL_LOAD_OPTIONS)
        .filter(Property.id == property_id)
        .first()
    )


def list_properties(
    db: Session,
    *,
    listing_type: ListingType | None = None,
    city_id: int | None = None,
    locality_id: int | None = None,
    category_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_area: float | None = None,
    max_area: float | None = None,
    search: str | None = None,
    amenity_ids: list[int] | None = None,
    status: PropertyStatus | None = PropertyStatus.ACTIVE,
    page: int = 1,
    page_size: int = 20,
) -> tuple[int, list[Property]]:
    query = db.query(Property).options(*LIST_LOAD_OPTIONS)
    if status is not None:
        query = query.filter(Property.status == status)

    if listing_type is not None:
        query = query.filter(Property.listing_type == listing_type)
    if city_id is not None:
        query = query.filter(Property.city_id == city_id)
    if locality_id is not None:
        query = query.filter(Property.locality_id == locality_id)
    if category_id is not None:
        query = query.filter(Property.category_id == category_id)
    if min_price is not None:
        query = query.filter(Property.price >= min_price)
    if max_price is not None:
        query = query.filter(Property.price <= max_price)
    if min_area is not None:
        query = query.filter(Property.carpet_area_sqft >= min_area)
    if max_area is not None:
        query = query.filter(Property.carpet_area_sqft <= max_area)
    if search:
        pattern = f"%{search}%"
        query = query.filter(or_(Property.title.ilike(pattern), Property.description.ilike(pattern)))
    if amenity_ids:
        # Each .any() adds its own EXISTS clause; chained filters AND together,
        # so a property must have every requested amenity, not just one of them.
        for amenity_id in amenity_ids:
            query = query.filter(Property.amenities.any(Amenity.id == amenity_id))

    total = query.count()
    items = (
        query.order_by(Property.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return total, items


def list_all_properties_for_admin(
    db: Session, *, page: int = 1, page_size: int = 50
) -> tuple[int, list[Property]]:
    query = db.query(Property).options(*LIST_LOAD_OPTIONS, joinedload(Property.owner))
    total = query.count()
    items = (
        query.order_by(Property.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return total, items


def list_properties_by_owner(db: Session, owner_id: int) -> list[Property]:
    return (
        db.query(Property)
        .options(*LIST_LOAD_OPTIONS)
        .filter(Property.owner_id == owner_id)
        .order_by(Property.created_at.desc())
        .all()
    )


def create_property(db: Session, owner_id: int, data: PropertyCreate) -> Property:
    payload = data.model_dump(exclude={"amenity_ids"})
    prop = Property(owner_id=owner_id, **payload)
    if data.amenity_ids:
        prop.amenities = db.query(Amenity).filter(Amenity.id.in_(data.amenity_ids)).all()
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return get_property(db, prop.id)


def update_property(db: Session, prop: Property, data: PropertyUpdate) -> Property:
    update_data = data.model_dump(exclude={"amenity_ids"}, exclude_unset=True)
    for field, value in update_data.items():
        setattr(prop, field, value)
    if data.amenity_ids is not None:
        prop.amenities = db.query(Amenity).filter(Amenity.id.in_(data.amenity_ids)).all()
    db.commit()
    db.refresh(prop)
    return get_property(db, prop.id)


def delete_property(db: Session, prop: Property) -> None:
    db.delete(prop)
    db.commit()


def add_property_images(db: Session, property_id: int, image_urls: list[str]) -> list[PropertyImage]:
    existing_count = db.query(PropertyImage).filter(PropertyImage.property_id == property_id).count()
    images = []
    for i, url in enumerate(image_urls):
        images.append(
            PropertyImage(
                property_id=property_id,
                image_url=url,
                is_primary=(existing_count == 0 and i == 0),
                display_order=existing_count + i,
            )
        )
    db.add_all(images)
    db.commit()
    return images


def primary_image_url(prop: Property) -> str | None:
    if not prop.images:
        return None
    primary = next((img for img in prop.images if img.is_primary), None)
    return (primary or prop.images[0]).image_url
