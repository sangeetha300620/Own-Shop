"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Compass,
  Home,
  Landmark,
  Layers,
  Maximize,
  Ruler,
  Sofa,
  SquareStack,
  Wallet,
} from "lucide-react";
import { api, ApiError, resolveImageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { listingTypeStyles, priceLabel } from "@/lib/format";
import type { PropertyDetail } from "@/lib/types";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<PropertyDetail>(`/properties/${id}`)
      .then((data) => {
        setProperty(data);
        setForm((f) => ({ ...f, name: user?.full_name ?? "", phone: user?.phone ?? "" }));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push(`/auth/login?next=/properties/${id}`);
      return;
    }
    setSending(true);
    setError("");
    try {
      await api.post(`/properties/${id}/inquiries`, form, true);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
            <Skeleton className="mt-6 h-6 w-2/3" />
            <Skeleton className="mt-3 h-4 w-1/3" />
            <Skeleton className="mt-4 h-8 w-1/4" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !property)
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center text-gray-500">
        <Building2 className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
        Shop listing not found.
      </div>
    );

  const styles = listingTypeStyles(property.listing_type);
  const locationLabel = [property.address_line, property.locality?.name, property.city.name]
    .filter(Boolean)
    .join(", ");
  const isOwner = user?.id === property.owner_id;
  const images = property.images.length > 0 ? property.images : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200">
            {images ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImageUrl(images[activeImage].image_url)}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
                <Building2 className="h-14 w-14" strokeWidth={1.5} />
                <span className="text-sm font-medium">No photos uploaded yet</span>
              </div>
            )}
          </div>
          {images && images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    i === activeImage ? "border-indigo-600" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveImageUrl(img.image_url)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles.badge}`}>
              {property.listing_type}
            </span>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">{property.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-gray-500">
              <Compass className="h-4 w-4 flex-shrink-0" />
              {locationLabel}
            </p>
            <p className={`mt-3 text-3xl font-bold ${styles.text}`}>
              {priceLabel(property.listing_type, property.price)}
            </p>

            {property.description && (
              <p className="mt-4 whitespace-pre-line leading-relaxed text-gray-700">
                {property.description}
              </p>
            )}

            <dl className="mt-6 grid grid-cols-2 gap-5 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-3">
              <Spec icon={Landmark} label="Category" value={property.category.name} />
              {property.carpet_area_sqft && (
                <Spec icon={Ruler} label="Carpet area" value={`${property.carpet_area_sqft} sqft`} />
              )}
              {property.built_up_area_sqft && (
                <Spec icon={Maximize} label="Built-up area" value={`${property.built_up_area_sqft} sqft`} />
              )}
              <Spec
                icon={Sofa}
                label="Furnishing"
                value={property.furnishing_status.replace("_", " ")}
              />
              {property.floor_number != null && (
                <Spec
                  icon={Layers}
                  label="Floor"
                  value={`${property.floor_number}${
                    property.total_floors ? ` of ${property.total_floors}` : ""
                  }`}
                />
              )}
              {property.frontage_width_ft && (
                <Spec icon={SquareStack} label="Frontage" value={`${property.frontage_width_ft} ft`} />
              )}
              {property.security_deposit != null && (
                <Spec
                  icon={Wallet}
                  label="Security deposit"
                  value={priceLabel("SALE", property.security_deposit)}
                />
              )}
              {property.maintenance_charge != null && (
                <Spec
                  icon={Wallet}
                  label="Maintenance"
                  value={`${priceLabel("SALE", property.maintenance_charge)}/mo`}
                />
              )}
              {property.lease_duration_years != null && (
                <Spec icon={Layers} label="Lease term" value={`${property.lease_duration_years} years`} />
              )}
              <Spec
                icon={Home}
                label="Corner property"
                value={property.is_corner_property ? "Yes" : "No"}
              />
            </dl>

            {property.amenities.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span
                      key={a.id}
                      className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700"
                    >
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-700">
                {(property.owner.company_name || property.owner.full_name).charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-xs text-gray-500">Listed by</p>
                <p className="font-semibold text-gray-900">
                  {property.owner.company_name || property.owner.full_name}
                </p>
              </div>
            </div>

            {isOwner ? (
              <button
                onClick={() => router.push(`/dashboard/properties/${property.id}/edit`)}
                className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Manage this listing
              </button>
            ) : sent ? (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <p>Your inquiry has been sent. The owner will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleInquiry} className="mt-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Interested in this shop?</h3>
                <input
                  required
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  required
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  placeholder="Email (optional)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <textarea
                  placeholder="Message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {sending ? "Sending…" : user ? "Send Inquiry" : "Log in to Inquire"}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" strokeWidth={1.75} />
      <div>
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="text-sm font-semibold capitalize text-gray-900">{value}</dd>
      </div>
    </div>
  );
}
