-- MY OWN SHOP — full database schema for "My Own Shop" (PostgreSQL)
--
-- This is a reference copy of the schema that already exists in your
-- database (it was created programmatically via Alembic migration
-- backend/alembic/versions/c147dbdfdba7_initial_schema.py). You do NOT
-- need to run this for the app to work — it already works. Run this
-- only if you want to recreate the schema elsewhere, or want a plain
-- SQL copy for your own records.
--
-- Safe to run on an empty database. Will NOT error if tables already
-- exist (uses IF NOT EXISTS / exception-guarded enum creation), and
-- will NOT touch or delete any existing data.

BEGIN;

-- ── Enum types ──────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE listing_type AS ENUM ('RENT', 'LEASE', 'SALE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE furnishing_status AS ENUM ('UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE property_status AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSACTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE inquiry_status AS ENUM ('NEW', 'CONTACTED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Users: everyone who registers (owners/brokers AND buyers/tenants
--    are the same table — any user can both list and inquire) ───────
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,       -- bcrypt hash, never plaintext
    role user_role NOT NULL DEFAULT 'USER',
    company_name VARCHAR(150),                  -- optional, for brokers
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_phone ON users (phone);

-- ── Lookup / reference tables ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS localities (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL REFERENCES cities (id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS amenities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- ── Properties: the core shop listing table. listing_type is the
--    primary Rent/Lease/Sale filter and is indexed. ─────────────────
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    listing_type listing_type NOT NULL,
    category_id INTEGER NOT NULL REFERENCES shop_categories (id),
    city_id INTEGER NOT NULL REFERENCES cities (id),
    locality_id INTEGER REFERENCES localities (id),
    address_line VARCHAR(255),
    pincode VARCHAR(10),
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    carpet_area_sqft NUMERIC(10, 2),
    built_up_area_sqft NUMERIC(10, 2),
    price NUMERIC(14, 2) NOT NULL,
    security_deposit NUMERIC(14, 2),
    maintenance_charge NUMERIC(12, 2),
    lease_duration_years INTEGER,
    floor_number INTEGER,
    total_floors INTEGER,
    furnishing_status furnishing_status NOT NULL DEFAULT 'UNFURNISHED',
    frontage_width_ft NUMERIC(6, 2),
    is_corner_property BOOLEAN NOT NULL DEFAULT FALSE,
    status property_status NOT NULL DEFAULT 'ACTIVE',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_properties_listing_type ON properties (listing_type);
CREATE INDEX IF NOT EXISTS ix_properties_city_id ON properties (city_id);
CREATE INDEX IF NOT EXISTS ix_properties_locality_id ON properties (locality_id);
CREATE INDEX IF NOT EXISTS ix_properties_status ON properties (status);

-- ── Property photos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_images (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ── Property <-> Amenity many-to-many ──────────────────────────────
CREATE TABLE IF NOT EXISTS property_amenities (
    property_id INTEGER NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    amenity_id INTEGER NOT NULL REFERENCES amenities (id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, amenity_id)
);

-- ── Inquiries: a buyer/tenant messaging a shop owner ───────────────
CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    message TEXT,
    status inquiry_status NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMIT;
