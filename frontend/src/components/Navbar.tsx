"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, LayoutDashboard, LogOut, Menu, Plus, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { href: "/properties?listing_type=RENT", label: "Rent" },
  { href: "/properties?listing_type=LEASE", label: "Lease" },
  { href: "/properties?listing_type=SALE", label: "Sale" },
];

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    setMobileOpen(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20">
            <Building2 className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-gray-900">
            MY OWN SHOP
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
          ) : user ? (
            <>
              <Link
                href="/dashboard/properties/new"
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Post a Shop
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                <LayoutDashboard className="h-4 w-4" />
                {user.full_name.split(" ")[0]}
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                title="Log out"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 sm:hidden"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 sm:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
            {user ? (
              <>
                <Link
                  href="/dashboard/properties/new"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Post a Shop
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3.5 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3.5 py-2.5 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="rounded-lg px-3.5 py-2.5 text-center text-sm font-semibold text-gray-500 hover:bg-gray-100"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3.5 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
