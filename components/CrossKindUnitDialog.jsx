"use client";

import { createPortal } from "react-dom";
import { describeCrossKindPreview } from "@/lib/crossKindPreview";
import { brutalChrome, inputClass } from "@/lib/chrome";

function PreviewGroup({ title, rows }) {
  if (!rows?.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
        {title}
      </p>
      <ul className="divide-y divide-black/10">
        {rows.map((row) => (
          <li
            key={`${title}-${row.label}`}
            className="flex items-baseline justify-between gap-3 py-1 text-xs font-semibold"
          >
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="shrink-0 text-right font-mono text-[10px]">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CrossKindUnitDialog({
  request,
  onFactorChange,
  onPreview,
  onConfirm,
  onCancel,
}) {
  if (!request || typeof document === "undefined") return null;
  const preview = request.preview ? describeCrossKindPreview(request.preview) : null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close unit change"
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cross-kind-title"
        className={`fixed left-3 right-3 top-[12vh] z-[70] mx-auto flex max-h-[76vh] w-auto max-w-lg flex-col ${brutalChrome} bg-nv-paper sm:left-6 sm:right-6`}
      >
        <header className="border-b-brutal-xs border-black bg-nv-purple-dark px-4 py-2 text-white">
          <h2 id="cross-kind-title" className="text-sm font-black uppercase tracking-wide">
            {preview ? "Confirm unit change" : "Change unit"}
          </h2>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {preview ? (
            <>
              <p className="text-sm font-semibold">{preview.summary}</p>
              <p className="text-[10px] font-medium text-nv-ink/55">
                {preview.fromLabel} to {preview.toLabel}
              </p>
              <PreviewGroup title="Stock" rows={preview.stockLines} />
              <PreviewGroup title="Purchase lots" rows={preview.lots} />
              <PreviewGroup title="Recipes using this item" rows={preview.recipes} />
              <PreviewGroup title="This item's recipe" rows={preview.ownRecipe} />
              <PreviewGroup title="Batches" rows={preview.batches} />
            </>
          ) : (
            <>
              <p className="text-sm font-semibold leading-relaxed">{request.question}</p>
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Amount
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={request.factorInput}
                  onChange={(event) => onFactorChange(event.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </label>
              {request.factorError ? (
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                  {request.factorError}
                </p>
              ) : null}
            </>
          )}
        </div>
        <div className="flex gap-2 border-t border-black/10 p-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={request.busy}
            className="flex-1 border-brutal-xs border-black bg-nv-paper px-3 py-2 text-[10px] font-black uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>
          {preview ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={request.busy}
              className="flex-1 border-brutal-xs border-black bg-nv-violet px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {request.busy ? "Saving…" : "Confirm"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onPreview}
              disabled={request.busy}
              className="flex-1 border-brutal-xs border-black bg-nv-violet px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {request.busy ? "Checking…" : "Preview"}
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
