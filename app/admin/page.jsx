"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminClients } from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";

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

function statusClass(status) {
  switch (status) {
    case "active":
      return "bg-nv-cyan/40";
    case "past_due":
      return "bg-amber-200";
    case "incomplete":
      return "bg-nv-ink/10";
    case "canceled":
    case "unpaid":
      return "bg-red-200";
    default:
      return "bg-nv-paper";
  }
}

export default function AdminClientsPage() {
  const { isPlatformAdmin, loading: authLoading } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminClients();
      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch (err) {
      setError(err?.message || "Failed to load clients.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isPlatformAdmin) return;
    void load();
  }, [authLoading, isPlatformAdmin, load]);

  if (authLoading) {
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
    <div className="min-h-full bg-nv-canvas px-4 py-8 text-nv-ink sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-nv-ink/55">
              Upright
            </p>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tight">
              Clients
            </h1>
            <p className="mt-2 text-sm font-medium text-nv-ink/70">
              Platform view of every tenant and billing status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="border-brutal border-black bg-nv-paper px-3 py-2 text-[10px] font-black uppercase tracking-wide shadow-brutal-sm transition-transform hover:-translate-y-0.5"
          >
            Refresh
          </button>
        </div>

        {error && (
          <p className="mt-4 border-brutal border-black bg-red-100 px-3 py-2 text-sm font-semibold">
            {error}
          </p>
        )}

        <div className={`mt-6 overflow-x-auto ${brutalChrome} bg-nv-paper`}>
          {loading ? (
            <p className="p-6 text-xs font-bold uppercase tracking-wide text-nv-ink/55">
              Loading clients…
            </p>
          ) : clients.length === 0 ? (
            <p className="p-6 text-sm font-medium text-nv-ink/70">No clients yet.</p>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-brutal border-black bg-nv-canvas text-[10px] font-black uppercase tracking-wide">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Users</th>
                  <th className="px-3 py-2">Stripe sub</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-black/10 align-top last:border-b-0"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{client.id}</td>
                    <td className="px-3 py-2">
                      <p className="font-bold">{client.name || "—"}</p>
                      <p className="font-mono text-[10px] text-nv-ink/50">
                        {client.slug || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-2 font-medium">{client.email || "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block border-brutal border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusClass(
                          client.subscription_status
                        )}`}
                      >
                        {client.subscription_status || "—"}
                      </span>
                      {client.read_only ? (
                        <p className="mt-1 text-[10px] font-bold uppercase text-nv-ink/50">
                          Read-only
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {client.user_count ?? 0}
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] break-all">
                      {client.stripe_subscription_id || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {formatDate(client.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
