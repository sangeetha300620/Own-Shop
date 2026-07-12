"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  variant: "success" | "error";
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, variant: ToastItem["variant"]) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const success = useCallback((message: string) => push(message, "success"), [push]);
  const error = useCallback((message: string) => push(message, "error"), [push]);

  function dismiss(id: number) {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm animate-[slide-down_0.25s_ease-out] items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
              t.variant === "success"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-800"
                : "border-red-200 bg-red-50/95 text-red-800"
            }`}
          >
            {t.variant === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            )}
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-current opacity-60 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
