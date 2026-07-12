"""LLM-powered natural-language query understanding for the search chatbot.

Uses Google Gemini's free tier (no cost — see GEMINI_API_KEY in .env) with
structured output to turn a free-text message into search filters grounded
against the site's actual cities/categories/amenities, so the model can't
invent values that don't exist in the database.
"""

import logging
from typing import Literal

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: genai.Client | None = None
_client_checked = False


def _get_client() -> genai.Client | None:
    global _client, _client_checked
    if not _client_checked:
        _client_checked = True
        if settings.GEMINI_API_KEY:
            _client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            logger.warning("GEMINI_API_KEY not set — chat search understanding is disabled.")
    return _client


class ExtractedFilters(BaseModel):
    listing_type: Literal["RENT", "LEASE", "SALE"] | None = None
    city: str | None = None
    locality: str | None = None
    category: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    min_area: float | None = None
    max_area: float | None = None
    amenities: list[str] = Field(default_factory=list)

    def has_any_signal(self) -> bool:
        return any(
            [
                self.listing_type,
                self.city,
                self.locality,
                self.category,
                self.min_price is not None,
                self.max_price is not None,
                self.min_area is not None,
                self.max_area is not None,
                self.amenities,
            ]
        )


def _system_instruction(cities: list[str], categories: list[str], amenities: list[str]) -> str:
    return (
        "You are the search-understanding assistant for MY OWN SHOP, a marketplace "
        "for commercial spaces only (shops, offices, showrooms, warehouses, etc.) "
        "— never residential homes. Every listing is either RENT, LEASE, or SALE.\n\n"
        "Extract structured search filters from the user's message. Only fill a "
        "field when the message clearly implies it; leave it null/empty otherwise. "
        "Never invent a city, category, or amenity that isn't in the lists below — "
        "if the user names something close, map it to the nearest valid option "
        "(e.g. 'Bangalore' -> 'Bengaluru', 'Bombay' -> 'Mumbai', 'cafe' -> the "
        "closest matching category); if nothing is close, leave it null.\n\n"
        f"Valid cities: {', '.join(cities) or '(none yet)'}\n"
        f"Valid shop categories: {', '.join(categories) or '(none yet)'}\n"
        f"Valid amenities: {', '.join(amenities) or '(none yet)'}\n\n"
        "Prices and areas use Indian numbering in casual speech — interpret 'k' "
        "as thousands, 'lakh'/'lac' as 100,000, and 'crore'/'cr' as 10,000,000. "
        "Return min_price/max_price/min_area/max_area as plain numbers only "
        "(no currency symbols, no commas, no units)."
    )


def extract_filters(
    message: str, cities: list[str], categories: list[str], amenities: list[str]
) -> ExtractedFilters | None:
    """Returns None if understanding is unavailable (no API key, API error,
    rate limit, or an unparseable response) — callers should fall back
    gracefully rather than crash."""
    client = _get_client()
    if client is None:
        return None

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=message,
            config=types.GenerateContentConfig(
                system_instruction=_system_instruction(cities, categories, amenities),
                response_mime_type="application/json",
                response_schema=ExtractedFilters,
            ),
        )
    except Exception:
        logger.exception("Gemini extraction request failed")
        return None

    if isinstance(response.parsed, ExtractedFilters):
        return response.parsed

    try:
        return ExtractedFilters.model_validate_json(response.text)
    except Exception:
        logger.exception("Could not parse Gemini response as ExtractedFilters: %r", response.text)
        return None


def _format_inr(amount: float) -> str:
    return f"₹{amount:,.0f}"


def describe_filters(filters: ExtractedFilters) -> str:
    parts: list[str] = []
    if filters.listing_type:
        parts.append(f"for {filters.listing_type.lower()}")
    if filters.category:
        parts.append(f'category "{filters.category}"')
    location_bits = [b for b in (filters.locality, filters.city) if b]
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
    if filters.amenities:
        parts.append(f"with {', '.join(filters.amenities)}")
    return " ".join(parts)


def build_reply(filters: ExtractedFilters | None, total_results: int) -> str:
    if filters is None:
        return (
            "I couldn't understand that right now — search assistance is "
            "temporarily unavailable. Try browsing using the Rent/Lease/Sale "
            "tabs above instead."
        )

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
            '"retail shops for rent in Bengaluru under 50000" or "office for sale in Mumbai".'
        )

    plural = "shop" if total_results == 1 else "shops"
    if description:
        return f"Found {total_results} {plural}{suffix}. Here's what I found:"
    return f"Found {total_results} {plural} matching your search. Here's what I found:"
