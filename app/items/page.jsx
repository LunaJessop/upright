"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import NeobrutalDataTable from "@/components/NeobrutalDataTable";
import { useAuth } from "@/components/AuthProvider";
import { GetAllItems } from "@/app/api/apiHandler";
import { downloadCsv, rowsToCsv } from "@/lib/csv";

const brutalChrome = "border-brutal border-black shadow-brutal";

const ITEM_CSV_HEADERS = [
  "id",
  "name",
  "make_or_buy",
  "unit_of_measure",
  "vendor_name",
  "vendor_part_number",
  "default_unit_price",
  "active",
  "created_at",
  "updated_at",
];

function exportItemsCsv(items) {
  const csv = rowsToCsv(ITEM_CSV_HEADERS, items, (row, header) => {
    if (header === "vendor_name") {
      return row.vendor_name ?? row.vendor?.name ?? "";
    }
    if (header === "make_or_buy") {
      const v = row.make_or_buy;
      if (v === true || v === "true" || v === "make") return "make";
      if (v === false || v === "false" || v === "buy") return "buy";
      return v ?? "";
    }
    return row[header];
  });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(`upright-items-${stamp}.csv`, csv);
}

export default function ItemsPage() {
  const router = useRouter();
  const { canWrite } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await GetAllItems();
      setItems(Array.isArray(rows) ? rows : []);
    } catch {
      setError("Failed to load items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-7xl">
        <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
            Items
          </p>
          <h1 className="text-3xl font-black uppercase leading-tight">All items</h1>
          <p className="mt-2 text-sm font-medium text-white/90">
            Catalog of parts, materials, and finished goods in your inventory.
          </p>
        </header>

        <section className={`${brutalChrome} bg-nv-paper p-4`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-wide">
              Item list ({items.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportItemsCsv(items)}
                disabled={loading || items.length === 0}
                className="border-brutal border-black bg-nv-paper px-3 py-1 text-[10px] font-black uppercase tracking-wide shadow-brutal-sm transition-transform hover:-translate-y-0.5 disabled:opacity-40"
              >
                Export CSV
              </button>
              {canWrite ? (
                <Link
                  href="/items/new-item"
                  className="border-brutal border-black bg-nv-violet px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  Add item
                </Link>
              ) : null}
            </div>
          </div>

          {loading && (
            <p className="text-xs font-medium text-nv-ink/55">Loading items…</p>
          )}

          {error && (
            <p className="text-xs font-bold uppercase tracking-wide text-red-600">
              {error}
            </p>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="text-xs font-medium text-nv-ink/55">
              No items yet.
              {canWrite ? " Use Add item to create entries." : ""}
            </p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="min-w-0 max-w-full overflow-hidden">
              <NeobrutalDataTable
                rows={items}
                onRowClick={(row) => router.push(`/items/${row.id}`)}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
