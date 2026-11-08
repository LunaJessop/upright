"use client";

import { useEffect } from "react";
import { brutalChrome, deleteButtonClass } from "@/lib/chrome";

export default function AdminConfirmDialog({
  title,
  message,
  confirmLabel,
  danger = false,
  busy = false,
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className={`w-full max-w-md ${brutalChrome} bg-nv-paper p-4`}
      >
        <h2 id="admin-confirm-title" className="text-sm font-black uppercase">
          {title}
        </h2>
        <p className="mt-2 text-sm font-medium leading-relaxed">{message}</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="border-brutal-xs border-black bg-nv-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40 ${
              danger
                ? deleteButtonClass
                : "border-brutal-xs border-black bg-nv-green-dark"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
