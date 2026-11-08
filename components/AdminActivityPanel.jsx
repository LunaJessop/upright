"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAdminCustomerActivity, listAdminActivity } from "@/app/api/apiHandler";
import { formatAdminDate } from "@/components/AdminFrame";
import { useAuth } from "@/components/AuthProvider";
import {
  canPageBack,
  canPageForward,
  isForbiddenError,
  listWindow,
} from "@/lib/adminCustomers";
import {
  ACTIVITY_TYPES,
  activitySourceNotes,
  activityTypeLabel,
} from "@/lib/adminOps";
import { brutalChrome, rowStripe } from "@/lib/chrome";

const PAGE_SIZE = 25;

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatAdminDate(value)} ${date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export default function AdminActivityPanel({
  customerId = null,
  reloadToken = 0,
  onForbidden,
}) {
  const { isPlatformAdmin, loading: authLoading } = useAuth();
  const forbiddenRef = useRef(onForbidden);
  forbiddenRef.current = onForbidden;
  const [types, setTypes] = useState([]);
  const [offset, setOffset] = useState(0);
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = { types, limit: PAGE_SIZE, offset };
      const data = customerId
        ? await getAdminCustomerActivity(customerId, query)
        : await listAdminActivity(query);
      setEvents(Array.isArray(data.events) ? data.events : []);
      setTotal(Number(data.page?.total) || 0);
      setNotes(activitySourceNotes(data.sources));
    } catch (err) {
      setEvents([]);
      setTotal(0);
      setNotes([]);
      if (isForbiddenError(err)) forbiddenRef.current?.();
      else setError(err?.message || "Failed to load activity.");
    } finally {
      setLoading(false);
    }
  }, [customerId, offset, types]);

  useEffect(() => {
    if (authLoading || !isPlatformAdmin) return;
    void load();
  }, [authLoading, isPlatformAdmin, load, reloadToken]);

  function toggleType(type) {
    setOffset(0);
    setTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    );
  }

  const windowLabel = listWindow({ offset, count: events.length, total }).label;
  const back = canPageBack(offset);
  const forward = canPageForward({ offset, count: events.length, total });

  return (
    <section className="mt-4">
      <div className="flex flex-wrap gap-2">
        {ACTIVITY_TYPES.map((type) => {
          const on = types.includes(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={on}
              onClick={() => toggleType(type)}
              className={`border-brutal-xs border-black px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                on ? "bg-nv-purple-dark" : "bg-nv-paper text-black"
              }`}
            >
              {activityTypeLabel(type)}
            </button>
          );
        })}
      </div>

      {notes.map((note) => (
        <p
          key={note}
          className="mt-3 border-brutal-xs border-black bg-nv-purple-muted px-3 py-2 text-sm font-semibold"
        >
          {note}
        </p>
      ))}
      {error ? (
        <p className="mt-3 border-brutal-xs border-black bg-red-100 px-3 py-2 text-sm font-semibold">
          {error}
        </p>
      ) : null}

      <div className={`mt-3 overflow-x-auto ${brutalChrome} bg-nv-paper`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-brutal-xs border-black bg-nv-purple-muted px-3 py-2">
          <h2 className="text-[10px] font-black uppercase tracking-wide">Activity</h2>
          <p className="text-[10px] font-bold uppercase tracking-wide">{windowLabel}</p>
        </div>
        {loading ? (
          <p className="p-6 text-xs font-bold uppercase tracking-wide text-nv-ink/55">
            Loading activity…
          </p>
        ) : events.length === 0 ? (
          <p className="p-6 text-sm font-medium text-nv-ink/70">No activity yet.</p>
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-[10px] font-black uppercase tracking-wide">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Who</th>
                <th className="px-3 py-2">What happened</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr
                  key={event.id ?? index}
                  className={`border-b border-black/10 align-top last:border-b-0 ${rowStripe(index, "purple")}`}
                >
                  <td className="px-3 py-2 text-xs">{formatWhen(event.created_at)}</td>
                  <td className="px-3 py-2 text-xs font-bold uppercase">
                    {activityTypeLabel(event.type)}
                  </td>
                  <td className="px-3 py-2 text-xs">{event.email || "—"}</td>
                  <td className="px-3 py-2 font-medium">
                    {event.message || event.action || "—"}
                    {event.template ? (
                      <span className="mt-1 block text-[10px] font-bold uppercase text-nv-ink/55">
                        {event.template}
                        {event.email_status ? ` · ${event.email_status}` : ""}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!back || loading}
          onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
          className="border-brutal-xs border-black bg-nv-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!forward || loading}
          onClick={() => setOffset((current) => current + PAGE_SIZE)}
          className="border-brutal-xs border-black bg-nv-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
