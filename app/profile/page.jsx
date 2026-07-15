"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ROLE_LABELS } from "@/lib/auth";

const brutalChrome = "border-brutal border-black shadow-brutal";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function Field({ label, value }) {
  return (
    <div className="border-b border-black/10 py-3 last:border-b-0">
      <p className="text-[10px] font-black uppercase tracking-wide text-nv-ink/45">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-nv-ink">{value || "—"}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshSession } = useAuth();

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-2xl">
        <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
            Account
          </p>
          <h1 className="text-3xl font-black uppercase leading-tight">Profile</h1>
          <p className="mt-2 text-sm font-medium text-white/90">
            Your personal account details from registration.
          </p>
        </header>

        <section className={`${brutalChrome} bg-nv-paper p-5`}>
          <div className="mb-4 flex items-center gap-4 border-b-brutal border-black pb-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center border-brutal border-black bg-nv-violet text-sm font-black uppercase text-white shadow-brutal-sm"
              aria-hidden
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-black uppercase tracking-wide">
                {user?.name ?? "User"}
              </p>
              <p className="truncate text-xs font-medium text-nv-ink/60">
                {user?.email}
              </p>
            </div>
          </div>

          <Field label="Name" value={user?.name} />
          <Field label="Email" value={user?.email} />
          <Field
            label="Role"
            value={ROLE_LABELS[user?.role] ?? user?.role}
          />
          <Field label="Company" value={user?.client_name} />
          <Field label="Member since" value={formatDate(user?.created_at)} />
          <Field
            label="Subscription"
            value={user?.subscription_status ?? "—"}
          />
        </section>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/client"
            className="border-brutal border-black bg-nv-violet px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white shadow-brutal-sm transition-transform hover:-translate-y-0.5"
          >
            Company page
          </Link>
          <Link
            href="/items"
            className="border-brutal border-black bg-nv-paper px-4 py-2 text-[10px] font-black uppercase tracking-wide shadow-brutal-sm transition-transform hover:-translate-y-0.5"
          >
            Back to items
          </Link>
        </div>
      </div>
    </div>
  );
}
