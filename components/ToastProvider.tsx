"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  title: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (title: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastStyles(variant: ToastVariant) {
  if (variant === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (variant === "error") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  return "border-sky-200 bg-sky-50 text-sky-900";
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, variant: ToastVariant = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, title, variant }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-3xl border px-4 py-3 shadow-[0_14px_35px_rgba(18,52,59,0.12)] backdrop-blur ${getToastStyles(toast.variant)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium leading-6">{toast.title}</p>
              <button
                type="button"
                onClick={() => {
                  setToasts((current) => current.filter((item) => item.id !== toast.id));
                }}
                className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70 transition hover:opacity-100"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return useMemo(
    () => ({
      success: (title: string) => context.showToast(title, "success"),
      error: (title: string) => context.showToast(title, "error"),
      info: (title: string) => context.showToast(title, "info"),
    }),
    [context]
  );
}
