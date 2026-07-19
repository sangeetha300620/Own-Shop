"""Rule-based natural-language query parser for the search chatbot.

No external API calls, no cost per query. Works by matching known
vocabulary (cities, localities, categories, amenities already in the DB)
and regex-based price/area extraction against the user's free-text
message. Handles the common phrasing patterns for this domain well;
it is not a general-purpose language model, so genuinely open-ended
questions won't be understood beyond keyword matching.
"""

import re
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.models.enums import ListingType
from app.models.lookup import Amenity, City, Locality, ShopCategory

CITY_ALIASES: dict[str, str] = {
    "bangalore": "Bengaluru",
    "bengaluru": "Bengaluru",
    "bombay": "Mumbai",
    "mumbai": "Mumbai",
    "madras": "Chennai",
    "chennai": "Chennai",
    "hyderabad": "Hyderabad",
    "pune": "Pune",
    "delhi": "Delhi",
    "new delhi": "Delhi",
}

RENT_WORDS = ["rent", "renting", "rental", "to let", "for rent"]
LEASE_WORDS = ["lease", "leasing", "leased"]
SALE_WORDS = ["sale", "sell", "selling", "buy", "buying", "purchase", "for sale"]

CATEGORY_SYNONYMS: dict[str, list[str]] = {
    "Retail Store": ["retail store", "retail shop", "retail"],
    "Restaurant / Café": ["restaurant", "cafe", "café", "food", "dining", "eatery"],
    "Office Space": ["office"],
    "Warehouse / Godown": ["warehouse", "godown", "storage"],
    "Showroom": ["showroom"],
    "Salon / Spa": ["salon", "spa", "parlour", "parlor"],
    "Clinic / Medical": ["clinic", "medical", "hospital", "pharmacy"],
    "Supermarket": ["supermarket", "grocery", "grocer", "mart"],
    "Gym / Fitness Studio": ["gym", "fitness", "workout"],
}

AMENITY_SYNONYMS: dict[str, list[str]] = {
    "Parking": ["parking"],
    "Power Backup": ["power backup", "generator", "backup power"],
    "Lift": ["lift", "elevator"],
    "CCTV Surveillance": ["cctv", "camera", "surveillance"],
    "Air Conditioning": ["air conditioning", "air-conditioned", "a/c", "ac"],
    "24x7 Water Supply": ["water supply"],
    "Loading / Unloading Dock": ["loading dock", "loading bay", "unloading"],
    "Display Frontage / Window": ["frontage", "display window", "shop window"],
    "Fire Safety System": ["fire safety", "fire extinguisher"],
    "Washroom": ["washroom", "restroom", "toilet"],
    "Security Guard": ["security guard", "watchman"],
    "Internet / Wi-Fi Ready": ["wifi", "wi-fi", "internet"],
}

_NUM = r"(\d+(?:[.,]\d+)?)\s*(lakhs?|lacs?|crores?|cr|k|thousand)?"
_BETWEEN_RE = re.compile(rf"between\s+{_NUM}\s+(?:and|to)\s+{_NUM}", re.IGNORECASE)
_RANGE_RE = re.compile(rf"{_NUM}\s*(?:to|-)\s*{_NUM}", re.IGNORECASE)
_UNDER_RE = re.compile(
    rf"(?:under|below|less than|within|up ?to|max(?:imum)?(?:\s+budget)?)\s+{_NUM}",
    re.IGNORECASE,
)
_OVER_RE = re.compile(
    rf"(?:above|over|more than|min(?:imum)?(?:\s+budget)?|starting from)\s+{_NUM}",
    re.IGNORECASE,
)
_AREA_RE = re.compile(rf"{_NUM}\s*(?:sq\s*\.?\s*ft|sqft|square\s*feet)", re.IGNORECASE)


def _amount(num_str: str, unit: str | None) -> float:
    value = float(num_str.replace(",", ""))
    if not unit:
        return value
    unit = unit.lower()
    if unit in ("k", "thousand"):
        return value * 1_000
    if unit in ("lakh", "lakhs", "lac", "lacs"):
        return value * 100_000
    if unit in ("crore", "crores", "cr"):
        return value * 10_000_000
    return value


def _contains_phrase(text: str, phrase: str) -> bool:
    return re.search(rf"\b{re.escape(phrase)}\b", text, re.IGNORECASE) is not None


@dataclass
class ParsedFilters:
    listing_type: ListingType | None = None
    city_id: int | None = None
    city_name: str | None = None
    locality_id: int | None = None
    locality_name: str | None = None
    category_id: int | None = None
    category_name: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    min_area: float | None = None
    max_area: float | None = None
    amenity_ids: list[int] = field(default_factory=list)
    amenity_names: list[str] = field(default_factory=list)
    unmatched_keywords: str | None = None

    def has_any_signal(self) -> bool:
        return any(
            [
                self.listing_type,
                self.city_id,
                self.locality_id,
                self.category_id,
                self.min_price is not None,
                self.max_price is not None,
                self.min_area is not None,
                self.max_area is not None,
                self.amenity_ids,
            ]
        )


