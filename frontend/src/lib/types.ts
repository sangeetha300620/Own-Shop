export type ListingType = "RENT" | "LEASE" | "SALE";
export type FurnishingStatus = "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED";
export type PropertyStatus = "ACTIVE" | "INACTIVE" | "TRANSACTED";
export type InquiryStatus = "NEW" | "CONTACTED" | "CLOSED";

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: "user" | "admin";
  company_name: string | null;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface City {
  id: number;
  name: string;
  state: string | null;
}

export interface Locality {
  id: number;
  name: string;
  city_id: number;
}

export interface ShopCategory {
  id: number;
  name: string;
}

export interface Amenity {
  id: number;
  name: string;
}

export interface PropertyImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface PropertyListItem {
  id: number;
  title: string;
  listing_type: ListingType;
  price: number;
  carpet_area_sqft: number | null;
  city: City;
  locality: Locality | null;
  category: ShopCategory;
  status: PropertyStatus;
  primary_image_url: string | null;
  created_at: string;
}

export interface AdminPropertyListItem extends PropertyListItem {
  owner_id: number;
  owner_name: string;
  owner_email: string;
}

export interface PaginatedAdminProperties {
  total: number;
  page: number;
  page_size: number;
  items: AdminPropertyListItem[];
}

export interface PropertyDetail {
  id: number;
  owner_id: number;
  title: string;
  description: string | null;
  listing_type: ListingType;
  category: ShopCategory;
  city: City;
  locality: Locality | null;
  address_line: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  carpet_area_sqft: number | null;
  built_up_area_sqft: number | null;
  price: number;
  security_deposit: number | null;
  maintenance_charge: number | null;
  lease_duration_years: number | null;
  floor_number: number | null;
  total_floors: number | null;
  furnishing_status: FurnishingStatus;
  frontage_width_ft: number | null;
  is_corner_property: boolean;
  status: PropertyStatus;
  is_verified: boolean;
  views_count: number;
  images: PropertyImage[];
  amenities: Amenity[];
  owner: User;
  created_at: string;
  updated_at: string;
}

export interface PaginatedProperties {
  total: number;
  page: number;
  page_size: number;
  items: PropertyListItem[];
}

export interface PropertyFormData {
  title: string;
  description: string;
  listing_type: ListingType;
  category_id: number;
  city_id: number;
  locality_id: number | null;
  address_line: string;
  pincode: string;
  carpet_area_sqft: number | null;
  built_up_area_sqft: number | null;
  price: number;
  security_deposit: number | null;
  maintenance_charge: number | null;
  lease_duration_years: number | null;
  floor_number: number | null;
  total_floors: number | null;
  furnishing_status: FurnishingStatus;
  frontage_width_ft: number | null;
  is_corner_property: boolean;
  amenity_ids: number[];
}

export interface AppliedFilters {
  listing_type: ListingType | null;
  city: string | null;
  locality: string | null;
  category: string | null;
  min_price: number | null;
  max_price: number | null;
  min_area: number | null;
  max_area: number | null;
  amenities: string[];
}

export interface ChatSearchResponse {
  reply: string;
  filters_applied: AppliedFilters;
  results: PaginatedProperties;
}

export interface InquiryReceived {
  id: number;
  property_id: number;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: InquiryStatus;
  created_at: string;
  property_title: string;
}
