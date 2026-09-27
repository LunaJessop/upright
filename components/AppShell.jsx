"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import BillingWall from "@/components/BillingWall";
import PastDueBanner from "@/components/PastDueBanner";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/Toast";
import { clearLoginRedirect, loginHref, safeNextPath } from "@/lib/auth";

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

function focusableIn(root) {
  if (!root) return [];
  return [
    ...root.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    ),
  ];
}

function MenuGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="square"
    >
      <path d="M3 5 H15" />
      <path d="M3 9 H15" />
      <path d="M3 13 H15" />
    </svg>
  );
}

function MobileNavDrawer({ open, onDismiss, onClose }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const nodes = focusableIn(dialogRef.current);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="md:hidden">
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        id="app-nav-drawer"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Main"
        className="fixed inset-y-0 left-0 z-50 flex"
      >
        <Navbar
          onNavigate={onDismiss}
          onClose={onClose}
          closeButtonRef={closeButtonRef}
        />
      </div>
    </div>
  );
}

function AppFrame({ children, banners = null, mainClassName = "" }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef(null);

  const dismissNav = useCallback(() => {
    setNavOpen(false);
  }, []);

  const closeNav = useCallback(() => {
    setNavOpen(false);
    const button = menuButtonRef.current;
    if (button && button.offsetParent !== null) {
      button.focus();
    }
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (media.matches) setNavOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col">
      {banners}
      <div className="flex min-h-0 min-w-0 flex-1">
        <div className="hidden shrink-0 md:flex">
          <Navbar />
        </div>
        <div className="flex min-w-0 max-w-full flex-1 flex-col">
          <div className="sticky top-0 z-30 flex items-center gap-3 border-b-brutal border-black bg-nv-paper px-3 py-2 md:hidden">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              aria-expanded={navOpen}
              aria-controls="app-nav-drawer"
              className="inline-flex h-10 w-10 items-center justify-center border-brutal border-black bg-nv-violet text-white shadow-brutal-btn outline-none focus-visible:ring-2 focus-visible:ring-nv-cyan"
            >
              <MenuGlyph />
            </button>
            <span className="text-sm font-black lowercase tracking-wide">
              upright
            </span>
          </div>
          <main
            className={`min-w-0 max-w-full flex-1 overflow-x-auto ${mainClassName}`}
          >
            {children}
          </main>
        </div>
      </div>
      <MobileNavDrawer
        open={navOpen}
        onDismiss={dismissNav}
        onClose={closeNav}
      />
    </div>
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
      router.replace(loginHref(`${pathname}${window.location.search || ""}`));
      return;
    }
    if (
      user &&
      (pathname === "/login" || pathname === "/auth" || pathname === "/register")
    ) {
      if (hasReadAccess) {
        const next = safeNextPath(
          new URLSearchParams(window.location.search).get("next")
        );
        router.replace(next || "/items");
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
      return (
        <main className="min-h-full min-w-0 max-w-full flex-1">{children}</main>
      );
    }
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-nv-canvas px-4">
        <p className="text-xs font-bold uppercase tracking-wide text-nv-ink/55">
          Loading session…
        </p>
      </div>
    );
  }

  // Help is always a public docs surface (own top nav) — never app chrome.
  if (helpPath) {
    return (
      <main className="min-h-full min-w-0 max-w-full flex-1">{children}</main>
    );
  }

  if (isPublic || !protectedPath) {
    return (
      <main className="min-h-full min-w-0 max-w-full flex-1">{children}</main>
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
    return <AppFrame>{children}</AppFrame>;
  }

  if (!hasReadAccess) {
    return <BillingWall />;
  }

  return (
    <AppFrame
      banners={
        <>
          <PastDueBanner />
          <ReadOnlyBanner />
        </>
      }
      mainClassName={!hasAppAccess ? "upright-readonly" : ""}
    >
      {children}
    </AppFrame>
  );
}

export default function AppShell({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShellInner>{children}</AppShellInner>
      </ToastProvider>
    </AuthProvider>
  );
}
