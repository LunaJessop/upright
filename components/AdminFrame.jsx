"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { brutalChrome } from "@/lib/chrome";
import { subscriptionLabel } from "@/lib/adminCustomers";

const NAV = [
  { href: "/admin", label: "Overview", current: (pathname) => pathname === "/admin" },
  {
    href: "/admin/customers",
    label: "Customers",
    current: (pathname) => pathname.startsWith("/admin/customers"),
  },
  {
    href: "/admin/activity",
    label: "Activity",
    current: (pathname) => pathname.startsWith("/admin/activity"),
  },
  {
    href: "/admin/audit",
    label: "Audit",
    current: (pathname) => pathname.startsWith("/admin/audit"),
  },
];

export function formatAdminDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminStatusBadge({ status }) {
  const label = subscriptionLabel(status);
  let tone = "border-brutal-xs border-black bg-nv-paper text-black";
  if (status === "active" || status === "trialing") {
    tone = "border-brutal-xs border-black bg-nv-green-dark";
  } else if (status === "past_due") {
    tone = "border-brutal-xs border-black bg-amber-200 text-black";
  } else if (status === "canceled" || status === "unpaid") {
    tone = "border-brutal-xs border-black bg-red-600";
  } else if (status === "incomplete" || status === "incomplete_expired") {
    tone = "border-brutal-xs border-black bg-nv-purple-muted";
  }
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

export function AdminReadOnlyBadge() {
  return (
    <span className="inline-block border-brutal-xs border-black bg-nv-purple-muted px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">
      Read-only
    </span>
  );
}

function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="mt-4 flex flex-wrap gap-2">
      {NAV.map((item) => {
        const active = item.current(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`border-brutal-xs border-black px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
              active ? "bg-nv-purple-dark" : "bg-nv-paper text-black"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminDenied() {
  return (
    <div className={`mt-4 ${brutalChrome} bg-nv-paper px-4 py-5`}>
      <h2 className="text-sm font-black uppercase">No access</h2>
      <p className="mt-2 text-sm font-medium text-nv-ink/70">
        You don't have access to admin tools.
      </p>
    </div>
  );
}

export default function AdminFrame({ title, lede, actions, forbidden, children }) {
  const { isPlatformAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-nv-canvas px-4">
        <p className="text-xs font-bold uppercase tracking-wide text-nv-ink/55">
          Loading…
        </p>
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return null;
  }

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className={`${brutalChrome} bg-nv-purple-dark px-4 py-4`}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Admin
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black uppercase leading-tight">{title}</h1>
              {lede ? <p className="mt-2 max-w-2xl text-sm font-medium">{lede}</p> : null}
            </div>
            {actions}
          </div>
        </header>
        <AdminNav />
        {forbidden ? <AdminDenied /> : children}
      </div>
    </div>
  );
}
