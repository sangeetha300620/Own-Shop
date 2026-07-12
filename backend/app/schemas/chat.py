from pydantic import BaseModel

from app.models.enums import ListingType
from app.schemas.property import PaginatedProperties


class ChatSearchRequest(BaseModel):
    message: str


class AppliedFilters(BaseModel):
    listing_type: ListingType | None = None
    city: str | None = None
    locality: str | None = None
    category: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    min_area: float | None = None
    max_area: float | None = None
    amenities: list[str] = []


class ChatSearchResponse(BaseModel):
    reply: str
    filters_applied: AppliedFilters
    results: PaginatedProperties
