"use client";

import { createBillingPortal } from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";

export default function PastDueBanner() {
  const { user, subscriptionStatus, graceDaysRemaining } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (subscriptionStatus !== "past_due" || graceDaysRemaining == null || graceDaysRemaining <= 0) {
    return null;
  }

  const isFounder = user?.role === "founder";

  const openPortal = async () => {
    setError("");
    setBusy(true);
    try {
      const { portalUrl } = await createBillingPortal();
      window.location.href = portalUrl;
    } catch (err) {
      setError(err?.message || "Could not open billing portal.");
      setBusy(false);
    }
  };

  return (
    <div className="border-b-brutal border-black bg-nv-cyan/30 px-4 py-2 text-nv-ink">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide">
          Payment failed — editing will become read-only in{" "}
          {graceDaysRemaining} day{graceDaysRemaining === 1 ? "" : "s"}.
          {error ? (
            <span className="ml-2 text-red-600">{error}</span>
          ) : null}
        </p>
        {isFounder && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void openPortal()}
            className="border-brutal border-black bg-nv-paper px-3 py-1 text-[10px] font-black uppercase tracking-wide shadow-brutal-btn disabled:opacity-40"
          >
            {busy ? "Opening…" : "Update payment"}
          </button>
        )}
      </div>
    </div>
  );
}
