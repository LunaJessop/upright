import {
  convertQuantity,
  getUnitFamily,
  normalizeUnit,
  unitsAreCompatible,
} from "./units.js";

/**
 * Decide whether an item's stockkeeping unit can change.
 * Quantity, lot size, batch allocation, and goals are stored as bare numbers
 * in the current unit. Saving a new unit without converting those numbers
 * makes existing stock read as a different amount.
 *
 * Stock, open batches, vendor lots, and production lots cannot be converted
 * from the client (lot and batch rows have no update API). Inventory goals
 * can, when the units are compatible and the user is allowed to edit them.
 *
 * Recipe lines on other items that omit a unit are also bare numbers in this
 * item's stock unit. Those rows cannot be rewritten here, so the change is
 * refused until each of those lines has its own unit.
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
  implicitBomReferenceCount = 0,
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

  if (Number(implicitBomReferenceCount) > 0) {
    return keep(
      `Other recipes list this item without a unit, and those quantities would be counted as ${nextLabel}.`
    );
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

/**
 * Recipe lines are amounts per 1 stock unit of the parent. Restate them when
 * that stock unit changes so 2 cups per gallon stays 2 cups per gallon after
 * the parent is stocked in cups (0.125 cups per cup).
 *
 * Choosing a unit for the first time does not rescale: there was no measured
 * unit to convert from. Incompatible units, or clearing a unit, are refused
 * when a recipe exists — those amounts cannot be restated.
 */
export function scaleRecipeQuantities(lines, fromUnit, toUnit) {
  const rows = Array.isArray(lines) ? lines : [];
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (rows.length === 0 || from === to) {
    return { ok: true, lines: rows, factor: 1 };
  }

  const fromKnown = Boolean(getUnitFamily(from));
  const toKnown = Boolean(getUnitFamily(to));
  if (!fromKnown) {
    return { ok: true, lines: rows, factor: 1 };
  }

  const toLabel = toKnown ? to : "no unit";
  if (!toKnown || !unitsAreCompatible(from, to)) {
    return {
      ok: false,
      error: `Recipe amounts are per ${from}. They can't be restated per ${toLabel}.`,
    };
  }

  const factor = convertQuantity(1, to, from);
  if (factor == null) {
    return {
      ok: false,
      error: `Recipe amounts are per ${from}. They can't be restated per ${toLabel}.`,
    };
  }

  const scaled = [];
  for (const line of rows) {
    const qty = Number(line?.quantity);
    if (!Number.isFinite(qty)) {
      return {
        ok: false,
        error: "Recipe quantities must be numbers before the stock unit can change.",
      };
    }
    scaled.push({ ...line, quantity: formatScaledQuantity(qty * factor) });
  }
  return { ok: true, lines: scaled, factor };
}

function formatScaledQuantity(value) {
  const rounded = Number(value.toPrecision(12));
  if (Object.is(rounded, -0)) return "0";
  return String(rounded);
}

/**
 * BOM lines on other items that name this component and omit a unit.
 * Those quantities are stored as bare numbers in this item's stock unit.
 */
export function implicitBomReferenceCount(catalog, itemId) {
  const id = String(itemId ?? "");
  if (!id) return 0;
  let count = 0;
  for (const item of Array.isArray(catalog) ? catalog : []) {
    if (!Array.isArray(item?.bom_items)) continue;
    for (const line of item.bom_items) {
      if (String(line?.component_item_id) !== id) continue;
      if (!normalizeUnit(line?.unit_of_measure)) count += 1;
    }
  }
  return count;
}
