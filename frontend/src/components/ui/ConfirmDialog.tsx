"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
}

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  function handle(result: boolean) {
    resolver?.(result);
    setOptions(null);
    setResolver(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${
                options.danger ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">{options.title}</h3>
            {options.description && (
              <p className="mt-1.5 text-sm text-gray-500">{options.description}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => handle(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handle(true)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  options.danger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {options.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmDialogProvider");
  return ctx;
}
