"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getOnboardingStatus } from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import { brutalChrome, rowStripe } from "@/lib/chrome";
import {
  SETUP_CHECKLIST_KEY,
  checklistComplete,
  setupStepHref,
} from "@/lib/onboarding";

export default function SetupChecklist() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(window.localStorage.getItem(SETUP_CHECKLIST_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user || hidden) return;
    let cancelled = false;
    getOnboardingStatus()
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, hidden, user]);

  if (hidden || !status || checklistComplete(status)) return null;

  const steps = Array.isArray(status.checklist) ? status.checklist : [];
  const needsStarter = steps.some(
    (step) => (step.key === "phases" || step.key === "buy_items") && !step.done
  );
  const founder = user?.role === "founder";

  function dismiss() {
    try {
      window.localStorage.setItem(SETUP_CHECKLIST_KEY, "1");
    } catch {
      // The card can still close for this visit.
    }
    setHidden(true);
  }

  return (
    <section className={`mb-4 ${brutalChrome} bg-nv-paper`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b-brutal-xs border-black bg-nv-purple-dark px-4 py-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide">Set up your shop</h2>
          <p className="mt-1 max-w-xl text-xs font-medium">
            A few minutes. No spreadsheet. Finish these and the card goes away.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="border-brutal-xs border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide text-black"
        >
          Hide for now
        </button>
      </header>
      {founder && needsStarter ? (
        <div className="border-b border-black/10 px-4 py-3">
          <Link
            href="/setup"
            className="inline-block border-brutal-xs border-black bg-nv-green-dark px-3 py-1.5 text-[10px] font-black uppercase tracking-wide"
          >
            Pick what you make
          </Link>
        </div>
      ) : null}
      <ul>
        {steps.map((step, index) => (
          <li key={step.key} className={rowStripe(index, "purple")}>
            <Link
              href={setupStepHref(step.key)}
              className="flex items-center justify-between gap-3 px-4 py-2"
            >
              <span className="text-sm font-bold">{step.label}</span>
              <span
                className={`border-brutal-xs border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                  step.done ? "bg-nv-green-dark" : "bg-nv-paper text-black"
                }`}
              >
                {step.done ? "Done" : "To do"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
