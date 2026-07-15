"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy “almost done” URL — plan selection is the resume step now. */
export default function RegisterPaymentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/register/plan");
  }, [router]);
  return (
    <div className="flex min-h-full items-center justify-center bg-nv-canvas px-4">
      <p className="text-xs font-bold uppercase tracking-wide text-nv-ink/55">
        Taking you to plan selection…
      </p>
    </div>
  );
}
