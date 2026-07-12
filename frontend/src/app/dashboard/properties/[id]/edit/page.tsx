"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PropertyForm from "@/components/PropertyForm";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PropertyDetail } from "@/lib/types";

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/auth/login?next=/dashboard/properties/${id}/edit`);
  }, [authLoading, user, router, id]);

  useEffect(() => {
    api
      .get<PropertyDetail>(`/properties/${id}`)
      .then((data) => {
        if (user && data.owner_id !== user.id && user.role !== "admin") {
          setForbidden(true);
        } else {
          setProperty(data);
        }
      })
      .catch(() => setForbidden(true))
      .finally(() => setLoading(false));
  }, [id, user]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (forbidden || !property)
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center text-gray-500">
        <ShieldAlert className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
        You can&apos;t edit this listing.
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Edit Shop Listing</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">Update details, pricing, or add more photos.</p>
      <PropertyForm existing={property} />
    </div>
  );
}
