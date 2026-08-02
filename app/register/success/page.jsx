"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const brutalChrome = "border-brutal border-black shadow-brutal";
const POLL_MS = 1500;
const MAX_ATTEMPTS = 40;

export default function RegisterSuccessPage() {
  const router = useRouter();
  const { user, loading, refreshSession, hasAppAccess } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const attemptsRef = useRef(0);

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
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_ATTEMPTS && !next?.has_app_access) {
          setTimedOut(true);
        }
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
          Waiting for confirmation
        </h1>
        <p className="mt-3 text-sm font-medium text-nv-ink/70">
          {timedOut
            ? "This is taking longer than expected. You can check again in a moment, or contact support if it doesn’t clear."
            : "We’re confirming your subscription with our payment provider. This usually takes a few seconds."}
        </p>
        {!timedOut && (
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-nv-ink/40">
            Waiting…
          </p>
        )}
        {timedOut && (
          <button
            type="button"
            onClick={() => {
              setTimedOut(false);
              attemptsRef.current = 0;
              void refreshSession();
            }}
            className="mt-6 border-brutal border-black bg-nv-violet px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-brutal-sm"
          >
            Check again
          </button>
        )}
      </div>
    </div>
  );
}
