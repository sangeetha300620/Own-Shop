"""Seeds baseline reference data: cities, localities, shop categories, amenities.

Run with: venv/Scripts/python.exe seed.py
Safe to re-run — skips rows that already exist.
"""

from app.core.database import SessionLocal
from app.models import Amenity, City, Locality, ShopCategory

CITIES_WITH_LOCALITIES = {
    "Bengaluru": ["Koramangala", "Indiranagar", "Whitefield", "HSR Layout", "Jayanagar", "MG Road"],
    "Mumbai": ["Andheri", "Bandra", "Powai", "Lower Parel", "Borivali"],
    "Chennai": ["T. Nagar", "Anna Nagar", "Velachery", "OMR", "Adyar"],
    "Hyderabad": ["Hitech City", "Gachibowli", "Banjara Hills", "Madhapur"],
    "Pune": ["Hinjewadi", "Kothrud", "Viman Nagar", "Baner"],
    "Delhi": ["Connaught Place", "Karol Bagh", "Saket", "Dwarka"],
}

SHOP_CATEGORIES = [
    "Retail Store",
    "Restaurant / Café",
    "Office Space",
    "Warehouse / Godown",
    "Showroom",
    "Salon / Spa",
    "Clinic / Medical",
    "Supermarket",
    "Gym / Fitness Studio",
    "Other",
]

AMENITIES = [
    "Parking",
    "Power Backup",
    "Lift",
    "CCTV Surveillance",
    "Air Conditioning",
    "24x7 Water Supply",
    "Loading / Unloading Dock",
    "Display Frontage / Window",
    "Fire Safety System",
    "Washroom",
    "Security Guard",
    "Internet / Wi-Fi Ready",
]


def seed() -> None:
    db = SessionLocal()
    try:
        for city_name, localities in CITIES_WITH_LOCALITIES.items():
            city = db.query(City).filter_by(name=city_name).first()
            if not city:
                city = City(name=city_name)
                db.add(city)
                db.flush()
                print(f"Added city: {city_name}")

            existing_localities = {loc.name for loc in db.query(Locality).filter_by(city_id=city.id)}
            for locality_name in localities:
                if locality_name not in existing_localities:
                    db.add(Locality(city_id=city.id, name=locality_name))
                    print(f"  Added locality: {locality_name} ({city_name})")

        existing_categories = {c.name for c in db.query(ShopCategory)}
        for name in SHOP_CATEGORIES:
            if name not in existing_categories:
                db.add(ShopCategory(name=name))
                print(f"Added shop category: {name}")

        existing_amenities = {a.name for a in db.query(Amenity)}
        for name in AMENITIES:
            if name not in existing_amenities:
                db.add(Amenity(name=name))
                print(f"Added amenity: {name}")

        db.commit()
        print("Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
