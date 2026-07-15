"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClientUser, getClient } from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import {
  PASSWORD_POLICY_HINT,
  ROLE_LABELS,
  passwordMeetsPolicy,
} from "@/lib/auth";

const brutalChrome = "border-brutal border-black shadow-brutal";
const inputClass =
  "w-full border-brutal border-black bg-nv-paper px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-nv-violet";

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
    <div className="border-b border-black/10 py-3 last:border-b-0 sm:border-b-0 sm:py-0">
      <p className="text-[10px] font-black uppercase tracking-wide text-nv-ink/45">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-nv-ink">{value || "—"}</p>
    </div>
  );
}

export default function ClientPage() {
  const { user, canWrite } = useAuth();
  const isFounder = user?.role === "founder";

  const [client, setClient] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadClient = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getClient();
      setClient(data.client);
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch (err) {
      setError(err?.message || "Failed to load company.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!passwordMeetsPolicy(password)) {
      setFormError(PASSWORD_POLICY_HINT);
      return;
    }

    setSubmitting(true);
    try {
      await createClientUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      setFormSuccess("User account created.");
      await loadClient();
    } catch (err) {
      setFormError(err?.message || "Could not create user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-3xl">
        <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
            Company
          </p>
          <h1 className="text-3xl font-black uppercase leading-tight">
            {client?.name ?? user?.client_name ?? "Client"}
          </h1>
          <p className="mt-2 text-sm font-medium text-white/90">
            Company details and team accounts for your workspace.
          </p>
        </header>

        {loading && (
          <p className="mb-4 text-xs font-bold uppercase tracking-wide text-nv-ink/55">
            Loading company…
          </p>
        )}

        {error && (
          <p className="mb-4 text-xs font-bold uppercase tracking-wide text-red-600">
            {error}
          </p>
        )}

        {client && (
          <section className={`mb-6 ${brutalChrome} bg-nv-paper p-5`}>
            <h2 className="mb-4 text-sm font-black uppercase tracking-wide">
              Company profile
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name" value={client.name} />
              <Field label="Slug" value={client.slug} />
              <Field label="Company email" value={client.email} />
              <Field label="Phone" value={client.phone} />
              <Field
                label="Subscription"
                value={client.subscription_status}
              />
              <Field label="Created" value={formatDate(client.created_at)} />
            </div>
          </section>
        )}

        <section className={`mb-6 ${brutalChrome} bg-nv-paper p-5`}>
          <h2 className="mb-1 text-sm font-black uppercase tracking-wide">
            Team ({members.length})
          </h2>
          <p className="mb-4 text-xs font-medium text-nv-ink/60">
            People with login access to this company workspace.
          </p>

          {members.length === 0 ? (
            <p className="text-xs font-medium text-nv-ink/50">No team members yet.</p>
          ) : (
            <ul className="divide-y divide-black/10 border-t border-black/10">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase tracking-wide">
                      {member.name}
                    </p>
                    <p className="truncate text-xs font-medium text-nv-ink/60">
                      {member.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-wide text-nv-violet">
                      {ROLE_LABELS[member.role] ?? member.role}
                    </p>
                    <p className="text-[10px] font-medium text-nv-ink/45">
                      {member.active ? "Active" : "Inactive"} ·{" "}
                      {formatDate(member.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isFounder && canWrite ? (
          <section className={`${brutalChrome} bg-nv-paper p-5`}>
            <h2 className="mb-1 text-sm font-black uppercase tracking-wide">
              Add user account
            </h2>
            <p className="mb-4 text-xs font-medium text-nv-ink/60">
              Founders can create logins for teammates. They join this company
              immediately.
            </p>

            <form onSubmit={(e) => void handleAddUser(e)} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Name
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Alex Operator"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="alex@company.com"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Temporary password
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
                <span className="block text-[10px] font-medium text-nv-ink/45">
                  {PASSWORD_POLICY_HINT}
                </span>
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Role
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputClass}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="founder">Founder</option>
                </select>
              </label>

              {formError && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                  {formError}
                </p>
              )}
              {formSuccess && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-nv-violet">
                  {formSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="border-brutal border-black bg-nv-violet px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white shadow-brutal-sm transition-transform hover:-translate-y-0.5 disabled:opacity-40"
              >
                {submitting ? "Creating…" : "Create user"}
              </button>
            </form>
          </section>
        ) : (
          <section className={`${brutalChrome} bg-nv-paper p-5`}>
            <h2 className="text-sm font-black uppercase tracking-wide">
              Add user account
            </h2>
            <p className="mt-2 text-xs font-medium text-nv-ink/60">
              {isFounder
                ? "User invites are disabled while the account is read-only. Renew billing to add teammates."
                : "Only founders can add teammate accounts. Ask a founder on your company if you need someone invited."}
            </p>
          </section>
        )}

        <div className="mt-4">
          <Link
            href="/profile"
            className="text-[10px] font-bold uppercase tracking-wide text-nv-violet hover:underline"
          >
            ← Back to profile
          </Link>
        </div>
      </div>
    </div>
  );
}
