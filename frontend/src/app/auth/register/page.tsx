"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Building2, Lock, Mail, Phone, User, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const fieldClass =
  "w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register({
        full_name: fullName,
        email,
        phone,
        password,
        company_name: companyName || undefined,
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-grid-pattern absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_20%,transparent_100%)]" />

      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-900/5">
        <div className="flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25">
            <Building2 className="h-6 w-6" />
          </span>
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Log in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              required
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              required
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="relative">
            <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Company name (optional, for brokers)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
