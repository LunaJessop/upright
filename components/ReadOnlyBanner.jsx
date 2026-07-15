"use client";

import Link from "next/link";
import { createBillingPortal } from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";

export default function ReadOnlyBanner() {
  const { user, isReadOnly, subscriptionStatus } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isReadOnly) return null;

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
    <div className="border-b-brutal border-black bg-nv-violet px-4 py-2 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide">
          Account is read-only
          {subscriptionStatus ? ` (${subscriptionStatus})` : ""}. You can browse
          and export, but not create or edit.
          {error ? <span className="ml-2 text-nv-cyan">{error}</span> : null}
        </p>
        {isFounder ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/register/plan"
              className="border-brutal border-black bg-nv-cyan px-3 py-1 text-[10px] font-black uppercase tracking-wide text-black shadow-brutal-btn"
            >
              Choose a plan
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={() => void openPortal()}
              className="border-brutal border-black bg-nv-paper px-3 py-1 text-[10px] font-black uppercase tracking-wide text-nv-ink shadow-brutal-btn disabled:opacity-40"
            >
              {busy ? "Opening…" : "Manage billing"}
            </button>
          </div>
        ) : (
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">
            Ask a founder to update billing
          </p>
        )}
      </div>
    </div>
  );
}
