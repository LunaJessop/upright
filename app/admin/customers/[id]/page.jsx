"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getAdminCustomer } from "@/app/api/apiHandler";
import AdminFrame, {
  AdminReadOnlyBadge,
  AdminStatusBadge,
  formatAdminDate,
} from "@/components/AdminFrame";
import { useAuth } from "@/components/AuthProvider";
import { isForbiddenError, memberSection, sectionShowing } from "@/lib/adminCustomers";
import { brutalChrome, rowStripe } from "@/lib/chrome";
import { ROLE_LABELS } from "@/lib/auth";

function cell(value) {
  if (value == null || value === "") return "—";
  return String(value);
}

function RecordSection({ title, tone, showing, columns, rows, empty }) {
  const header = tone === "green" ? "bg-nv-green-dark" : "bg-nv-purple-dark";
  const nested = tone === "green" ? "bg-nv-green-muted" : "bg-nv-purple-muted";
  const stripe = tone === "green" ? "green" : "purple";
  return (
    <section className={`mt-4 overflow-x-auto ${brutalChrome} bg-nv-paper`}>
      <header className={`flex flex-wrap items-center justify-between gap-2 border-b-brutal-xs border-black px-3 py-2 ${header}`}>
        <h2 className="text-sm font-black uppercase tracking-wide">{title}</h2>
        <p className="text-[10px] font-bold uppercase tracking-wide">{showing}</p>
      </header>
      {rows.length === 0 ? (
        <p className="px-3 py-4 text-sm font-medium text-nv-ink/70">{empty}</p>
      ) : (
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className={`border-b border-black/10 text-[10px] font-black uppercase tracking-wide ${nested}`}>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id ?? index}
                className={`border-b border-black/10 align-top last:border-b-0 ${rowStripe(index, stripe)}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-2 font-medium">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function AdminCustomerPage({ params }) {
  const { id } = use(params);
  const { isPlatformAdmin, loading: authLoading } = useAuth();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (authLoading || !isPlatformAdmin) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setForbidden(false);
    getAdminCustomer(id)
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setPayload(null);
        if (isForbiddenError(err)) setForbidden(true);
        else if (err?.status === 404) setError("That customer could not be found.");
        else setError(err?.message || "Failed to load customer.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, id, isPlatformAdmin]);

  const customer = payload?.customer;
  const members = memberSection(customer);

  return (
    <AdminFrame
      title={customer?.name || "Customer"}
      lede="Read-only. Nothing on this page changes the shop."
      forbidden={forbidden}
      actions={
        <Link
          href="/admin/customers"
          className="border-brutal-xs border-black bg-nv-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black"
        >
          All customers
        </Link>
      }
    >
      {error ? (
        <p className="mt-4 border-brutal-xs border-black bg-red-100 px-3 py-2 text-sm font-semibold">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-nv-ink/55">
          Loading customer…
        </p>
      ) : null}
      {customer ? (
        <>
          <section className={`mt-4 ${brutalChrome} bg-nv-paper`}>
            <h2 className="border-b-brutal-xs border-black bg-nv-green-dark px-3 py-2 text-sm font-black uppercase tracking-wide">
              Shop
            </h2>
            <dl className="grid gap-3 px-3 py-3 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Email
                </dt>
                <dd className="text-sm font-medium">{cell(customer.email)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Status
                </dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  <AdminStatusBadge status={customer.subscription_status} />
                  {customer.read_only ? <AdminReadOnlyBadge /> : null}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Plan
                </dt>
                <dd className="text-sm font-bold uppercase">{customer.plan || "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Signed up
                </dt>
                <dd className="text-sm font-medium">{formatAdminDate(customer.signed_up_at)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Last active
                </dt>
                <dd className="text-sm font-medium">{formatAdminDate(customer.last_active_at)}</dd>
              </div>
            </dl>
          </section>

          <RecordSection
            title="Members"
            tone="purple"
            showing={sectionShowing(members)}
            rows={members.rows}
            empty="No members yet."
            columns={[
              { key: "name", label: "Name", render: (row) => cell(row.name) },
              { key: "email", label: "Email", render: (row) => cell(row.email) },
              {
                key: "role",
                label: "Role",
                render: (row) => ROLE_LABELS[row.role] || cell(row.role),
              },
              { key: "active", label: "Active", render: (row) => (row.active ? "Yes" : "No") },
            ]}
          />
          <RecordSection
            title="Items"
            tone="green"
            showing={sectionShowing(payload.items)}
            rows={payload.items?.rows ?? []}
            empty="No items yet."
            columns={[
              { key: "name", label: "Name", render: (row) => cell(row.name) },
              { key: "sku", label: "SKU", render: (row) => cell(row.sku) },
              { key: "make", label: "Make or buy", render: (row) => cell(row.make_or_buy) },
              { key: "unit", label: "Unit", render: (row) => cell(row.unit_of_measure) },
              { key: "active", label: "Active", render: (row) => (row.active ? "Yes" : "No") },
            ]}
          />
          <RecordSection
            title="Vendors"
            tone="purple"
            showing={sectionShowing(payload.vendors)}
            rows={payload.vendors?.rows ?? []}
            empty="No vendors yet."
            columns={[
              { key: "name", label: "Name", render: (row) => cell(row.name) },
              { key: "email", label: "Email", render: (row) => cell(row.email) },
              { key: "phone", label: "Phone", render: (row) => cell(row.phone) },
            ]}
          />
          <RecordSection
            title="Phases"
            tone="green"
            showing={sectionShowing(payload.phases)}
            rows={payload.phases?.rows ?? []}
            empty="No phases yet."
            columns={[
              { key: "name", label: "Name", render: (row) => cell(row.name) },
              {
                key: "minutes",
                label: "Minutes",
                render: (row) => cell(row.estimated_minutes),
              },
              { key: "description", label: "Description", render: (row) => cell(row.description) },
            ]}
          />
          <RecordSection
            title="Batches"
            tone="purple"
            showing={sectionShowing(payload.batches)}
            rows={payload.batches?.rows ?? []}
            empty="No batches yet."
            columns={[
              { key: "sku", label: "SKU", render: (row) => cell(row.sku) },
              { key: "item", label: "Item", render: (row) => cell(row.item_name) },
              { key: "status", label: "Status", render: (row) => cell(row.status) },
              { key: "quantity", label: "Quantity", render: (row) => cell(row.quantity) },
              {
                key: "started",
                label: "Started",
                render: (row) => formatAdminDate(row.start_date || row.created_at),
              },
            ]}
          />
        </>
      ) : null}
    </AdminFrame>
  );
}
