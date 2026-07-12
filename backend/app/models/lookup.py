from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class City(Base):
    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)

    localities: Mapped[list["Locality"]] = relationship(back_populates="city")


class Locality(Base):
    __tablename__ = "localities"

    id: Mapped[int] = mapped_column(primary_key=True)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    city: Mapped["City"] = relationship(back_populates="localities")


class ShopCategory(Base):
    __tablename__ = "shop_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)


class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
