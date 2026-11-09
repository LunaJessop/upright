/**
 * Entered amounts are in the same numeric space as quantity_allocated.
 * The browser does not convert them into another unit before saving.
 */

export function parseEnteredQuantity(value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!/^\d+(\.\d{1,6})?$/.test(text)) return null;
  if (text.length > 24) return null;
  return text;
}

export function enteredExceedsAllocated(entered, allocated) {
  const amount = Number(entered);
  const limit = Number(allocated);
  if (!Number.isFinite(amount) || !Number.isFinite(limit)) return false;
  return amount > limit;
}

export function enteredQuantityFor(progress, batchPhaseId) {
  const rows = Array.isArray(progress) ? progress : [];
  const found = rows.find((row) => {
    if (batchPhaseId == null) return row?.batch_phase_id == null;
    return Number(row?.batch_phase_id) === Number(batchPhaseId);
  });
  if (found?.quantity_entered == null || found.quantity_entered === "") return "0";
  return String(found.quantity_entered);
}

export function progressErrorMessage(error) {
  if (error?.code === "PROGRESS_UNAVAILABLE" || error?.status === 503) {
    return "Ingredient progress is not set up yet.";
  }
  const text = String(error?.message || "").trim();
  if (text && !/\(\d+\)$/.test(text)) return text;
  return "Could not save how much was added. Try again.";
}

/**
 * A late response must not mark a newer draft as saved or replace what the
 * maker is still typing.
 */
export function progressSaveResult({ requestId, activeRequestId, sent, draft, result, error }) {
  if (requestId !== activeRequestId) return { apply: false };
  if (error) {
    return { apply: true, status: "error", error: progressErrorMessage(error) };
  }
  const confirmed = String(result?.quantity_entered ?? "");
  const draftText = String(draft ?? "").trim();
  const keepDraft = draftText !== sent && draftText !== confirmed;
  return {
    apply: true,
    status: keepDraft ? "idle" : "saved",
    value: keepDraft ? String(draft) : confirmed,
    confirmed,
  };
}

export function applyProgressSave(batch, result) {
  if (!batch || !Array.isArray(batch.components) || result?.batch_component_id == null) {
    return batch;
  }
  const phaseId = result.batch_phase_id == null ? null : Number(result.batch_phase_id);
  const saved = {
    batch_phase_id: phaseId,
    quantity_entered: String(result.quantity_entered),
  };
  return {
    ...batch,
    components: batch.components.map((component) => {
      if (Number(component.id) !== Number(result.batch_component_id)) return component;
      const progress = Array.isArray(component.progress) ? [...component.progress] : [];
      const index = progress.findIndex((row) =>
        phaseId == null ? row?.batch_phase_id == null : Number(row?.batch_phase_id) === phaseId
      );
      if (index >= 0) progress[index] = saved;
      else progress.push(saved);
      return { ...component, progress };
    }),
  };
}
