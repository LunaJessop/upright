"use client";

import { useEffect, useRef, useState } from "react";
import { SaveBatchComponentProgress } from "@/app/api/apiHandler";
import {
  enteredExceedsAllocated,
  parseEnteredQuantity,
  progressErrorMessage,
  progressSaveResult,
} from "@/lib/batchProgress";

export default function IngredientProgress({
  batchId,
  ingredient,
  canEdit,
  onSaved,
}) {
  const initial = ingredient.entered || "0";
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const draftRef = useRef(initial);
  const savedRef = useRef(initial);
  const requestRef = useRef(0);
  const mountedRef = useRef(true);
  draftRef.current = draft;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (draftRef.current !== savedRef.current) return;
    setDraft(initial);
    draftRef.current = initial;
    savedRef.current = initial;
    setStatus("idle");
    setError("");
  }, [initial, ingredient.componentId, ingredient.batchPhaseId]);

  async function commit() {
    if (!canEdit || ingredient.componentId == null || batchId == null) return;
    const raw = String(draftRef.current ?? "").trim();
    if (raw === savedRef.current) {
      setStatus((current) => (current === "saving" ? current : "idle"));
      setError("");
      return;
    }
    const parsed = parseEnteredQuantity(raw);
    if (!parsed) {
      setStatus("error");
      setError("Enter a quantity that is zero or more, with up to 6 decimal places.");
      return;
    }
    if (enteredExceedsAllocated(parsed, ingredient.quantityAllocated)) {
      setStatus("error");
      setError("Entered quantity cannot be more than the allocated amount.");
      return;
    }
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setStatus("saving");
    setError("");
    try {
      const result = await SaveBatchComponentProgress(batchId, ingredient.componentId, {
        batchPhaseId: ingredient.batchPhaseId,
        quantityEntered: parsed,
      });
      if (!mountedRef.current) return;
      const decision = progressSaveResult({
        requestId,
        activeRequestId: requestRef.current,
        sent: parsed,
        draft: draftRef.current,
        result,
      });
      if (!decision.apply) return;
      savedRef.current = decision.confirmed;
      if (decision.value === decision.confirmed) {
        setDraft(decision.confirmed);
        draftRef.current = decision.confirmed;
      }
      setStatus(decision.status);
      onSaved?.(result);
    } catch (err) {
      if (!mountedRef.current) return;
      const decision = progressSaveResult({
        requestId,
        activeRequestId: requestRef.current,
        sent: parsed,
        draft: draftRef.current,
        error: err,
      });
      if (!decision.apply) return;
      setStatus("error");
      setError(decision.error || progressErrorMessage(err));
    }
  }

  const suffix = ingredient.quantity ? `/ ${ingredient.quantity}` : "";
  const label = `${ingredient.name} added`;

  if (!canEdit || !ingredient.componentId || ingredient.quantityAllocated == null) {
    return (
      <p className="text-right text-sm font-medium text-nv-ink">
        {initial}
        {suffix ? <span className="text-nv-ink/70"> {suffix}</span> : null}
      </p>
    );
  }

  return (
    <div className="text-right">
      <label className="inline-flex max-w-full items-center justify-end gap-1">
        <span className="sr-only">{label}</span>
        <input
          type="text"
          inputMode="decimal"
          aria-label={label}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            draftRef.current = event.target.value;
            setStatus("idle");
            setError("");
          }}
          onBlur={() => void commit()}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            event.currentTarget.blur();
          }}
          className="w-16 min-w-0 border-brutal-xs border-black bg-nv-paper px-1.5 py-1 text-right text-sm font-semibold text-nv-ink outline-none focus:ring-2 focus:ring-nv-violet"
        />
        {suffix ? <span className="text-sm font-medium text-nv-ink/70">{suffix}</span> : null}
      </label>
      {status === "saving" ? (
        <p className="text-xs font-medium text-nv-ink/60" role="status">
          Saving…
        </p>
      ) : null}
      {status === "saved" ? (
        <p className="text-xs font-medium text-nv-ink/60" role="status">
          Saved
        </p>
      ) : null}
      {status === "error" && error ? (
        <p className="text-xs font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
