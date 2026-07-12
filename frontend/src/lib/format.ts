import type { ListingType } from "./types";

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function priceLabel(listingType: ListingType, price: number): string {
  const formatted = formatINR(price);
  if (listingType === "RENT") return `${formatted}/month`;
  return formatted;
}

export const LISTING_TYPES: { value: ListingType; label: string; description: string }[] = [
  { value: "RENT", label: "Rent", description: "Find a shop to rent monthly" },
  { value: "LEASE", label: "Lease", description: "Find a shop on long-term lease" },
  { value: "SALE", label: "Sale", description: "Find a shop to buy" },
];

const LISTING_TYPE_STYLES: Record<ListingType, { badge: string; solid: string; text: string }> = {
  RENT: {
    badge: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
    solid: "bg-blue-600 hover:bg-blue-700",
    text: "text-blue-600",
  },
  LEASE: {
    badge: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20",
    solid: "bg-purple-600 hover:bg-purple-700",
    text: "text-purple-600",
  },
  SALE: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    solid: "bg-emerald-600 hover:bg-emerald-700",
    text: "text-emerald-600",
  },
};

export function listingTypeStyles(type: ListingType) {
  return LISTING_TYPE_STYLES[type];
}

const CATEGORY_ICON_KEYWORDS: [string, string][] = [
  ["restaurant", "UtensilsCrossed"],
  ["cafe", "UtensilsCrossed"],
  ["office", "Briefcase"],
  ["warehouse", "Warehouse"],
  ["godown", "Warehouse"],
  ["showroom", "Store"],
  ["salon", "Sparkles"],
  ["spa", "Sparkles"],
  ["clinic", "Stethoscope"],
  ["medical", "Stethoscope"],
  ["supermarket", "ShoppingCart"],
  ["gym", "Dumbbell"],
  ["fitness", "Dumbbell"],
  ["retail", "Store"],
];

export function categoryIconName(categoryName: string): string {
  const lower = categoryName.toLowerCase();
  const match = CATEGORY_ICON_KEYWORDS.find(([keyword]) => lower.includes(keyword));
  return match ? match[1] : "Building2";
}
