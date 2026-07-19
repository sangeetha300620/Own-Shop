from sqlalchemy.orm import Session

from app.crud.crud_property import LIST_LOAD_OPTIONS
from app.models.property import Property
from app.models.saved_property import SavedProperty


def is_saved(db: Session, user_id: int, property_id: int) -> bool:
    return (
        db.query(SavedProperty)
        .filter(SavedProperty.user_id == user_id, SavedProperty.property_id == property_id)
        .first()
        is not None
    )


def save_property(db: Session, user_id: int, property_id: int) -> None:
    if is_saved(db, user_id, property_id):
        return
    db.add(SavedProperty(user_id=user_id, property_id=property_id))
    db.commit()


def unsave_property(db: Session, user_id: int, property_id: int) -> bool:
    saved = (
        db.query(SavedProperty)
        .filter(SavedProperty.user_id == user_id, SavedProperty.property_id == property_id)
        .first()
    )
    if not saved:
        return False
    db.delete(saved)
    db.commit()
    return True


def list_saved_properties(db: Session, user_id: int) -> list[Property]:
    return (
        db.query(Property)
        .join(SavedProperty, SavedProperty.property_id == Property.id)
        .options(*LIST_LOAD_OPTIONS)
        .filter(SavedProperty.user_id == user_id)
        .order_by(SavedProperty.created_at.desc())
        .all()
    )
