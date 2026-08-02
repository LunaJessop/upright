"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { GetAllItems, GetTags } from "@/app/api/apiHandler";
import { downloadCsv, rowsToCsv } from "@/lib/csv";
import { formatMoney, isMakeItem, itemDisplayPrice } from "@/lib/pricing";

const brutalChrome = "border-brutal border-black shadow-brutal";
const controlClass =
  "border-brutal border-black bg-nv-paper px-2 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet";

const ITEM_CSV_HEADERS = [
  "id",
  "name",
  "make_or_buy",
  "unit_of_measure",
  "vendor_name",
  "unit_cost",
  "unit_sell_price",
  "active",
  "tags",
  "created_at",
  "updated_at",
];

function exportItemsCsv(items) {
  const csv = rowsToCsv(ITEM_CSV_HEADERS, items, (row, header) => {
    if (header === "vendor_name") {
      return row.vendor_name ?? row.vendor?.name ?? "";
    }
    if (header === "tags") {
      return Array.isArray(row.tags)
        ? row.tags.map((tag) => tag.name).filter(Boolean).join("; ")
        : "";
    }
    if (header === "make_or_buy") {
      return isMakeItem(row.make_or_buy) ? "make" : "buy";
    }
    return row[header];
  });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(`upright-items-${stamp}.csv`, csv);
}

function ItemListRow({ item }) {
  const isMake = isMakeItem(item.make_or_buy);
  const price = formatMoney(itemDisplayPrice(item));
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const unit = item.unit_of_measure ? String(item.unit_of_measure) : "";
  const priceLabel = isMake ? "Sell" : "Cost";
  const priceUnit =
    price !== "—" && unit
      ? `${price} / ${unit}`
      : price !== "—"
        ? price
        : unit
          ? unit
          : null;

  return (
    <li>
      <Link
        href={`/items/${item.id}`}
        className="group block border-brutal border-black bg-nv-paper px-2.5 py-2 transition-transform hover:-translate-y-0.5 hover:bg-nv-cyan/10 sm:px-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-sm font-black uppercase leading-tight tracking-tight text-nv-ink">
                {item.name || "Untitled"}
              </h3>
              <span
                className={`border-brutal border-black px-1 py-px text-[8px] font-black uppercase tracking-wide ${
                  isMake ? "bg-nv-violet text-white" : "bg-nv-teal text-black"
                }`}
              >
                {isMake ? "Make" : "Buy"}
              </span>
              <span
                className={`border-brutal border-black px-1 py-px text-[8px] font-black uppercase tracking-wide ${
                  item.active
                    ? "bg-nv-cyan/50 text-black"
                    : "bg-black/10 text-nv-ink/50"
                }`}
              >
                {item.active ? "Active" : "Inactive"}
              </span>
              {tags.map((tag) => (
                <span
                  key={tag.id ?? tag.name}
                  className="border border-black bg-nv-lavender/40 px-1 py-px text-[8px] font-black uppercase tracking-wide"
                >
                  {tag.name}
                </span>
              ))}
            </div>

            {item.description?.trim() ? (
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-nv-ink/75">
                {item.description.trim()}
              </p>
            ) : null}
          </div>

              <div className="flex shrink-0 flex-col items-end gap-1 self-center text-right">
                {priceUnit ? (
                  <>
                    <span className="text-[8px] font-black uppercase tracking-wide text-nv-ink/45">
                      {priceLabel}
                    </span>
                    <span className="font-mono text-xs font-black tracking-tight text-nv-ink">
                      {priceUnit}
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-[10px] font-bold text-nv-ink/35">
                    —
                  </span>
                )}
                <span className="font-mono text-[10px] font-black uppercase tracking-wide text-nv-ink/30 transition-colors group-hover:text-nv-violet">
                  →
                </span>
              </div>
        </div>
      </Link>
    </li>
  );
}

export default function ItemsPage() {
  const { canWrite } = useAuth();
  const [items, setItems] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagFilter, setTagFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rows, tagRows] = await Promise.all([
        GetAllItems(tagFilter ? { tagId: tagFilter } : {}),
        GetTags().catch(() => []),
      ]);
      setItems(Array.isArray(rows) ? rows : []);
      setTags(Array.isArray(tagRows) ? tagRows : []);
    } catch {
      setError("Failed to load items.");
    } finally {
      setLoading(false);
    }
  }, [tagFilter]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (typeFilter === "make" && !isMakeItem(item.make_or_buy)) return false;
        if (typeFilter === "buy" && isMakeItem(item.make_or_buy)) return false;
        if (statusFilter === "active" && !item.active) return false;
        if (statusFilter === "inactive" && item.active) return false;
        if (!q) return true;

        const haystack = [
          item.name,
          item.description,
          item.sku,
          item.vendor_name,
          item.unit_of_measure,
          ...(Array.isArray(item.tags) ? item.tags.map((tag) => tag.name) : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      })
      .sort((a, b) =>
        String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
          sensitivity: "base",
        })
      );
  }, [items, query, typeFilter, statusFilter]);

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto w-full max-w-none">
        <header className={`mb-4 ${brutalChrome} bg-nv-violet p-5 text-white`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
                Items
              </p>
              <h1 className="text-3xl font-black uppercase leading-tight">
                All items
              </h1>
              <p className="mt-2 text-sm font-medium text-white/90">
                Parts, materials, and finished goods in your catalog.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => exportItemsCsv(filteredItems)}
                disabled={loading || filteredItems.length === 0}
                className="border-brutal border-black bg-nv-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black shadow-brutal-sm transition-transform hover:-translate-y-0.5 disabled:opacity-40"
              >
                Export CSV
              </button>
              {canWrite ? (
                <Link
                  href="/items/new-item"
                  className="border-brutal border-black bg-nv-cyan px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black shadow-brutal-sm transition-transform hover:-translate-y-0.5"
                >
                  Add item
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <section className={`${brutalChrome} bg-nv-paper`}>
          <div className="space-y-3 border-b-brutal border-black bg-nv-canvas/60 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-black uppercase tracking-wide">
                Catalog
                {!loading ? (
                  <span className="ml-2 font-mono text-[10px] text-nv-ink/45">
                    {filteredItems.length}
                    {filteredItems.length !== items.length
                      ? ` / ${items.length}`
                      : ""}
                  </span>
                ) : null}
              </h2>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block space-y-1 sm:col-span-2 lg:col-span-1">
                <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Search
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, tag, SKU…"
                  className={`w-full ${controlClass}`}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Type
                </span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`w-full cursor-pointer ${controlClass}`}
                >
                  <option value="all">All</option>
                  <option value="make">Make</option>
                  <option value="buy">Buy</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full cursor-pointer ${controlClass}`}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Tag
                </span>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className={`w-full cursor-pointer ${controlClass}`}
                >
                  <option value="">All tags</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={String(tag.id)}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {loading && (
              <p className="text-xs font-medium text-nv-ink/55">Loading items…</p>
            )}

            {error && (
              <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                {error}
              </p>
            )}

            {!loading && !error && filteredItems.length === 0 && (
              <p className="text-xs font-medium text-nv-ink/55">
                {items.length === 0
                  ? tagFilter
                    ? "No items with that tag."
                    : `No items yet.${canWrite ? " Use Add item to create entries." : ""}`
                  : "No items match these filters."}
              </p>
            )}

            {!loading && !error && filteredItems.length > 0 && (
              <ul className="space-y-1.5">
                {filteredItems.map((item) => (
                  <ItemListRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
