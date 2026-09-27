"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import BillingWall from "@/components/BillingWall";
import PastDueBanner from "@/components/PastDueBanner";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { clearLoginRedirect, shouldRedirectToLogin } from "@/lib/auth";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/auth",
  "/register",
  "/register/plan",
  "/register/success",
  "/register/payment",
  "/help",
  "/terms",
  "/privacy",
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

// Real app routes. Anything else (for example /orders) is an unknown URL and
// must render app/not-found instead of being treated as a protected page.
const PROTECTED_PREFIXES = [
  "/items",
  "/batches",
  "/admin",
  "/settings",
  "/profile",
  "/client",
  "/sales",
  "/styles",
];

function isProtectedAppPath(pathname) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function AppShellInner({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, hasAppAccess, hasReadAccess, isPlatformAdmin } =
    useAuth();
  const isPublic = isPublicPath(pathname);
  const helpPath = isHelpPath(pathname);
  const protectedPath = isProtectedAppPath(pathname);
  const isBillingFlow = BILLING_FLOW_PATHS.has(pathname);
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    if (pathname === "/login") {
      clearLoginRedirect();
    }
    if (loading) return;
    if (!user && protectedPath) {
      router.replace(shouldRedirectToLogin() ? "/login" : "/");
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
    protectedPath,
    isBillingFlow,
    isAdminPath,
    isPlatformAdmin,
    hasReadAccess,
    pathname,
    router,
  ]);

  if (loading) {
    // Unknown URLs should paint the not-found page without waiting on session.
    if (!isPublic && !protectedPath) {
      return <main className="min-h-full flex-1">{children}</main>;
    }
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-nv-canvas px-4">
        <p className="text-xs font-bold uppercase tracking-wide text-nv-ink/55">
          Loading session…
        </p>
      </div>
    );
  }

  // Help, marketing pages, and unknown URLs — never the app sidebar.
  if (helpPath || isPublic || !protectedPath) {
    return <main className="min-h-full flex-1">{children}</main>;
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
      <div className="flex min-h-full flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          <Navbar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    );
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
