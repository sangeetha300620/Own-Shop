"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";
import type { TokenPair, User } from "./types";

interface RegisterInput {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  company_name?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistSession(tokens: TokenPair) {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
  localStorage.setItem("user", JSON.stringify(tokens.user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const tokens = await api.post<TokenPair>("/auth/login", { email, password });
    persistSession(tokens);
    setUser(tokens.user);
  }

  async function register(data: RegisterInput) {
    const tokens = await api.post<TokenPair>("/auth/register", data);
    persistSession(tokens);
    setUser(tokens.user);
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
