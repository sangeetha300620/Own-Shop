"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  MapPinned,
  MessageSquareText,
  Search,
  ShieldCheck,
  Store,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { LISTING_TYPES } from "@/lib/format";
import type { City, ListingType, PaginatedProperties, ShopCategory } from "@/lib/types";
import PropertyCard from "@/components/PropertyCard";
import CategoryIcon from "@/components/CategoryIcon";
import { PropertyGridSkeleton } from "@/components/ui/Skeleton";

const TRUST_BADGES = [
  { icon: Store, label: "100% Commercial" },
  { icon: Wallet, label: "Zero Brokerage" },
  { icon: ShieldCheck, label: "Verified Owners" },
  { icon: MapPinned, label: "Pan-India" },
];

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: "Search by purpose",
    text: "Pick Rent, Lease, or Sale first — every listing you see is already the right kind of deal.",
  },
  {
    icon: MessageSquareText,
    title: "Talk to the owner directly",
    text: "No agents in between. Send an inquiry and the shop owner reaches out to you.",
  },
  {
    icon: BadgeCheck,
    title: "Close the deal",
    text: "Visit, negotiate, and move your business in — MY OWN SHOP stays out of the way.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<ListingType>("RENT");
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [cityId, setCityId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [featured, setFeatured] = useState<PaginatedProperties | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    api.get<City[]>("/cities").then(setCities).catch(() => {});
    api.get<ShopCategory[]>("/categories").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingFeatured(true);
    api
      .get<PaginatedProperties>(`/properties?listing_type=${activeType}&page_size=8`)
      .then(setFeatured)
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));
  }, [activeType]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("listing_type", activeType);
    if (cityId) params.set("city_id", cityId);
    if (categoryId) params.set("category_id", categoryId);
    if (keyword) params.set("search", keyword);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div className="bg-grid-pattern absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_40%,transparent_100%)]" />
        <div className="absolute -top-24 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200/50 to-violet-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Store className="h-3.5 w-3.5" />
            Built only for commercial shops — not homes
          </span>

          <h1 className="text-balance mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Find your next{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              shop
            </span>
            .
            <br />
            Rent it. Lease it. Buy it.
          </h1>
          <p className="text-balance mx-auto mt-5 max-w-2xl text-lg text-gray-600">
            MY OWN SHOP is a marketplace built exclusively for retail shops, showrooms,
            offices, and other commercial spaces — direct from owners, zero brokerage.
          </p>

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-xl shadow-gray-900/5 backdrop-blur sm:p-6">
            <div className="flex gap-1.5 rounded-xl bg-gray-100 p-1.5">
              {LISTING_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setActiveType(t.value)}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                    activeType === t.value
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-left text-xs text-gray-500">
              {LISTING_TYPES.find((t) => t.value === activeType)?.description}
            </p>

            <form onSubmit={handleSearch} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Any city</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Any shop type</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by title or locality"
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:col-span-1"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </form>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                <b.icon className="h-4 w-4 text-indigo-500" />
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Latest shops for {activeType.toLowerCase()}
            </h2>
            <p className="mt-1 text-sm text-gray-500">Fresh listings, straight from owners.</p>
          </div>
          <Link
            href={`/properties?listing_type=${activeType}`}
            className="hidden items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 sm:flex"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loadingFeatured ? (
          <PropertyGridSkeleton count={4} />
        ) : featured && featured.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center text-gray-500">
            No shops listed for {activeType.toLowerCase()} yet. Be the first to{" "}
            <Link href="/dashboard/properties/new" className="font-semibold text-indigo-600">
              post one
            </Link>
            .
          </div>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-y border-gray-200 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900">Browse by shop type</h2>
            <p className="mt-1 text-sm text-gray-500">
              Find the exact kind of commercial space your business needs.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/properties?listing_type=${activeType}&category_id=${c.id}`}
                  className="group flex flex-col items-center gap-2.5 rounded-2xl border border-gray-200 bg-white p-5 text-center transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <CategoryIcon categoryName={c.name} className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">How MY OWN SHOP works</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-gray-500">
            Three steps between you and your next commercial space.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border border-gray-200 bg-white p-6">
              <span className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/30">
                {i + 1}
              </span>
              <step.icon className="h-8 w-8 text-indigo-600" strokeWidth={1.75} />
              <h3 className="mt-4 font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-14 text-center shadow-xl shadow-indigo-600/20 sm:px-16">
          <div className="bg-grid-pattern absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_20%,transparent_100%)]" />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Own a shop? List it in minutes.
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-indigo-100">
              Reach verified tenants and buyers directly. No brokerage, no middlemen.
            </p>
            <Link
              href="/dashboard/properties/new"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
            >
              Post your shop for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
