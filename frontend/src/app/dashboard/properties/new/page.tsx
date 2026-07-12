"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import PropertyForm from "@/components/PropertyForm";

export default function NewPropertyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login?next=/dashboard/properties/new");
  }, [loading, user, router]);

  if (loading || !user) return <div className="py-24 text-center text-gray-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Post a Shop</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">
        Takes about 2 minutes. You can edit everything later.
      </p>
      <PropertyForm />
    </div>
  );
}
