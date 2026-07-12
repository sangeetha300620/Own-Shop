from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import FurnishingStatus, ListingType, PropertyStatus
from app.schemas.lookup import AmenityOut, CityOut, LocalityOut, ShopCategoryOut
from app.schemas.user import UserOut


class PropertyImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    image_url: str
    is_primary: bool
    display_order: int


class PropertyBase(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    description: str | None = None
    listing_type: ListingType
    category_id: int
    city_id: int
    locality_id: int | None = None
    address_line: str | None = None
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    carpet_area_sqft: float | None = None
    built_up_area_sqft: float | None = None
    price: float = Field(gt=0)
    security_deposit: float | None = None
    maintenance_charge: float | None = None
    lease_duration_years: int | None = None
    floor_number: int | None = None
    total_floors: int | None = None
    furnishing_status: FurnishingStatus = FurnishingStatus.UNFURNISHED
    frontage_width_ft: float | None = None
    is_corner_property: bool = False


class PropertyCreate(PropertyBase):
    amenity_ids: list[int] = Field(default_factory=list)


class PropertyUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=200)
    description: str | None = None
    listing_type: ListingType | None = None
    category_id: int | None = None
    city_id: int | None = None
    locality_id: int | None = None
    address_line: str | None = None
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    carpet_area_sqft: float | None = None
    built_up_area_sqft: float | None = None
    price: float | None = Field(default=None, gt=0)
    security_deposit: float | None = None
    maintenance_charge: float | None = None
    lease_duration_years: int | None = None
    floor_number: int | None = None
    total_floors: int | None = None
    furnishing_status: FurnishingStatus | None = None
    frontage_width_ft: float | None = None
    is_corner_property: bool | None = None
    status: PropertyStatus | None = None
    amenity_ids: list[int] | None = None


class PropertyListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    listing_type: ListingType
    price: float
    carpet_area_sqft: float | None
    city: CityOut
    locality: LocalityOut | None
    category: ShopCategoryOut
    status: PropertyStatus
    primary_image_url: str | None = None
    created_at: datetime


class PropertyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    title: str
    description: str | None
    listing_type: ListingType
    category: ShopCategoryOut
    city: CityOut
    locality: LocalityOut | None
    address_line: str | None
    pincode: str | None
    latitude: float | None
    longitude: float | None
    carpet_area_sqft: float | None
    built_up_area_sqft: float | None
    price: float
    security_deposit: float | None
    maintenance_charge: float | None
    lease_duration_years: int | None
    floor_number: int | None
    total_floors: int | None
    furnishing_status: FurnishingStatus
    frontage_width_ft: float | None
    is_corner_property: bool
    status: PropertyStatus
    is_verified: bool
    views_count: int
    images: list[PropertyImageOut]
    amenities: list[AmenityOut]
    owner: UserOut
    created_at: datetime
    updated_at: datetime


class PaginatedProperties(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[PropertyListItem]


class AdminPropertyListItem(PropertyListItem):
    owner_id: int
    owner_name: str
    owner_email: str


class PaginatedAdminProperties(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[AdminPropertyListItem]
