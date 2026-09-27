/**
 * Validate an inventory edit before any quantity or goal write.
 * Callers must not persist quantity when `ok` is false — a rejected goal
 * range must not change on-hand stock.
 */
export function validateInventoryEdit({
  quantityRaw,
  goalMinRaw = "",
  goalMaxRaw = "",
  editGoals = false,
}) {
  const quantity = Number(quantityRaw);
  if (!Number.isFinite(quantity) || quantity < 0) {
    return {
      ok: false,
      error: "Current quantity must be a non-negative number.",
    };
  }

  if (!editGoals) {
    return { ok: true, quantity, goals: null };
  }

  const minRaw = String(goalMinRaw ?? "").trim();
  const maxRaw = String(goalMaxRaw ?? "").trim();
  if (minRaw === "" && maxRaw === "") {
    return { ok: true, quantity, goals: null };
  }

  const goalMin = Number(minRaw);
  const goalMax = Number(maxRaw);
  if (!Number.isFinite(goalMin) || goalMin < 0) {
    return { ok: false, error: "Goal min must be a non-negative number." };
  }
  if (!Number.isFinite(goalMax) || goalMax < goalMin) {
    return { ok: false, error: "Goal max must be ≥ goal min." };
  }

  return {
    ok: true,
    quantity,
    goals: { goal_min: goalMin, goal_max: goalMax },
  };
}

/** Keep the quantity just written if a goal response omits it. */
export function mergeInventorySave(quantityRow, goalRow) {
  if (!goalRow) return quantityRow;
  return {
    ...quantityRow,
    ...goalRow,
    quantity: goalRow.quantity ?? quantityRow?.quantity,
  };
}
