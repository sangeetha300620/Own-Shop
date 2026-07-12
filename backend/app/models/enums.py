import enum


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class ListingType(str, enum.Enum):
    RENT = "RENT"
    LEASE = "LEASE"
    SALE = "SALE"


class FurnishingStatus(str, enum.Enum):
    UNFURNISHED = "UNFURNISHED"
    SEMI_FURNISHED = "SEMI_FURNISHED"
    FULLY_FURNISHED = "FULLY_FURNISHED"


class PropertyStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    TRANSACTED = "TRANSACTED"


class InquiryStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    CLOSED = "CLOSED"
