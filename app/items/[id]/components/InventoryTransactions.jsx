"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HistorySkeleton } from "@/components/Skeleton";
import { formatMoney } from "@/lib/pricing";
import { formatDate } from "@/lib/itemDetail";
import { brutalChrome } from "@/lib/chrome";
import {
  reasonForDirection,
  reasonLabel,
  reasonsForDirection,
  signedQuantityText,
} from "@/lib/inventoryTransaction";
import { editInputClass, labelClass } from "./ItemDetailChrome.jsx";

function TransactionNote({ note }) {
  const [open, setOpen] = useState(false);
  if (!note) {
    return <span className="min-w-0 flex-1 text-[10px] font-medium text-nv-ink/35">—</span>;
  }
  return (
    <button
      type="button"
      title={note}
      aria-expanded={open}
      onClick={() => setOpen((current) => !current)}
      className={`min-w-0 flex-1 text-left text-[10px] font-medium text-nv-ink/70 ${
        open ? "whitespace-pre-wrap break-words" : "truncate"
      }`}
    >
      {note}
    </button>
  );
}

export function InventoryTransactionList({
  transactions = [],
  loading = false,
  loadingMore = false,
  error = "",
  hasMore = false,
  onLoadMore,
}) {
  const rows = Array.isArray(transactions) ? transactions : [];
  return (
    <div className="mt-3 border-t border-black/10 pt-3">
      <p className={labelClass}>History</p>
      <div
        className="mt-1 max-h-40 overflow-y-auto overscroll-contain sm:max-h-48"
        role="region"
        aria-label="Stock history"
      >
        {loading && rows.length === 0 ? <HistorySkeleton /> : null}
        {!loading && error && rows.length === 0 ? (
          <p className="py-2 text-[10px] font-bold uppercase tracking-wide text-red-600">{error}</p>
        ) : null}
        {!loading && !error && rows.length === 0 ? (
          <p className="py-2 text-xs font-medium text-nv-ink/55">History starts from today.</p>
        ) : null}
        {rows.length > 0 ? (
          <ul className="divide-y divide-black/10">
            {rows.map((row) => {
              const change = Number(row.quantity_change);
              const tone =
                change > 0 ? "text-nv-green-dark" : change < 0 ? "text-red-600" : "text-nv-ink";
              return (
                <li key={row.id} className="py-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <span className="text-xs font-semibold">{formatDate(row.occurred_on)}</span>
                    <span className={`text-xs font-black tabular-nums ${tone}`}>
                      {signedQuantityText(row)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/70">
                      {reasonLabel(row.reason)}
                    </span>
                    {row.unit_price != null ? (
                      <span className="text-[10px] font-semibold tabular-nums">
                        {formatMoney(row.unit_price)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-2">
                    <TransactionNote note={row.note} />
                    <span className="max-w-[45%] shrink-0 truncate text-right text-[10px] font-medium text-nv-ink/55">
                      {row.created_by_name || "—"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
        {error && rows.length > 0 ? (
          <p className="py-2 text-[10px] font-bold uppercase tracking-wide text-red-600">{error}</p>
        ) : null}
        {hasMore ? (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore || loading}
            className="mt-2 w-full border-brutal-xs border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function InventoryCardActions({
  canWrite,
  inventoryEditing,
  confirmingInventoryQty,
  inventorySaving,
  inventoryReady,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onTransaction,
}) {
  if (inventoryEditing) {
    if (confirmingInventoryQty) return null;
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancelEdit}
          disabled={inventorySaving}
          className="border-brutal-xs border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSaveEdit}
          disabled={inventorySaving}
          className="border-brutal-xs border-black bg-nv-violet px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
        >
          {inventorySaving ? "Saving…" : "Save"}
        </button>
      </div>
    );
  }
  if (!canWrite) return null;
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={onTransaction}
        disabled={!inventoryReady}
        className="border-brutal-xs border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
      >
        Transaction
      </button>
      <button
        type="button"
        onClick={onEdit}
        disabled={!inventoryReady}
        className="border-brutal-xs border-black bg-nv-green-tint px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
      >
        Edit
      </button>
    </div>
  );
}

function directionClass(active) {
  return active
    ? "border-brutal-xs border-black bg-nv-violet px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white"
    : "border-brutal-xs border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide text-black";
}

export function InventoryTransactionForm({
  unit = "",
  draft,
  onChange,
  onHandAfter = "",
  message = "",
  saving = false,
  saveDisabled = false,
  onCancel,
  onSave,
}) {
  const reasons = reasonsForDirection(draft.direction);
  const quantityLabel = unit ? `Quantity (${unit})` : "Quantity";

  const chooseDirection = (next) => {
    onChange({
      direction: next,
      reason: reasonForDirection(next, draft.reason),
    });
  };

  return (
    <form
      className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!saving && !saveDisabled) onSave();
      }}
    >
      <div className="space-y-1">
        <span className={labelClass}>Direction</span>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Direction">
          <button
            type="button"
            aria-pressed={draft.direction === "out"}
            onClick={() => chooseDirection("out")}
            className={directionClass(draft.direction === "out")}
          >
            Out
          </button>
          <button
            type="button"
            aria-pressed={draft.direction === "in"}
            onClick={() => chooseDirection("in")}
            className={directionClass(draft.direction === "in")}
          >
            Input
          </button>
        </div>
      </div>

      <label className="block space-y-1">
        <span className={labelClass}>Reason</span>
        <select
          value={draft.reason}
          onChange={(event) => onChange({ reason: event.target.value })}
          className={editInputClass}
        >
          {reasons.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>{quantityLabel}</span>
        <input
          type="text"
          inputMode="decimal"
          autoFocus
          value={draft.quantity}
          onChange={(event) => onChange({ quantity: event.target.value })}
          className={editInputClass}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className={labelClass}>Price per unit</span>
          <input
            type="text"
            inputMode="decimal"
            value={draft.unitPrice}
            onChange={(event) => onChange({ unitPrice: event.target.value })}
            placeholder="Optional"
            className={editInputClass}
          />
        </label>
        <label className="block space-y-1">
          <span className={labelClass}>Date</span>
          <input
            type="date"
            value={draft.occurredOn}
            onChange={(event) => onChange({ occurredOn: event.target.value })}
            className={editInputClass}
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className={labelClass}>Note</span>
        <textarea
          value={draft.note}
          onChange={(event) => onChange({ note: event.target.value })}
          maxLength={500}
          rows={2}
          placeholder="Optional"
          className={editInputClass}
        />
      </label>

      {onHandAfter ? (
        <p className="text-xs font-semibold tabular-nums">{onHandAfter}</p>
      ) : null}
      {message ? (
        <p className="text-[10px] font-bold uppercase tracking-wide text-red-600" role="alert">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="border-brutal-xs border-black bg-nv-paper px-3 py-1 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || saveDisabled}
          className="border-brutal-xs border-black bg-nv-violet px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

export function InventoryTransactionModal({
  open,
  unit,
  draft,
  onChange,
  onHandAfter,
  message,
  saving,
  saveDisabled,
  onCancel,
  onSave,
}) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape" && !saving) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, saving, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close transaction"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => {
          if (!saving) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-transaction-title"
        className={`fixed left-3 right-3 top-[12vh] z-50 mx-auto flex max-h-[76vh] w-auto max-w-lg flex-col ${brutalChrome} bg-nv-paper sm:left-6 sm:right-6`}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b-brutal-xs border-black bg-nv-purple-dark px-4 py-2">
          <h2
            id="inventory-transaction-title"
            className="text-sm font-black uppercase tracking-wide"
          >
            Transaction
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close"
            className="border-brutal-xs border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
          >
            Close
          </button>
        </header>
        <InventoryTransactionForm
          unit={unit}
          draft={draft}
          onChange={onChange}
          onHandAfter={onHandAfter}
          message={message}
          saving={saving}
          saveDisabled={saveDisabled}
          onCancel={onCancel}
          onSave={onSave}
        />
      </div>
    </>,
    document.body
  );
}
