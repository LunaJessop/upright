"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateBatch, GetAllBatches, GetAllItems } from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import { groupPhasesByItem } from "@/components/BatchPhaseTracker";
import { downloadCsv, rowsToCsv } from "@/lib/csv";

const brutalChrome = "border-brutal border-black shadow-brutal";
const inputClass =
  "w-full border-brutal border-black bg-nv-paper px-2 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet";
const labelClass = "text-[10px] font-black uppercase tracking-wide";

const STATUS_STYLES = {
  planned: "bg-nv-paper text-nv-ink/70",
  in_progress: "bg-nv-cyan text-black",
  complete: "bg-nv-teal text-black",
  cancelled: "bg-red-600 text-white",
};

function statusLabel(status) {
  if (!status || status === "planned") return "pending";
  return status.replace("_", " ");
}

const BATCH_CSV_HEADERS = [
  "id",
  "sku",
  "item_id",
  "item_name",
  "quantity",
  "unit_of_measure",
  "status",
  "start_date",
  "end_date",
  "created_at",
  "phases",
];

function exportBatchesCsv(batches) {
  const csv = rowsToCsv(BATCH_CSV_HEADERS, batches, (row, header) => {
    if (header === "unit_of_measure") return row.item_unit_of_measure ?? "";
    if (header === "status") return statusLabel(row.status);
    if (header === "phases") {
      const phases = Array.isArray(row.phases) ? row.phases : [];
      return phases
        .map((p) => `${p.name}:${p.status}`)
        .join("; ");
    }
    return row[header];
  });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(`upright-batches-${stamp}.csv`, csv);
}

