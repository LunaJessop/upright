"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CreateBatch, GetItemById } from "@/app/api/apiHandler";
import BomTreeView from "@/components/BomTreeView";
import { useToast } from "@/components/Toast";
import { brutalChrome, listClass, rowStripe } from "@/lib/chrome";
import { HELP_LABELS, HELP_TEXT } from "@/lib/helpText";
import { batchCountLabel, formatDate, formatSkuSource } from "@/lib/itemDetail";
import { SectionCard } from "./ItemDetailChrome";

export function useBatches({ id, setItem }) {
  const toast = useToast();
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [batchQty, setBatchQty] = useState("1");
  const [batchSku, setBatchSku] = useState("");
  const [batchError, setBatchError] = useState("");
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [highlightedBatchId, setHighlightedBatchId] = useState(null);

  const handleCreateBatch = async () => {
    const qty = Number(batchQty);
    if (!batchSku.trim()) {
      const message = "SKU is required.";
      setBatchError(message);
      toast.error(message);
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      const message = "Enter a quantity greater than zero.";
      setBatchError(message);
      toast.error(message);
      return;
    }
    setCreatingBatch(true);
    setBatchError("");
    try {
      const batch = await CreateBatch({
        item_id: Number(id),
        quantity: qty,
        sku: batchSku.trim(),
      });
      const updated = await GetItemById(id).catch(() => null);
      setItem((current) => {
        const base = updated?.id ? updated : current;
        if (!base) return current;
        const skus = Array.isArray(base.item_skus) ? base.item_skus : [];
        const exists = skus.some(
          (row) =>
            String(row.batch_id) === String(batch.id) ||
            (batch.sku && row.sku === batch.sku)
        );
        if (exists) return base;
        return {
          ...base,
          item_skus: [
            {
              id: batch.id,
              sku: batch.sku,
              source: "production",
              batch_id: batch.id,
              created_at: new Date().toISOString(),
            },
            ...skus,
          ],
        };
      });
      setBatchModalOpen(false);
      setBatchSku("");
      setBatchQty("1");
      setHighlightedBatchId(batch.id);
      toast.success("Batch created.");
    } catch (err) {
      const message = err?.message || "Failed to create batch.";
      setBatchError(message);
      toast.error(message);
    } finally {
      setCreatingBatch(false);
    }
  };

  const cancelBatchDraft = () => {
    setBatchSku("");
    setBatchQty("1");
    setBatchError("");
    setBatchModalOpen(false);
  };

  useEffect(() => {
    if (highlightedBatchId == null) return;
    document
      .querySelector(`[data-batch-row="${highlightedBatchId}"]`)
      ?.scrollIntoView({ block: "nearest" });
    const timer = window.setTimeout(() => setHighlightedBatchId(null), 2500);
    return () => window.clearTimeout(timer);
  }, [highlightedBatchId]);

  useEffect(() => {
    if (!batchModalOpen) return;
    const onKey = (event) => {
      if (event.key === "Escape") setBatchModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [batchModalOpen]);

  return {
    creatingBatch,
    batchQty,
    setBatchQty,
    batchSku,
    setBatchSku,
    batchError,
    batchModalOpen,
    setBatchModalOpen,
    highlightedBatchId,
    handleCreateBatch,
    cancelBatchDraft,
  };
}

export default function BatchesSection({
  item,
  itemById,
  canWrite,
  editing,
  isMake,
  model,
}) {
  const {
    creatingBatch,
    batchQty,
    setBatchQty,
    batchSku,
    setBatchSku,
    batchError,
    batchModalOpen,
    setBatchModalOpen,
    highlightedBatchId,
    handleCreateBatch,
    cancelBatchDraft,
  } = model;
  const lotSkus = Array.isArray(item?.item_skus) ? item.item_skus : [];

  return (
    <>
      <SectionCard
        title="Batches"
        help={HELP_TEXT.batches}
        helpLabel={HELP_LABELS.batches}
        accent="bg-nv-purple-dark"
        action={
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wide">
              {batchCountLabel(lotSkus.length)}
            </span>
            {!editing && canWrite ? (
              <button
                type="button"
                onClick={() => setBatchModalOpen(true)}
                aria-label="New batch"
                title="New batch"
                className="inline-flex h-7 w-7 items-center justify-center border-brutal-xs border-black bg-nv-cyan text-sm font-black leading-none text-black"
              >
                +
              </button>
            ) : null}
          </div>
        }
      >
        {lotSkus.length > 0 ? (
          <div className="-m-4 md:max-h-[60vh] md:overflow-y-auto">
            <div className="z-10 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 border-b border-black/10 bg-nv-paper px-4 py-1.5 text-[10px] font-black uppercase tracking-wide text-nv-ink/55 md:sticky md:top-0">
              <span>SKU</span>
              <span>Source</span>
              <span>Date</span>
            </div>
            <ul className={listClass}>
              {lotSkus.map((row, index) => {
                const highlighted =
                  highlightedBatchId != null &&
                  String(row.batch_id ?? row.id) === String(highlightedBatchId);
                const content = (
                  <>
                    <span className="truncate font-mono text-sm font-black">
                      {row.sku}
                    </span>
                    <span className="truncate text-[10px] font-bold uppercase tracking-wide text-nv-ink/60">
                      {formatSkuSource(row.source)}
                      {row.batch_id != null ? ` #${row.batch_id}` : ""}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-nv-ink/60">
                      {formatDate(row.created_at)}
                    </span>
                  </>
                );
                const rowClass = `grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 hover:bg-nv-lavender/30 ${rowStripe(index, "lavender")}`;
                const highlightStyle = highlighted
                  ? { backgroundColor: "var(--nv-purple-muted)" }
                  : undefined;

                if (row.batch_id != null) {
                  return (
                    <li key={row.id} data-batch-row={row.batch_id}>
                      <Link
                        href={`/batches/${row.batch_id}`}
                        className={rowClass}
                        style={highlightStyle}
                      >
                        {content}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li
                    key={row.id}
                    data-batch-row={row.id}
                    className={rowClass}
                    style={highlightStyle}
                  >
                    {content}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="text-xs font-medium text-nv-ink/55">No batches yet.</p>
        )}
      </SectionCard>

      {isMake && batchModalOpen && canWrite
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close new batch"
                className="fixed inset-0 z-40 bg-black/40"
                onClick={() => setBatchModalOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-batch-title"
                className={`fixed left-3 right-3 top-[12vh] z-50 mx-auto flex max-h-[76vh] w-auto max-w-lg flex-col ${brutalChrome} bg-nv-paper sm:left-6 sm:right-6`}
              >
                <header className="flex shrink-0 items-center justify-between gap-2 border-b-brutal-xs border-black bg-nv-purple-dark px-4 py-2">
                  <h2
                    id="new-batch-title"
                    className="text-sm font-black uppercase tracking-wide"
                  >
                    New batch
                  </h2>
                  <button
                    type="button"
                    onClick={() => setBatchModalOpen(false)}
                    aria-label="Close"
                    className="border-brutal-xs border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black"
                  >
                    Close
                  </button>
                </header>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  {batchError && (
                    <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                      {batchError}
                    </p>
                  )}
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="min-w-32 flex-1 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                        SKU
                      </span>
                      <input
                        type="text"
                        value={batchSku}
                        onChange={(e) => setBatchSku(e.target.value)}
                        placeholder="Lot / batch number"
                        autoFocus
                        className="w-full border-brutal-xs border-black bg-nv-paper px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet"
                      />
                    </label>
                    <label className="w-20 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                        Qty
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={batchQty}
                        onChange={(e) => setBatchQty(e.target.value)}
                        className="w-full border-brutal-xs border-black bg-nv-paper px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet"
                      />
                    </label>
                  </div>
                  {Array.isArray(item.bom_items) &&
                    item.bom_items.length > 0 &&
                    Number(batchQty) > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-medium text-nv-ink/55">
                          Batch preview — totals for this quantity.
                        </p>
                        <BomTreeView
                          lines={item.bom_items}
                          itemById={itemById}
                          rootMultiplier={Number(batchQty) || 1}
                          parentItem={item}
                        />
                      </div>
                    )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={cancelBatchDraft}
                      disabled={creatingBatch}
                      className="border-brutal-xs border-black bg-nv-paper px-3 py-1 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCreateBatch()}
                      disabled={creatingBatch}
                      className="border-brutal-xs border-black bg-nv-violet px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                    >
                      {creatingBatch ? "Creating…" : "Create batch"}
                    </button>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )
        : null}
    </>
  );
}
