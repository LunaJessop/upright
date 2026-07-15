"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import BillingWall from "@/components/BillingWall";
import PastDueBanner from "@/components/PastDueBanner";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";
import { AuthProvider, useAuth } from "@/components/AuthProvider";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/auth",
  "/register",
  "/register/plan",
  "/register/success",
  "/register/payment",
]);

const BILLING_FLOW_PATHS = new Set([
  "/register/plan",
  "/register/success",
  "/register/payment",
]);

function AppShellInner({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, hasAppAccess, hasReadAccess } = useAuth();
  const isPublic = PUBLIC_PATHS.has(pathname);
  const isBillingFlow = BILLING_FLOW_PATHS.has(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      router.replace("/");
      return;
    }
    if (
      user &&
      (pathname === "/login" || pathname === "/auth" || pathname === "/register")
    ) {
      if (hasReadAccess) {
        router.replace("/items");
      } else if (!isBillingFlow) {
        router.replace("/register/plan");
      }
    }
  }, [
    user,
    loading,
    isPublic,
    isBillingFlow,
    hasReadAccess,
    pathname,
    router,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-nv-canvas px-4">
        <p className="text-xs font-bold uppercase tracking-wide text-nv-ink/55">
          Loading session…
        </p>
      </div>
    );
  }

  if (isPublic) {
    return <main className="min-h-full flex-1">{children}</main>;
  }

  if (!user) {
    return null;
  }

  if (!hasReadAccess) {
    return <BillingWall />;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <PastDueBanner />
      <ReadOnlyBanner />
      <div className="flex min-h-0 flex-1">
        <Navbar />
        <main
          className={`min-w-0 flex-1 ${!hasAppAccess ? "upright-readonly" : ""}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  return (
    <AuthProvider>
      <AppShellInner>{children}</AppShellInner>
    </AuthProvider>
  );
}
