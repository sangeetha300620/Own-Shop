"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Pencil, ShieldCheck, Trash2, User as UserIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { listingTypeStyles, priceLabel } from "@/lib/format";
import type { AdminPropertyListItem, PaginatedAdminProperties } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [result, setResult] = useState<PaginatedAdminProperties | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login?next=/admin");
      return;
    }
    if (user.role !== "admin") {
      router.push("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    setLoading(true);
    api
      .get<PaginatedAdminProperties>("/admin/properties?page_size=200", true)
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleDelete(item: AdminPropertyListItem) {
    const ok = await confirm({
      title: "Delete this listing?",
      description: `"${item.title}" (posted by ${item.owner_name}) will be permanently removed.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    setDeletingId(item.id);
    try {
      await api.del(`/properties/${item.id}`, true);
      setResult((prev) =>
        prev ? { ...prev, items: prev.items.filter((p) => p.id !== item.id), total: prev.total - 1 } : prev
      );
      toast.success("Listing deleted.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete listing");
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin — All Listings</h1>
          <p className="text-sm text-gray-500">
            Every shop on MY OWN SHOP, across every owner. You can edit or delete any of them.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : result && result.items.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{result.total} total listings</p>
          {result.items.map((item) => {
            const styles = listingTypeStyles(item.listing_type);
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${styles.badge}`}>
                      {item.listing_type}
                    </span>
                    <span className="text-xs font-medium text-gray-400">{item.status}</span>
                  </div>
                  <Link
                    href={`/properties/${item.id}`}
                    className="mt-1 block truncate font-semibold text-gray-900 hover:text-indigo-600"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {[item.locality?.name, item.city.name].filter(Boolean).join(", ")} ·{" "}
                    <span className="font-medium text-gray-700">
                      {priceLabel(item.listing_type, item.price)}
                    </span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-3 w-3" />
                      {item.owner_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {item.owner_email}
                    </span>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <Link
                    href={`/dashboard/properties/${item.id}/edit`}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === item.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center text-gray-500">
          No listings on the platform yet.
        </div>
      )}
    </div>
  );
}
