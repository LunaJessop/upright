"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

export function ServerStatusIndicator() {
  const [status, setStatus] = useState("loading");

  const check = useCallback(async () => {
    const controller = new AbortController();
    const t = window.setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`${API_BASE}/health`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data?.ok === true ? "ok" : "offline");
      } else {
        setStatus("offline");
      }
    } catch {
      setStatus("offline");
    } finally {
      window.clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    void check();
    const interval = window.setInterval(() => void check(), 15000);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [check]);

  const label =
    status === "loading"
      ? "Checking API…"
      : status === "ok"
        ? "API connected"
        : "API offline";

  const dotClass =
    status === "loading"
      ? "bg-zinc-400 animate-pulse"
      : status === "ok"
        ? "bg-emerald-500"
        : "bg-amber-500";

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-50 flex max-w-[min(100vw-2rem,20rem)] items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs text-zinc-700 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-950/90 dark:text-zinc-200"
      role="status"
      aria-live="polite"
      title={`${API_BASE}/health`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
      <span className="truncate font-medium">{label}</span>
    </div>
  );
}
