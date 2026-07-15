"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import {
  CancelBatch,
  GetAllItems,
  GetBatchById,
  GetItemById,
  UpdateBatchPhase,
} from "@/app/api/apiHandler";
import BomTreeView from "@/components/BomTreeView";
import BatchPhaseTracker, { currentPhaseLabel } from "@/components/BatchPhaseTracker";
import { useAuth } from "@/components/AuthProvider";

const brutalChrome = "border-brutal border-black shadow-brutal";
const labelClass = "text-[10px] font-black uppercase tracking-wide text-nv-ink/55";

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

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function FieldRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/10 py-2.5 last:border-b-0">
      <span className={`shrink-0 ${labelClass}`}>{label}</span>
      <span className="min-w-0 flex-1 text-right text-sm font-semibold">{value}</span>
    </div>
  );
}

function SectionCard({ title, accent = "bg-nv-cyan", children }) {
  return (
    <section className={`${brutalChrome} bg-nv-paper`}>
      <header className={`border-b-brutal border-black ${accent} px-4 py-2`}>
        <h2 className="text-sm font-black uppercase tracking-wide text-black">
          {title}
        </h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function BatchDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { canWrite } = useAuth();
  const [batch, setBatch] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [batchItem, setBatchItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [phaseError, setPhaseError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const loadBatch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const row = await GetBatchById(id);
      setBatch(row);

      const [items, item] = await Promise.all([
        GetAllItems().catch(() => []),
        row?.item_id
          ? GetItemById(row.item_id).catch(() => null)
          : Promise.resolve(null),
      ]);

      setCatalogItems(Array.isArray(items) ? items : []);
      setBatchItem(item && item.id ? item : null);
    } catch {
      setError("Batch not found.");
      setBatch(null);
      setCatalogItems([]);
      setBatchItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadBatch();
  }, [loadBatch]);

  const handlePhaseStatus = async (phaseId, status) => {
    setUpdating(true);
    setPhaseError("");
    try {
      const updated = await UpdateBatchPhase(id, phaseId, status);
      setBatch(updated);
    } catch (err) {
      setPhaseError(err?.message || "Failed to update phase.");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      const updated = await CancelBatch(id);
      setBatch(updated);
      router.push("/batches");
    } catch (err) {
      setCancelError(err?.message || "Failed to cancel batch.");
      setCancelling(false);
      setConfirmingCancel(false);
    }
  };

  const phases = Array.isArray(batch?.phases) ? batch.phases : [];
  const phaseLabel = currentPhaseLabel(phases);
  const bomLines = Array.isArray(batchItem?.bom_items) ? batchItem.bom_items : [];
  const canCancel =
    canWrite &&
    batch &&
    batch.status !== "complete" &&
    batch.status !== "cancelled";

  const itemById = useMemo(() => {
    const map = new Map();
    if (batchItem) map.set(String(batchItem.id), batchItem);
    for (const entry of catalogItems) {
      map.set(String(entry.id), entry);
    }
    return map;
  }, [batchItem, catalogItems]);

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/batches"
          className="mb-4 inline-block border-brutal border-black bg-nv-paper px-3 py-1 text-[10px] font-black uppercase tracking-wide shadow-brutal-sm transition-transform hover:-translate-y-0.5"
        >
          ← Production
        </Link>

        {loading && (
          <p className="text-xs font-medium text-nv-ink/55">Loading batch…</p>
        )}

        {!loading && error && (
          <div className={`${brutalChrome} bg-nv-paper p-6`}>
            <p className="text-sm font-bold uppercase tracking-wide text-red-600">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && batch && (
          <>
            <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
                {batch.sku || `Batch #${batch.id}`}
              </p>
              <h1 className="text-3xl font-black uppercase leading-tight">
                {batch.item_name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`border-brutal border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${STATUS_STYLES[batch.status] ?? STATUS_STYLES.planned}`}
                >
                  {statusLabel(batch.status)}
                </span>
                <span className="border-brutal border-black bg-nv-cyan px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black">
                  Qty {batch.quantity}
                  {batch.item_unit_of_measure ? ` ${batch.item_unit_of_measure}` : ""}
                </span>
              </div>
              {phaseLabel && (
                <p className="mt-3 text-sm font-medium text-white/90">{phaseLabel}</p>
              )}
            </header>

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
              <SectionCard title="Batch data" accent="bg-nv-lavender">
                <FieldRow label="Item" value={batch.item_name} />
                <div className="flex items-center justify-between gap-4 border-b border-black/10 py-2.5">
                  <span className={`shrink-0 ${labelClass}`}>Item link</span>
                  <Link
                    href={`/items/${batch.item_id}`}
                    className="text-sm font-semibold text-nv-violet underline"
                  >
                    View item
                  </Link>
                </div>
                <FieldRow label="SKU" value={batch.sku || "—"} />
                <FieldRow label="Quantity" value={batch.quantity} />
                <FieldRow label="Status" value={statusLabel(batch.status)} />
                <FieldRow label="Started" value={formatDate(batch.start_date)} />
                <FieldRow label="Completed" value={formatDate(batch.end_date)} />
                <FieldRow label="Created" value={formatDate(batch.created_at)} />
                {canCancel && (
                  <div className="mt-4 space-y-2 border-t border-black/10 pt-3">
                    {cancelError && (
                      <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                        {cancelError}
                      </p>
                    )}
                    {confirmingCancel ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmingCancel(false);
                            setCancelError("");
                          }}
                          disabled={cancelling}
                          className="flex-1 border-brutal border-black bg-nv-paper px-3 py-2 text-[10px] font-black uppercase tracking-wide disabled:opacity-40"
                        >
                          Go back
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCancel()}
                          disabled={cancelling || updating}
                          className="flex-1 border-brutal border-black bg-red-600 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                        >
                          {cancelling ? "Cancelling…" : "Confirm"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelError("");
                          setConfirmingCancel(true);
                        }}
                        disabled={cancelling || updating}
                        className="w-full border-brutal border-black bg-red-600 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                      >
                        Cancel batch
                      </button>
                    )}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="BOM" accent="bg-nv-cyan">
                {bomLines.length > 0 ? (
                  <>
                    <p className="mb-3 text-[10px] font-medium text-nv-ink/60">
                      Expand make components to see nested materials. Quantities
                      are scaled to this batch.
                    </p>
                    <BomTreeView
                      lines={bomLines}
                      itemById={itemById}
                      rootMultiplier={Number(batch.quantity) || 1}
                    />
                  </>
                ) : (
                  <p className="text-xs font-medium text-nv-ink/55">
                    No recipe on this item. Components recorded at batch create
                    may still appear in needs history only.
                  </p>
                )}
              </SectionCard>
            </div>

            <SectionCard title="Production phases" accent="bg-nv-teal">
              <p className="mb-3 text-[10px] font-medium text-nv-ink/60">
                Nested by item — make children first, then this item&apos;s own
                steps.
              </p>
              {batch.status === "cancelled" && (
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-red-600">
                  This batch was cancelled. Phases are read-only.
                </p>
              )}
              {phaseError && (
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-red-600">
                  {phaseError}
                </p>
              )}
              <BatchPhaseTracker
                phases={phases}
                updating={
                  updating || batch.status === "cancelled" || !canWrite
                }
                onStatusChange={(phaseId, status) =>
                  void handlePhaseStatus(phaseId, status)
                }
              />
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
