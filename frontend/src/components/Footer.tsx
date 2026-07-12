import Link from "next/link";
import { Building2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold text-gray-900">MY OWN SHOP</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              India&apos;s marketplace for commercial shops — nothing else.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Explore</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><Link href="/properties?listing_type=RENT" className="hover:text-indigo-600">Shops for Rent</Link></li>
              <li><Link href="/properties?listing_type=LEASE" className="hover:text-indigo-600">Shops for Lease</Link></li>
              <li><Link href="/properties?listing_type=SALE" className="hover:text-indigo-600">Shops for Sale</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">For Owners</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><Link href="/dashboard/properties/new" className="hover:text-indigo-600">Post a Shop</Link></li>
              <li><Link href="/dashboard" className="hover:text-indigo-600">Manage Listings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Account</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><Link href="/auth/login" className="hover:text-indigo-600">Log in</Link></li>
              <li><Link href="/auth/register" className="hover:text-indigo-600">Sign up</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} MY OWN SHOP. Commercial shops for rent, lease &amp; sale.
        </div>
      </div>
    </footer>
  );
}