function PhaseStrip({ phases }) {
  const groups = groupPhasesByItem(phases);
  if (groups.length === 0) return null;

  return (
    <div className="mt-1.5 space-y-0.5">
      {groups.map((group) => (
        <div
          key={group.key}
          className="flex flex-wrap items-center gap-0.5"
        >
          <span className="border border-black bg-nv-violet px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
            {group.name}
          </span>
          {group.phases.map((phase) => (
            <span
              key={phase.id}
              className={`border border-black px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                phase.status === "complete"
                  ? "bg-nv-teal text-black"
                  : phase.status === "in_progress"
                    ? "bg-nv-cyan text-black"
                    : phase.status === "skipped"
                      ? "bg-red-600 text-white"
                      : "bg-nv-paper text-nv-ink/70"
              }`}
            >
              {phase.name}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function BatchesPage() {
  const router = useRouter();
  const { canWrite } = useAuth();
  const [batches, setBatches] = useState([]);
  const [makeItems, setMakeItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const pendingBatches = useMemo(
    () =>
      batches.filter(
        (batch) => batch.status !== "complete" && batch.status !== "cancelled"
      ),
    [batches]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [batchRows, itemRows] = await Promise.all([
        GetAllBatches(),
        GetAllItems(),
      ]);
      setBatches(Array.isArray(batchRows) ? batchRows : []);
      const items = Array.isArray(itemRows) ? itemRows : [];
      setMakeItems(
        items.filter(
          (item) =>
            item.make_or_buy === "make" ||
            item.make_or_buy === true ||
            item.make_or_buy === "true"
        )
      );
    } catch {
      setError("Failed to load production queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const closePanel = () => {
    setPanelOpen(false);
    setCreateError("");
    setSelectedItemId("");
    setSku("");
    setQuantity("1");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const qty = Number(quantity);
    const itemId = Number(selectedItemId);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      setCreateError("Select a make item.");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setCreateError("Quantity must be greater than zero.");
      return;
    }
    if (!sku.trim()) {
      setCreateError("SKU is required.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const batch = await CreateBatch({
        item_id: itemId,
        quantity: qty,
        sku: sku.trim(),
      });
      router.push(`/batches/${batch.id}`);
    } catch (err) {
      setCreateError(err?.message || "Failed to create batch.");
      setCreating(false);
    }
  };

  return (
    <div className="relative min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-3xl">
        <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
            Production
          </p>
          <h1 className="text-3xl font-black uppercase leading-tight">
            Production
          </h1>
          <p className="mt-2 text-sm font-medium text-white/90">
            Track batch progress across the floor — open a card to run phases.
          </p>
        </header>

        <section className={`${brutalChrome} bg-nv-paper`}>
          <header className="flex items-center justify-between gap-2 border-b-brutal border-black bg-nv-lavender px-3 py-1.5">
            <h2 className="text-sm font-black uppercase tracking-wide">
              Queue ({pendingBatches.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportBatchesCsv(batches)}
                disabled={loading || batches.length === 0}
                className="border-brutal border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide disabled:opacity-40"
              >
                Export CSV
              </button>
              {canWrite ? (
                <button
                  type="button"
                  onClick={() => setPanelOpen(true)}
                  aria-label="New batch"
                  title="New batch"
                  className="inline-flex h-7 w-7 items-center justify-center border-brutal border-black bg-nv-cyan text-sm font-black leading-none transition-transform hover:-translate-y-0.5"
                >
                  +
                </button>
              ) : null}
            </div>
          </header>

          <div className="p-2">
            {loading && (
              <p className="px-1 py-2 text-xs font-medium text-nv-ink/55">
                Loading queue…
              </p>
            )}
            {error && (
              <p className="px-1 py-2 text-xs font-bold uppercase tracking-wide text-red-600">
                {error}
              </p>
            )}
            {!loading && !error && pendingBatches.length === 0 && (
              <p className="px-1 py-2 text-xs font-medium text-nv-ink/55">
                No batches in the queue.
                {canWrite ? " Use + to start one." : ""}
              </p>
            )}
            {!loading && !error && pendingBatches.length > 0 && (
              <ul className="space-y-1.5">
                {pendingBatches.map((batch) => {
                  const unit = batch.item_unit_of_measure
                    ? ` ${batch.item_unit_of_measure}`
                    : "";
                  return (
                    <li key={batch.id}>
                      <Link
                        href={`/batches/${batch.id}`}
                        className="block border-brutal border-black bg-nv-lavender/15 px-2 py-1.5 transition-transform hover:-translate-y-0.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 text-sm leading-snug">
                            <span className="font-mono font-black">
                              {batch.sku || `Batch ${batch.id}`}
                            </span>
                            <span className="font-black text-nv-ink/40">
                              {" "}
                              -{" "}
                            </span>
                            <span className="font-medium text-nv-ink/80">
                              {batch.item_name}
                            </span>
                          </p>
                          <span
                            className={`shrink-0 border border-black px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${STATUS_STYLES[batch.status] ?? STATUS_STYLES.planned}`}
                          >
                            {statusLabel(batch.status)}
                          </span>
                        </div>

                        <PhaseStrip phases={batch.phases} />

                        <div className="mt-1 flex items-end justify-end">
                          <span className="font-mono text-[10px] font-black">
                            {batch.quantity}
                            {unit}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      {panelOpen && canWrite && (
        <>
          <button
            type="button"
            aria-label="Close new batch panel"
            className="fixed inset-0 z-40 bg-black/40"
            onClick={closePanel}
          />
          <aside
            className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l-brutal border-black bg-nv-paper shadow-brutal`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-batch-title"
          >
            <header className="flex items-center justify-between gap-2 border-b-brutal border-black bg-nv-cyan px-3 py-2">
              <h2
                id="new-batch-title"
                className="text-sm font-black uppercase tracking-wide"
              >
                New batch
              </h2>
              <button
                type="button"
                onClick={closePanel}
                aria-label="Close"
                className="border-brutal border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
              >
                Close
              </button>
            </header>
            <form
              onSubmit={(e) => void handleCreate(e)}
              className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
            >
              <label className="block space-y-1">
                <span className={labelClass}>Make item</span>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">Select item</option>
                  {makeItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>SKU</span>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Lot / batch number"
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>Quantity</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={inputClass}
                />
              </label>
              {createError && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                  {createError}
                </p>
              )}
              {makeItems.length === 0 && (
                <p className="text-[10px] font-medium text-nv-ink/55">
                  No make items yet. Create one under Items first.
                </p>
              )}
              <button
                type="submit"
                disabled={creating || makeItems.length === 0}
                className="mt-auto border-brutal border-black bg-nv-violet px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white shadow-brutal-sm disabled:opacity-40"
              >
                {creating ? "Creating…" : "Create batch"}
              </button>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}
