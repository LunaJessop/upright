"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ServerStatusIndicator } from "@/components/ServerStatusIndicator";
import Navbar from "@/components/Navbar";
import { AuthProvider, useAuth } from "@/components/AuthProvider";

const PUBLIC_PATHS = new Set(["/login"]);

function AppShellInner({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isPublic = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      router.replace("/login");
    }
    if (user && pathname === "/login") {
      router.replace("/items");
    }
  }, [user, loading, isPublic, pathname, router]);

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

  return (
    <div className="flex min-h-full flex-1">
      <Navbar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

export default function AppShell({ children }) {
  return (
    <AuthProvider>
      <ServerStatusIndicator />
      <AppShellInner>{children}</AppShellInner>
    </AuthProvider>
  );
}
