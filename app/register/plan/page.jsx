"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import uprightLogo from "@/app/assets/upright-logo.png";
import { createBillingCheckout } from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import { getPlanById, PLAN_FEATURES } from "@/lib/plans";

export default function RegisterPlanPage() {
  const router = useRouter();
  const { user, loading, hasAppAccess, hasReadAccess, logout } = useAuth();
  const [billing, setBilling] = useState("monthly");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const plan = getPlanById(billing);
  const homeHref = hasReadAccess ? "/items" : "/";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (hasAppAccess) {
      router.replace("/items");
    }
  }, [loading, user, hasAppAccess, router]);

  const handleContinue = async () => {
    setError("");
    setSubmitting(true);
    try {
      const { checkoutUrl } = await createBillingCheckout(billing);
      if (!checkoutUrl) {
        throw new Error("No checkout URL returned");
      }
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err?.message || "Could not start checkout.");
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-full items-center justify-center bg-nv-canvas px-4">
        <p className="text-xs font-bold uppercase tracking-wide text-nv-ink/55">
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-nv-canvas text-nv-ink">
      <header className="border-b-brutal border-black bg-nv-paper px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              href={homeHref}
              className="shrink-0 transition-transform hover:-translate-y-0.5"
              aria-label={
                hasReadAccess ? "Back to Upright" : "Back to Upright home"
              }
            >
              <Image
                src={uprightLogo}
                alt="Upright"
                className="h-10 w-auto sm:h-12"
                priority
              />
            </Link>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-nv-ink/55">
                Step 2 of 2 — Choose a plan
              </p>
              <h1 className="truncate text-xl font-black uppercase leading-tight sm:text-2xl">
                Unlock Upright for {user.client_name}
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/");
            }}
            className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-nv-ink/50 hover:underline"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-6 sm:px-8">
        <p className="max-w-xl text-center text-sm font-medium text-nv-ink/70">
          Pick how you want to pay. You&apos;ll enter card details on the next
          screen — we never store your card on our servers.
        </p>

        <div
          className="inline-flex border-brutal border-black bg-nv-paper p-1 shadow-brutal-sm"
          role="group"
          aria-label="Billing period"
        >
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 text-[10px] font-black uppercase tracking-wide transition-colors ${
              billing === "monthly"
                ? "bg-nv-violet text-white"
                : "bg-transparent text-nv-ink/70 hover:bg-nv-canvas"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            className={`px-5 py-2 text-[10px] font-black uppercase tracking-wide transition-colors ${
              billing === "yearly"
                ? "bg-nv-violet text-white"
                : "bg-transparent text-nv-ink/70 hover:bg-nv-canvas"
            }`}
          >
            Yearly
          </button>
        </div>

        {error && (
          <p className="text-center text-[10px] font-bold uppercase tracking-wide text-red-600">
            {error}
          </p>
        )}

        <article className="relative flex h-[calc(100vh-14rem)] w-[min(22vw,17.5rem)] min-w-[15.5rem] flex-col border-brutal border-black bg-nv-paper shadow-brutal">
          {plan.badge && (
            <span className="absolute right-0 top-0 z-10 border-b-brutal border-l-brutal border-black bg-nv-cyan px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-nv-ink shadow-brutal-btn">
              {plan.badge}
            </span>
          )}
          <div className="border-b-brutal border-black bg-nv-violet px-4 py-4 text-white">
            <h2 className="text-lg font-black uppercase leading-none">
              Upright
            </h2>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-black">{plan.priceLabel}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                {plan.cadence}
              </span>
            </p>
            {plan.blurb ? (
              <p className="mt-2 text-[11px] font-medium leading-snug text-white/85">
                {plan.blurb}
              </p>
            ) : null}
          </div>

          <ul className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4">
            {PLAN_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex gap-2 text-[11px] font-medium leading-snug text-nv-ink/80"
              >
                <span
                  className="mt-0.5 shrink-0 font-black text-nv-violet"
                  aria-hidden
                >
                  ✓
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="border-t-brutal border-black p-4">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleContinue()}
              className="w-full border-brutal border-black bg-nv-violet px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-white shadow-brutal-btn transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Redirecting…" : "Continue to payment"}
            </button>
          </div>
        </article>

        <p className="text-center text-[10px] font-medium text-nv-ink/45">
          More tiers coming later — same checkout flow when they land.
        </p>

        <Link
          href="/login"
          className="text-[10px] font-bold uppercase tracking-wide text-nv-violet hover:underline"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
