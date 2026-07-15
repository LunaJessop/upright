"use client";

import Link from "next/link";
import { createBillingPortal } from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";

const brutalChrome = "border-brutal border-black shadow-brutal";

export default function BillingWall() {
  const { user, logout, subscriptionStatus } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isFounder = user?.role === "founder";
  const needsNewCheckout =
    subscriptionStatus === "incomplete" ||
    subscriptionStatus === "incomplete_expired";

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
    <div className="flex min-h-full flex-1 items-center justify-center bg-nv-canvas px-4 py-10">
      <div className={`w-full max-w-md ${brutalChrome} bg-nv-paper p-8 text-center`}>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-nv-ink/55">
          Billing
        </p>
        <h1 className="mt-2 text-2xl font-black uppercase leading-tight">
          Choose a plan
        </h1>
        <p className="mt-3 text-sm font-medium text-nv-ink/70">
          Finish checkout to start using Upright
          {subscriptionStatus ? (
            <>
              {" "}
              (<span className="font-black">{subscriptionStatus}</span>)
            </>
          ) : null}
          .
        </p>

        {error && (
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-red-600">
            {error}
          </p>
        )}

        {isFounder ? (
          <div className="mt-6 flex flex-col gap-2">
            {needsNewCheckout ? (
              <Link
                href="/register/plan"
                className="border-brutal border-black bg-nv-violet px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-brutal-sm"
              >
                Choose a plan
              </Link>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void openPortal()}
              className="border-brutal border-black bg-nv-paper px-4 py-3 text-xs font-black uppercase tracking-wide shadow-brutal-sm disabled:opacity-40"
            >
              Manage billing
            </button>
          </div>
        ) : (
          <p className="mt-6 text-xs font-medium text-nv-ink/60">
            Ask a founder on your account to update billing.
          </p>
        )}

        <button
          type="button"
          onClick={logout}
          className="mt-4 text-[10px] font-bold uppercase tracking-wide text-nv-ink/50 hover:underline"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
