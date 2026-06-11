"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { GetAllItems, GetItemById } from "@/app/api/apiHandler";

const brutalChrome = "border-brutal border-black shadow-brutal";
const labelClass = "text-[10px] font-black uppercase tracking-wide text-nv-ink/55";

function formatCost(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return value ?? "—";
  return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function FieldRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-black/10 py-2 last:border-b-0">
      <span className={labelClass}>{label}</span>
      <span className="min-w-0 text-right text-sm font-semibold">
        {value === "" || value === null || value === undefined ? "—" : value}
      </span>
    </div>
  );
}

function SectionCard({ title, accent = "bg-nv-cyan", children, className = "" }) {
  return (
    <section className={`${brutalChrome} bg-nv-paper ${className}`}>
      <header className={`border-b-brutal border-black ${accent} px-4 py-2`}>
        <h2 className="text-sm font-black uppercase tracking-wide text-black">
          {title}
        </h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function ItemDetailPage({ params }) {
  const { id } = use(params);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadItem = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let row;
      try {
        row = await GetItemById(id);
      } catch {
        row = undefined;
      }
      // Fallback while the server lacks GET /api/items/:id
      if (!row || row.error || !row.id) {
        const rows = await GetAllItems();
        row = Array.isArray(rows)
          ? rows.find((entry) => String(entry.id) === String(id))
          : undefined;
      }
      if (!row) {
        setError("Item not found.");
        setItem(null);
      } else {
        setItem(row);
      }
    } catch {
      setError("Failed to load item.");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadItem();
  }, [loadItem]);

  const isMake =
    item?.make_or_buy === "make" || item?.make_or_buy === true || item?.make_or_buy === "true";

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/items"
          className="mb-4 inline-block border-brutal border-black bg-nv-paper px-3 py-1 text-[10px] font-black uppercase tracking-wide shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          ← All items
        </Link>

        {loading && (
          <p className="text-xs font-medium text-nv-ink/55">Loading item…</p>
        )}

        {!loading && error && (
          <div className={`${brutalChrome} bg-nv-paper p-6`}>
            <p className="text-sm font-bold uppercase tracking-wide text-red-600">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && item && (
          <>
            <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
                Item #{item.id} · {item.sku || "No SKU"}
              </p>
              <h1 className="text-3xl font-black uppercase leading-tight">
                {item.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="border-brutal border-black bg-nv-cyan px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black">
                  {isMake ? "Make" : "Buy"}
                </span>
                <span
                  className={`border-brutal border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                    item.active ? "bg-nv-cyan text-black" : "bg-black/20 text-white"
                  }`}
                >
                  {item.active ? "Active" : "Inactive"}
                </span>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Item data">
                <FieldRow label="Name" value={item.name} />
                <FieldRow label="SKU" value={item.sku} />
                <FieldRow label="Description" value={item.description} />
                <FieldRow label="Type" value={item.item_type} />
                <FieldRow label="Make or buy" value={isMake ? "Make" : "Buy"} />
                <FieldRow label="Unit of measure" value={item.unit_of_measure} />
                <FieldRow label="Vendor" value={item.vendor} />
                <FieldRow label="Status" value={item.active ? "Active" : "Inactive"} />
                <FieldRow label="Created" value={formatDate(item.created_at)} />
                <FieldRow label="Updated" value={formatDate(item.updated_at)} />
              </SectionCard>

              <SectionCard title="Costing" accent="bg-nv-lavender">
                <FieldRow
                  label="Default cost"
                  value={formatCost(item.default_cost)}
                />
                <FieldRow
                  label="Cost basis"
                  value={
                    item.unit_of_measure ? `per ${item.unit_of_measure}` : "per unit"
                  }
                />
                <FieldRow label="Source" value={isMake ? "Built from BOM" : "Purchased"} />
                <p className="mt-4 text-[10px] font-medium text-nv-ink/50">
                  Rolled-up BOM and labor costing will appear here once jobs and
                  BOMs are wired up.
                </p>
              </SectionCard>

              <SectionCard title="Associated jobs" className="lg:col-span-2">
                <p className="text-xs font-medium text-nv-ink/55">
                  No jobs are linked to this item yet. Jobs that consume or
                  produce this item will show up here.
                </p>
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
