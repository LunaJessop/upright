"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import NeobrutalDataTable from "@/components/NeobrutalDataTable";
import { GetAllItems } from "@/app/api/apiHandler";

const brutalChrome = "border-brutal border-black shadow-brutal";

export default function ItemsPage() {
  const router = useRouter();
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
              <Link
                href="/items/new-item"
                className="border-brutal border-black bg-nv-violet px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Add item
              </Link>
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
              No items yet. Use Add item to create entries.
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