def parse_query(db: Session, message: str) -> ParsedFilters:
    query = message.strip()
    result = ParsedFilters()

    # --- listing type ---
    if any(_contains_phrase(query, w) for w in SALE_WORDS):
        result.listing_type = ListingType.SALE
    elif any(_contains_phrase(query, w) for w in LEASE_WORDS):
        result.listing_type = ListingType.LEASE
    elif any(_contains_phrase(query, w) for w in RENT_WORDS):
        result.listing_type = ListingType.RENT

    # --- city ---
    cities = db.query(City).all()
    city_by_name = {c.name.lower(): c for c in cities}
    matched_city: City | None = None
    for alias, canonical in CITY_ALIASES.items():
        if _contains_phrase(query, alias):
            matched_city = city_by_name.get(canonical.lower())
            if matched_city:
                break
    if matched_city:
        result.city_id = matched_city.id
        result.city_name = matched_city.name

    # --- locality (scoped to matched city if any) ---
    locality_q = db.query(Locality)
    if matched_city:
        locality_q = locality_q.filter(Locality.city_id == matched_city.id)
    for locality in locality_q.all():
        if _contains_phrase(query, locality.name):
            result.locality_id = locality.id
            result.locality_name = locality.name
            if not matched_city:
                city = db.get(City, locality.city_id)
                if city:
                    result.city_id = city.id
                    result.city_name = city.name
            break

    # --- category ---
    categories = {c.name: c for c in db.query(ShopCategory).all()}
    for cat_name, synonyms in CATEGORY_SYNONYMS.items():
        if cat_name not in categories:
            continue
        if any(_contains_phrase(query, syn) for syn in synonyms):
            result.category_id = categories[cat_name].id
            result.category_name = cat_name
            break

    # --- amenities ---
    amenities = {a.name: a for a in db.query(Amenity).all()}
    for amenity_name, synonyms in AMENITY_SYNONYMS.items():
        if amenity_name not in amenities:
            continue
        if any(_contains_phrase(query, syn) for syn in synonyms):
            result.amenity_ids.append(amenities[amenity_name].id)
            result.amenity_names.append(amenity_name)

    # --- area (extract & mask before price parsing to avoid cross-matching) ---
    working = query
    area_match = _AREA_RE.search(working)
    if area_match:
        result.min_area = None
        result.max_area = _amount(area_match.group(1), area_match.group(2))
        working = working[: area_match.start()] + working[area_match.end() :]

    # --- price ---
    between_match = _BETWEEN_RE.search(working)
    range_match = _RANGE_RE.search(working) if not between_match else None
    if between_match:
        a = _amount(between_match.group(1), between_match.group(2))
        b = _amount(between_match.group(3), between_match.group(4))
        result.min_price, result.max_price = min(a, b), max(a, b)
    elif range_match:
        a = _amount(range_match.group(1), range_match.group(2))
        b = _amount(range_match.group(3), range_match.group(4))
        result.min_price, result.max_price = min(a, b), max(a, b)
    else:
        under_match = _UNDER_RE.search(working)
        if under_match:
            result.max_price = _amount(under_match.group(1), under_match.group(2))
        over_match = _OVER_RE.search(working)
        if over_match:
            result.min_price = _amount(over_match.group(1), over_match.group(2))

    return result


def _format_inr(amount: float) -> str:
    return f"₹{amount:,.0f}"


def describe_filters(filters: ParsedFilters) -> str:
    parts: list[str] = []
    if filters.listing_type:
        parts.append(f"for {filters.listing_type.value.lower()}")
    if filters.category_name:
        parts.append(f"category \"{filters.category_name}\"")
    location_bits = [b for b in (filters.locality_name, filters.city_name) if b]
    if location_bits:
        parts.append(f"in {', '.join(location_bits)}")
    if filters.min_price is not None and filters.max_price is not None:
        parts.append(f"between {_format_inr(filters.min_price)} and {_format_inr(filters.max_price)}")
    elif filters.max_price is not None:
        parts.append(f"under {_format_inr(filters.max_price)}")
    elif filters.min_price is not None:
        parts.append(f"above {_format_inr(filters.min_price)}")
    if filters.max_area is not None:
        parts.append(f"around {filters.max_area:,.0f} sqft")
    if filters.amenity_names:
        parts.append(f"with {', '.join(filters.amenity_names)}")
    return " ".join(parts)


def build_reply(filters: ParsedFilters, total_results: int) -> str:
    description = describe_filters(filters)
    suffix = f" {description}" if description else ""

    if total_results == 0:
        if description:
            return (
                f"I couldn't find any shops{suffix}. Try widening your search — "
                "for example, drop the price limit or try a nearby locality."
            )
        return (
            "I couldn't quite tell what you're looking for. Try something like "
            "\"retail shops for rent in Bengaluru under 50000\" or \"office for sale in Mumbai\"."
        )

    plural = "shop" if total_results == 1 else "shops"
    if description:
        return f"Found {total_results} {plural}{suffix}. Here's what I found:"
    return f"Found {total_results} {plural} matching your search. Here's what I found:"
