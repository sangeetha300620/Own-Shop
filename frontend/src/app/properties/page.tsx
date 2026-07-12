"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";
import { LISTING_TYPES, listingTypeStyles } from "@/lib/format";
import type {
  City,
  ListingType,
  Locality,
  PaginatedProperties,
  ShopCategory,
} from "@/lib/types";
import PropertyCard from "@/components/PropertyCard";
import { PropertyGridSkeleton } from "@/components/ui/Skeleton";

const selectClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-50 disabled:text-gray-400";
const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

function PropertiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const listingType = (searchParams.get("listing_type") as ListingType) || "RENT";
  const cityId = searchParams.get("city_id") || "";
  const localityId = searchParams.get("locality_id") || "";
  const categoryId = searchParams.get("category_id") || "";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page") || "1");

  const hasActiveFilters = Boolean(cityId || localityId || categoryId || minPrice || maxPrice || search);

  const [cities, setCities] = useState<City[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [result, setResult] = useState<PaginatedProperties | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    api.get<City[]>("/cities").then(setCities).catch(() => {});
    api.get<ShopCategory[]>("/categories").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cityId) {
      setLocalities([]);
      return;
    }
    api
      .get<Locality[]>(`/cities/${cityId}/localities`)
      .then(setLocalities)
      .catch(() => setLocalities([]));
  }, [cityId]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("listing_type", listingType);
    if (cityId) params.set("city_id", cityId);
    if (localityId) params.set("locality_id", localityId);
    if (categoryId) params.set("category_id", categoryId);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("page_size", "12");

    api
      .get<PaginatedProperties>(`/properties?${params.toString()}`)
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [listingType, cityId, localityId, categoryId, minPrice, maxPrice, search, page]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("page");
      router.push(`/properties?${params.toString()}`);
    },
    [router, searchParams]
  );

  function clearFilters() {
    router.push(`/properties?listing_type=${listingType}`);
  }

  const styles = listingTypeStyles(listingType);
  const totalPages = result ? Math.ceil(result.total / result.page_size) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex gap-1.5 rounded-xl bg-gray-100 p-1.5 sm:w-fit">
        {LISTING_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => updateParams({ listing_type: t.value, locality_id: null })}
            className={`flex-1 rounded-lg px-6 py-2 text-sm font-semibold transition sm:flex-none ${
              listingType === t.value
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateParams({ search: searchInput });
              }}
            >
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search title or description"
                className={inputClass}
              />
            </form>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">City</label>
              <select
                value={cityId}
                onChange={(e) => updateParams({ city_id: e.target.value, locality_id: null })}
                className={selectClass}
              >
                <option value="">Any city</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Locality</label>
              <select
                value={localityId}
                onChange={(e) => updateParams({ locality_id: e.target.value })}
                disabled={!cityId}
                className={selectClass}
              >
                <option value="">Any locality</option>
                {localities.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Shop type</label>
              <select
                value={categoryId}
                onChange={(e) => updateParams({ category_id: e.target.value })}
                className={selectClass}
              >
                <option value="">Any type</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Price range (₹)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  defaultValue={minPrice}
                  onBlur={(e) => updateParams({ min_price: e.target.value })}
                  placeholder="Min"
                  className={inputClass}
                />
                <input
                  type="number"
                  defaultValue={maxPrice}
                  onBlur={(e) => updateParams({ max_price: e.target.value })}
                  placeholder="Max"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {loading ? (
                "Searching..."
              ) : (
                <>
                  <span className="font-semibold text-gray-900">{result?.total ?? 0}</span> shops
                  found for <span className={`font-semibold ${styles.text}`}>{listingType.toLowerCase()}</span>
                </>
              )}
            </p>
          </div>

          {loading ? (
            <PropertyGridSkeleton count={6} />
          ) : result && result.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => updateParams({ page: String(page - 1) })}
                    disabled={page <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => updateParams({ page: String(p) })}
                      className={`h-9 w-9 rounded-lg text-sm font-semibold ${
                        p === page
                          ? "bg-indigo-600 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => updateParams({ page: String(page + 1) })}
                    disabled={page >= totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 py-24 text-center text-gray-500">
              <SearchX className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p>No shops match these filters. Try widening your search.</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PropertyGridSkeleton count={6} />
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}
