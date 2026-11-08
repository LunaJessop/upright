"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminClients } from "@/app/api/apiHandler";
import AdminFrame, {
  AdminReadOnlyBadge,
  AdminStatusBadge,
  formatAdminDate,
} from "@/components/AdminFrame";
import { useAuth } from "@/components/AuthProvider";
import { isForbiddenError } from "@/lib/adminCustomers";
import { brutalChrome, rowStripe } from "@/lib/chrome";

export default function AdminOverviewPage() {
  const { isPlatformAdmin, loading: authLoading } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setForbidden(false);
    try {
      const data = await getAdminClients();
      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch (err) {
      setClients([]);
      if (isForbiddenError(err)) {
        setForbidden(true);
      } else {
        setError(err?.message || "Failed to load clients.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isPlatformAdmin) return;
    void load();
  }, [authLoading, isPlatformAdmin, load]);

  return (
    <AdminFrame
      title="Overview"
      lede="A quick look at every shop and its billing status."
      forbidden={forbidden}
      actions={
        <button
          type="button"
          onClick={() => void load()}
          className="border-brutal-xs border-black bg-nv-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black"
        >
          Refresh
        </button>
      }
    >
      {error ? (
        <p className="mt-4 border-brutal-xs border-black bg-red-100 px-3 py-2 text-sm font-semibold">
          {error}
        </p>
      ) : null}

      <div className={`mt-4 overflow-x-auto ${brutalChrome} bg-nv-paper`}>
        <h2 className="border-b-brutal-xs border-black bg-nv-purple-muted px-3 py-2 text-[10px] font-black uppercase tracking-wide">
          Clients
        </h2>
        {loading ? (
          <p className="p-6 text-xs font-bold uppercase tracking-wide text-nv-ink/55">
            Loading clients…
          </p>
        ) : clients.length === 0 ? (
          <p className="p-6 text-sm font-medium text-nv-ink/70">No clients yet.</p>
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-[10px] font-black uppercase tracking-wide">
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
              {clients.map((client, index) => (
                <tr
                  key={client.id}
                  className={`border-b border-black/10 align-top last:border-b-0 ${rowStripe(index, "purple")}`}
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
                    <AdminStatusBadge status={client.subscription_status} />
                    {client.read_only ? (
                      <span className="mt-1 block">
                        <AdminReadOnlyBadge />
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{client.user_count ?? 0}</td>
                  <td className="px-3 py-2 font-mono text-[10px] break-all">
                    {client.stripe_subscription_id || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{formatAdminDate(client.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminFrame>
  );
}
