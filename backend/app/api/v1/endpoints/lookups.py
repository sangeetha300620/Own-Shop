from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lookup import Amenity, City, Locality, ShopCategory
from app.schemas.lookup import AmenityOut, CityOut, LocalityOut, ShopCategoryOut

router = APIRouter(tags=["lookups"])


@router.get("/cities", response_model=list[CityOut])
def list_cities(db: Session = Depends(get_db)):
    return db.query(City).order_by(City.name).all()


@router.get("/cities/{city_id}/localities", response_model=list[LocalityOut])
def list_localities(city_id: int, db: Session = Depends(get_db)):
    return db.query(Locality).filter(Locality.city_id == city_id).order_by(Locality.name).all()


@router.get("/categories", response_model=list[ShopCategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(ShopCategory).order_by(ShopCategory.name).all()


@router.get("/amenities", response_model=list[AmenityOut])
def list_amenities(db: Session = Depends(get_db)):
    return db.query(Amenity).order_by(Amenity.name).all()
