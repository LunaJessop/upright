import { convertQuantity, normalizeUnit } from "./units.js";

/**
 * Decide whether an item's stockkeeping unit can change.
 * Quantity, lot size, batch allocation, and goals are stored as bare numbers
 * in the current unit. Saving a new unit without converting those numbers
 * makes existing stock read as a different amount.
 *
 * Stock, open batches, vendor lots, and production lots cannot be converted
 * from the client (lot and batch rows have no update API). Inventory goals
 * can, when the units are compatible and the user is allowed to edit them.
 */
export function planItemUnitChange({
  previousUnit,
  nextUnit,
  quantity = 0,
  plannedDelta = 0,
  goalMin = null,
  goalMax = null,
  purchaseLotCount = 0,
  productionSkuCount = 0,
  inventoryKnown = true,
  purchaseLotsKnown = true,
  canEditGoals = false,
}) {
  const prev = normalizeUnit(previousUnit);
  const next = normalizeUnit(nextUnit);
  if (prev === next || !prev) {
    return { ok: true, goalUpdate: null, previousGoals: null };
  }

  const nextLabel = next || "no unit";
  const keep = (detail) => ({
    ok: false,
    error: `Change the unit back to ${prev} before saving. ${detail}`,
  });

  if (!inventoryKnown) {
    return keep(
      "Inventory hasn't loaded, so the on-hand quantity can't be checked."
    );
  }
  if (!purchaseLotsKnown) {
    return keep(
      "Vendor lots haven't loaded, so their quantities can't be checked."
    );
  }

  const qty = Number(quantity);
  if (Number.isFinite(qty) && qty !== 0) {
    return keep(
      `This item has stock on hand, and that quantity would be counted as ${nextLabel}.`
    );
  }

  const delta = Number(plannedDelta);
  if (Number.isFinite(delta) && delta !== 0) {
    return keep(`Open batches already use this item in ${prev}.`);
  }

  if (Number(purchaseLotCount) > 0) {
    return keep(
      `Vendor lot quantities are in ${prev}, and deleting a lot would subtract them as ${nextLabel}.`
    );
  }

  if (Number(productionSkuCount) > 0) {
    return keep(`Production lots already record output in ${prev}.`);
  }

  if (goalMin == null && goalMax == null) {
    return { ok: true, goalUpdate: null, previousGoals: null };
  }
  if (goalMin == null || goalMax == null || !next) {
    return keep(`An inventory goal is set in ${prev}.`);
  }

  const nextMin = convertQuantity(goalMin, prev, next);
  const nextMax = convertQuantity(goalMax, prev, next);
  if (nextMin == null || nextMax == null) {
    return keep(
      `The inventory goal is in ${prev} and can't be converted to ${nextLabel}.`
    );
  }

  if (!canEditGoals) {
    return keep(
      `An inventory goal is set in ${prev}, and only an admin can convert it.`
    );
  }

  return {
    ok: true,
    goalUpdate: { goal_min: nextMin, goal_max: nextMax },
    previousGoals: { goal_min: Number(goalMin), goal_max: Number(goalMax) },
  };
}
