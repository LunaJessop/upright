"use client";

import { useEffect } from "react";
import { setImpersonationReadOnlyHandler } from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { viewAsBannerText } from "@/lib/viewAs";

export default function ViewAsBanner() {
  const { user, impersonating, stopViewAs, stoppingViewAs } = useAuth();
  const toast = useToast();

  useEffect(() => {
    setImpersonationReadOnlyHandler(() => {
      toast.error("You can't change anything while viewing as this user.");
    });
    return () => setImpersonationReadOnlyHandler(null);
  }, [toast]);

  if (!impersonating?.expires_at || !user?.email) return null;

  return (
    <div
      data-view-as-allow="true"
      className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b-brutal border-black bg-nv-purple-dark px-4 py-2"
    >
      <p className="text-xs font-black uppercase tracking-wide">
        {viewAsBannerText({ email: user.email, expiresAt: impersonating.expires_at })}
      </p>
      <button
        type="button"
        data-view-as-allow="true"
        onClick={() => void stopViewAs()}
        disabled={stoppingViewAs}
        className="border-brutal-xs border-black bg-nv-paper px-3 py-1 text-[10px] font-black uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-40"
      >
        {stoppingViewAs ? "Stopping…" : "Stop"}
      </button>
    </div>
  );
}
