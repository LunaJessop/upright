"use client";

import { useCallback, useEffect, useState } from "react";
import { listAdminAudit } from "@/app/api/apiHandler";
import AdminFrame, { formatAdminDate } from "@/components/AdminFrame";
import { useAuth } from "@/components/AuthProvider";
import {
  canPageBack,
  canPageForward,
  isForbiddenError,
  listWindow,
} from "@/lib/adminCustomers";
import { ACTIVITY_LOG_UNAVAILABLE, activityTypeLabel } from "@/lib/adminOps";
import { brutalChrome, inputClass, rowStripe } from "@/lib/chrome";

const PAGE_SIZE = 25;

const EMPTY_FILTERS = {
  clientId: "",
  userId: "",
  adminUserId: "",
  action: "",
};

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatAdminDate(value)} ${date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export default function AdminAuditPage() {
  const { isPlatformAdmin, loading: authLoading } = useAuth();
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [offset, setOffset] = useState(0);
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminAudit({ ...filters, limit: PAGE_SIZE, offset });
      setEvents(Array.isArray(data.events) ? data.events : []);
      setTotal(Number(data.page?.total) || 0);
      setUnavailable(data.sources?.admin_activity === "unavailable");
    } catch (err) {
      setEvents([]);
      setTotal(0);
      setUnavailable(false);
      if (isForbiddenError(err)) setForbidden(true);
      else setError(err?.message || "Failed to load the audit log.");
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => {
    if (authLoading || !isPlatformAdmin) return;
    void load();
  }, [authLoading, isPlatformAdmin, load]);

  function applyFilters(event) {
    event.preventDefault();
    setOffset(0);
    setFilters({ ...draft });
  }

  const windowLabel = listWindow({ offset, count: events.length, total }).label;

  return (
    <AdminFrame
      title="Audit"
      lede="What platform admins have opened or changed."
      forbidden={forbidden}
    >
      <form onSubmit={applyFilters} className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["clientId", "Customer id"],
          ["userId", "User id"],
          ["adminUserId", "Admin user id"],
          ["action", "Action"],
        ].map(([key, label]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
              {label}
            </span>
            <input
              value={draft[key]}
              onChange={(event) =>
                setDraft((current) => ({ ...current, [key]: event.target.value }))
              }
              className={inputClass}
            />
          </label>
        ))}
        <div className="flex items-end">
          <button
            type="submit"
            className="border-brutal-xs border-black bg-nv-green-dark px-3 py-2 text-[10px] font-black uppercase tracking-wide"
          >
            Apply
          </button>
        </div>
      </form>

      {unavailable ? (
        <p className="mt-3 border-brutal-xs border-black bg-nv-purple-muted px-3 py-2 text-sm font-semibold">
          {ACTIVITY_LOG_UNAVAILABLE}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 border-brutal-xs border-black bg-red-100 px-3 py-2 text-sm font-semibold">
          {error}
        </p>
      ) : null}

      <div className={`mt-4 overflow-x-auto ${brutalChrome} bg-nv-paper`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-brutal-xs border-black bg-nv-purple-muted px-3 py-2">
          <h2 className="text-[10px] font-black uppercase tracking-wide">Audit</h2>
          <p className="text-[10px] font-bold uppercase tracking-wide">{windowLabel}</p>
        </div>
        {loading ? (
          <p className="p-6 text-xs font-bold uppercase tracking-wide text-nv-ink/55">
            Loading audit…
          </p>
        ) : events.length === 0 ? (
          <p className="p-6 text-sm font-medium text-nv-ink/70">No audit events yet.</p>
        ) : (
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-[10px] font-black uppercase tracking-wide">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Admin</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr
                  key={event.id ?? index}
                  className={`border-b border-black/10 align-top last:border-b-0 ${rowStripe(index, "purple")}`}
                >
                  <td className="px-3 py-2 text-xs">{formatWhen(event.created_at)}</td>
                  <td className="px-3 py-2 text-xs">{event.admin_email || "—"}</td>
                  <td className="px-3 py-2 text-xs font-bold uppercase">
                    {activityTypeLabel(event.action)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{event.client_id ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{event.email || event.user_id || "—"}</td>
                  <td className="px-3 py-2 font-medium">{event.message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canPageBack(offset) || loading}
          onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
          className="border-brutal-xs border-black bg-nv-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!canPageForward({ offset, count: events.length, total }) || loading}
          onClick={() => setOffset((current) => current + PAGE_SIZE)}
          className="border-brutal-xs border-black bg-nv-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </AdminFrame>
  );
}
