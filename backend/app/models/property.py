from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import FurnishingStatus, ListingType, PropertyStatus

property_amenities = Table(
    "property_amenities",
    Base.metadata,
    Column("property_id", ForeignKey("properties.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    listing_type: Mapped[ListingType] = mapped_column(
        Enum(ListingType, name="listing_type"), nullable=False, index=True
    )

    category_id: Mapped[int] = mapped_column(ForeignKey("shop_categories.id"), nullable=False)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"), nullable=False, index=True)
    locality_id: Mapped[int | None] = mapped_column(ForeignKey("localities.id"), nullable=True, index=True)

    address_line: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)

    carpet_area_sqft: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    built_up_area_sqft: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    security_deposit: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    maintenance_charge: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    lease_duration_years: Mapped[int | None] = mapped_column(Integer, nullable=True)

    floor_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_floors: Mapped[int | None] = mapped_column(Integer, nullable=True)
    furnishing_status: Mapped[FurnishingStatus] = mapped_column(
        Enum(FurnishingStatus, name="furnishing_status"),
        default=FurnishingStatus.UNFURNISHED,
        nullable=False,
    )
    frontage_width_ft: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    is_corner_property: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    status: Mapped[PropertyStatus] = mapped_column(
        Enum(PropertyStatus, name="property_status"),
        default=PropertyStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner: Mapped["User"] = relationship(back_populates="properties")
    category: Mapped["ShopCategory"] = relationship()
    city: Mapped["City"] = relationship()
    locality: Mapped["Locality | None"] = relationship()
    images: Mapped[list["PropertyImage"]] = relationship(
        back_populates="property", cascade="all, delete-orphan", order_by="PropertyImage.display_order"
    )
    amenities: Mapped[list["Amenity"]] = relationship(secondary=property_amenities)
    inquiries: Mapped[list["Inquiry"]] = relationship(back_populates="property", cascade="all, delete-orphan")


class PropertyImage(Base):
    __tablename__ = "property_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    property: Mapped["Property"] = relationship(back_populates="images")
