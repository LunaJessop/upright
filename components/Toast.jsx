"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);

const SUCCESS_MS = 4200;
const ERROR_MS = 7000;
const MAX_TOASTS = 4;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (tone, message) => {
      const text = String(message ?? "").trim();
      if (!text) return;
      const id = idRef.current + 1;
      idRef.current = id;
      setToasts((prev) => [...prev, { id, tone, message: text }].slice(-MAX_TOASTS));
      const timer = setTimeout(
        () => dismiss(id),
        tone === "error" ? ERROR_MS : SUCCESS_MS
      );
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    const active = timers.current;
    return () => {
      for (const timer of active.values()) clearTimeout(timer);
      active.clear();
    };
  }, []);

  const api = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={`toast-in pointer-events-auto border-brutal border-black px-3 py-2 shadow-brutal-sm ${
              toast.tone === "error" ? "bg-red-600 text-white" : "bg-nv-cyan"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-bold leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 text-sm font-black leading-none"
              >
                ×
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
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
