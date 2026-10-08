"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import BillingWall from "@/components/BillingWall";
import PastDueBanner from "@/components/PastDueBanner";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";
import SiteFooter from "@/components/SiteFooter";
import { AuthProvider, useAuth } from "@/components/AuthProvider";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/auth",
  "/register",
  "/register/plan",
  "/register/success",
  "/register/payment",
  "/help",
]);

const BILLING_FLOW_PATHS = new Set([
  "/register/plan",
  "/register/success",
  "/register/payment",
]);

function isPublicPath(pathname) {
  return (
    PUBLIC_PATHS.has(pathname) ||
    pathname === "/help" ||
    pathname.startsWith("/help/")
  );
}

function isHelpPath(pathname) {
  return pathname === "/help" || pathname.startsWith("/help/");
}

function AppShellInner({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, hasAppAccess, hasReadAccess, isPlatformAdmin } =
    useAuth();
  const isPublic = isPublicPath(pathname);
  const helpPath = isHelpPath(pathname);
  const isBillingFlow = BILLING_FLOW_PATHS.has(pathname);
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

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
    if (user && isAdminPath && !isPlatformAdmin) {
      router.replace(hasReadAccess ? "/items" : "/register/plan");
    }
  }, [
    user,
    loading,
    isPublic,
    isBillingFlow,
    isAdminPath,
    isPlatformAdmin,
    hasReadAccess,
    pathname,
    router,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center bg-nv-canvas px-4">
          <p className="text-xs font-bold uppercase tracking-wide text-nv-ink/55">
            Loading session…
          </p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  // Help is always a public docs surface (own top nav) — never app chrome.
  if (helpPath || isPublic) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Platform admins can open /admin even if their own tenant is unpaid.
  if (isAdminPath) {
    if (!isPlatformAdmin) {
      return null;
    }
    return (
      <div className="flex min-h-screen">
        <Navbar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </div>
    );
  }

  if (!hasReadAccess) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">
          <BillingWall />
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PastDueBanner />
      <ReadOnlyBanner />
      <div className="flex flex-1">
        <Navbar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main
            className={`flex-1 ${!hasAppAccess ? "upright-readonly" : ""}`}
          >
            {children}
          </main>
          <SiteFooter />
        </div>
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
