"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const brutalChrome = "border-brutal border-black shadow-brutal";
const POLL_MS = 1500;
const MAX_ATTEMPTS = 40;

export default function RegisterSuccessPage() {
  const router = useRouter();
  const { user, loading, refreshSession, hasAppAccess } = useAuth();
  const [attempts, setAttempts] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

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

  useEffect(() => {
    if (loading || !user || hasAppAccess || timedOut) return;

    const id = setInterval(() => {
      void (async () => {
        const next = await refreshSession();
        setAttempts((n) => {
          const nextN = n + 1;
          if (nextN >= MAX_ATTEMPTS && !next?.has_app_access) {
            setTimedOut(true);
          }
          return nextN;
        });
      })();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [loading, user, hasAppAccess, timedOut, refreshSession]);

  return (
    <div className="flex min-h-full items-center justify-center bg-nv-canvas px-4 py-10">
      <div className={`w-full max-w-md ${brutalChrome} bg-nv-paper p-8 text-center`}>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-nv-ink/55">
          Payment received
        </p>
        <h1 className="mt-2 text-2xl font-black uppercase leading-tight">
          {timedOut ? "Still activating…" : "Activating your account"}
        </h1>
        <p className="mt-3 text-sm font-medium text-nv-ink/70">
          {timedOut
            ? "This is taking longer than expected. You can retry payment or refresh in a moment."
            : "Confirming your subscription. This usually takes a few seconds."}
        </p>
        {!timedOut && (
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-nv-ink/40">
            Checking… ({attempts}/{MAX_ATTEMPTS})
          </p>
        )}
        {timedOut && (
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/register/plan"
              className="border-brutal border-black bg-nv-violet px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-brutal-sm"
            >
              Choose a plan
            </Link>
            <button
              type="button"
              onClick={() => {
                setTimedOut(false);
                setAttempts(0);
                void refreshSession();
              }}
              className="border-brutal border-black bg-nv-paper px-4 py-2 text-xs font-black uppercase tracking-wide shadow-brutal-sm"
            >
              Check again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
