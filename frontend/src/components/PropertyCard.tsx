import Link from "next/link";
import { Building2, MapPin, Ruler, Sparkles } from "lucide-react";
import { resolveImageUrl } from "@/lib/api";
import { listingTypeStyles, priceLabel } from "@/lib/format";
import type { PropertyListItem } from "@/lib/types";

function isRecent(createdAt: string): boolean {
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
}

export default function PropertyCard({ property }: { property: PropertyListItem }) {
  const styles = listingTypeStyles(property.listing_type);
  const locationLabel = [property.locality?.name, property.city.name].filter(Boolean).join(", ");

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-900/10"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {property.primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveImageUrl(property.primary_image_url)}
            alt={property.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
            <Building2 className="h-10 w-10" strokeWidth={1.5} />
            <span className="text-xs font-medium">No photo yet</span>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur ${styles.badge}`}
          >
            {property.listing_type}
          </span>
          {isRecent(property.created_at) && (
            <span className="flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-1 text-xs font-bold text-amber-950 shadow-sm">
              <Sparkles className="h-3 w-3" />
              New
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 font-semibold text-gray-900 group-hover:text-indigo-600">
          {property.title}
        </h3>
        <p className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{locationLabel}</span>
        </p>
        <p className="text-xs font-medium text-gray-400">{property.category.name}</p>
        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className={`text-lg font-bold ${styles.text}`}>
            {priceLabel(property.listing_type, property.price)}
          </span>
          {property.carpet_area_sqft ? (
            <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
              <Ruler className="h-3.5 w-3.5" />
              {property.carpet_area_sqft} sqft
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
