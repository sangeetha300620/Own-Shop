"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Inbox,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { listingTypeStyles, priceLabel } from "@/lib/format";
import type { InquiryReceived, PropertyListItem } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [tab, setTab] = useState<"listings" | "inquiries">("listings");
  const [properties, setProperties] = useState<PropertyListItem[] | null>(null);
  const [inquiries, setInquiries] = useState<InquiryReceived[] | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingInquiryId, setDeletingInquiryId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login?next=/dashboard");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.get<PropertyListItem[]>("/properties/mine", true).then(setProperties).catch(() => {});
    api.get<InquiryReceived[]>("/inquiries/received", true).then(setInquiries).catch(() => {});
  }, [user]);

  async function handleDelete(id: number, title: string) {
    const ok = await confirm({
      title: "Delete this listing?",
      description: `"${title}" will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    setDeletingId(id);
    try {
      await api.del(`/properties/${id}`, true);
      setProperties((prev) => prev?.filter((p) => p.id !== id) ?? null);
      toast.success("Listing deleted.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete listing");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteInquiry(id: number, name: string) {
    const ok = await confirm({
      title: "Delete this inquiry?",
      description: `The inquiry from "${name}" will be permanently removed.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    setDeletingInquiryId(id);
    try {
      await api.del(`/inquiries/${id}`, true);
      setInquiries((prev) => prev?.filter((i) => i.id !== id) ?? null);
      toast.success("Inquiry deleted.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete inquiry");
    } finally {
      setDeletingInquiryId(null);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your listings and buyer inquiries.</p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Post a Shop
        </Link>
      </div>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab("listings")}
          className={`px-4 py-2.5 text-sm font-semibold transition ${
            tab === "listings"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          My Listings ({properties?.length ?? 0})
        </button>
        <button
          onClick={() => setTab("inquiries")}
          className={`px-4 py-2.5 text-sm font-semibold transition ${
            tab === "inquiries"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Inquiries Received ({inquiries?.length ?? 0})
        </button>
      </div>

      {tab === "listings" && (
        <div className="space-y-3">
          {properties && properties.length > 0 ? (
            properties.map((p) => {
              const styles = listingTypeStyles(p.listing_type);
              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${styles.badge}`}>
                        {p.listing_type}
                      </span>
                      <span className="text-xs font-medium text-gray-400">{p.status}</span>
                    </div>
                    <Link
                      href={`/properties/${p.id}`}
                      className="mt-1 block font-semibold text-gray-900 hover:text-indigo-600"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {[p.locality?.name, p.city.name].filter(Boolean).join(", ")} ·{" "}
                      <span className="font-medium text-gray-700">
                        {priceLabel(p.listing_type, p.price)}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/properties/${p.id}/edit`}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      disabled={deletingId === p.id}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingId === p.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={Building2}
              title="No shops posted yet"
              description="Post your first commercial shop and reach verified buyers and tenants directly."
              action={{ href: "/dashboard/properties/new", label: "Post a Shop" }}
            />
          )}
        </div>
      )}

      {tab === "inquiries" && (
        <div className="space-y-3">
          {inquiries && inquiries.length > 0 ? (
            inquiries.map((inq) => (
              <div key={inq.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{inq.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {new Date(inq.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDeleteInquiry(inq.id, inq.name)}
                      disabled={deletingInquiryId === inq.id}
                      aria-label="Delete inquiry"
                      className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Re:{" "}
                  <Link href={`/properties/${inq.property_id}`} className="font-medium text-indigo-600">
                    {inq.property_title}
                  </Link>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-4 text-sm text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {inq.phone}
                  </span>
                  {inq.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      {inq.email}
                    </span>
                  )}
                </div>
                {inq.message && (
                  <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    &ldquo;{inq.message}&rdquo;
                  </p>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              icon={Inbox}
              title="No inquiries yet"
              description="When buyers or tenants message you about a listing, you'll see it here."
            />
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className="mt-2 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <MessageSquare className="h-4 w-4" />
          {action.label}
        </Link>
      )}
    </div>
  );
}
