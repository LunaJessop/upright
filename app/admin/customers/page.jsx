"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { listAdminCustomers } from "@/app/api/apiHandler";
import AdminFrame, {
  AdminReadOnlyBadge,
  AdminStatusBadge,
  formatAdminDate,
} from "@/components/AdminFrame";
import { useAuth } from "@/components/AuthProvider";
import {
  canPageBack,
  canPageForward,
  isForbiddenError,
  listWindow,
} from "@/lib/adminCustomers";
import { brutalChrome, inputClass, rowStripe } from "@/lib/chrome";

const PAGE_SIZE = 25;

export default function AdminCustomersPage() {
  const { isPlatformAdmin, loading: authLoading } = useAuth();
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setForbidden(false);
    try {
      const data = await listAdminCustomers({ q: query, limit: PAGE_SIZE, offset });
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
      setTotal(Number(data.page?.total) || 0);
    } catch (err) {
      setCustomers([]);
      setTotal(0);
      if (isForbiddenError(err)) {
        setForbidden(true);
      } else {
        setError(err?.message || "Failed to load customers.");
      }
    } finally {
      setLoading(false);
    }
  }, [offset, query]);

  useEffect(() => {
    if (authLoading || !isPlatformAdmin) return;
    void load();
  }, [authLoading, isPlatformAdmin, load]);

  const windowLabel = listWindow({
    offset,
    count: customers.length,
    total,
  }).label;
  const back = canPageBack(offset);
  const forward = canPageForward({ offset, count: customers.length, total });

  function search(event) {
    event.preventDefault();
    setOffset(0);
    setQuery(draft.trim());
  }

  return (
    <AdminFrame
      title="Customers"
      lede="Search shops by name or email, then open one to see its people and records."
      forbidden={forbidden}
    >
      <form onSubmit={search} className="mt-4 flex flex-wrap items-center gap-2">
        <label className="min-w-[16rem] flex-1">
          <span className="sr-only">Search customers</span>
          <input
            id="customer-search"
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Name or email"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          className="border-brutal-xs border-black bg-nv-green-dark px-3 py-2 text-[10px] font-black uppercase tracking-wide"
        >
          Search
        </button>
      </form>

      {error ? (
        <p className="mt-4 border-brutal-xs border-black bg-red-100 px-3 py-2 text-sm font-semibold">
          {error}
        </p>
      ) : null}

      <div className={`mt-4 overflow-x-auto ${brutalChrome} bg-nv-paper`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-brutal-xs border-black bg-nv-green-muted px-3 py-2">
          <h2 className="text-[10px] font-black uppercase tracking-wide">Customers</h2>
          <p className="text-[10px] font-bold uppercase tracking-wide">{windowLabel}</p>
        </div>
        {loading ? (
          <p className="p-6 text-xs font-bold uppercase tracking-wide text-nv-ink/55">
            Loading customers…
          </p>
        ) : customers.length === 0 ? (
          <p className="p-6 text-sm font-medium text-nv-ink/70">
            {query ? "No customers match that search." : "No customers yet."}
          </p>
        ) : (
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-[10px] font-black uppercase tracking-wide">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Signed up</th>
                <th className="px-3 py-2">Last active</th>
                <th className="px-3 py-2">Users</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Batches</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Plan</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr
                  key={customer.id}
                  className={`border-b border-black/10 align-top last:border-b-0 ${rowStripe(index, "green")}`}
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-bold underline decoration-black/30 underline-offset-2"
                    >
                      {customer.name || "Untitled shop"}
                    </Link>
                    <p className="font-mono text-[10px] text-nv-ink/50">
                      {customer.slug || `ID ${customer.id}`}
                    </p>
                  </td>
                  <td className="px-3 py-2 font-medium">{customer.email || "—"}</td>
                  <td className="px-3 py-2 text-xs">{formatAdminDate(customer.signed_up_at)}</td>
                  <td className="px-3 py-2 text-xs">{formatAdminDate(customer.last_active_at)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{customer.user_count ?? 0}</td>
                  <td className="px-3 py-2 font-mono text-xs">{customer.item_count ?? 0}</td>
                  <td className="px-3 py-2 font-mono text-xs">{customer.batch_count ?? 0}</td>
                  <td className="px-3 py-2">
                    <AdminStatusBadge status={customer.subscription_status} />
                    {customer.read_only ? (
                      <span className="mt-1 block">
                        <AdminReadOnlyBadge />
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-xs font-bold uppercase">
                    {customer.plan || "—"}
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
    </AdminFrame>
  );
}
