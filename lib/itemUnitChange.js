import {
  convertQuantity,
  getUnitFamily,
  normalizeUnit,
  unitsAreCompatible,
} from "./units.js";

/**
 * Decide whether an item's stockkeeping unit can change.
 *
 * On-hand quantity, vendor lots, prices, and inventory goals are converted
 * by POST /api/items/:id/change-unit. This check only refuses changes that
 * endpoint cannot do safely: an incompatible unit, a cleared unit, an open
 * batch, or production lots whose output quantity is not rewritten.
 */
export function planItemUnitChange({
  previousUnit,
  nextUnit,
  plannedDelta = 0,
  productionSkuCount = 0,
  inventoryKnown = true,
}) {
  const prev = normalizeUnit(previousUnit);
  const next = normalizeUnit(nextUnit);
  if (prev === next || !prev) {
    return { ok: true, unitChanging: false };
  }

  const nextLabel = next || "no unit";
  const keep = (detail) => ({
    ok: false,
    unitChanging: false,
    error: `Change the unit back to ${prev} before saving. ${detail}`,
  });

  if (!next || !unitsAreCompatible(prev, next)) {
    return keep(
      next
        ? `${prev} can't be converted to ${nextLabel}.`
        : `Clearing the unit would leave existing quantities in ${prev}.`
    );
  }

  if (!inventoryKnown) {
    return keep(
      "Inventory hasn't loaded, so open batches can't be checked."
    );
  }

  const delta = Number(plannedDelta);
  if (Number.isFinite(delta) && delta !== 0) {
    return keep(`Open batches already use this item in ${prev}.`);
  }

  if (Number(productionSkuCount) > 0) {
    return keep(`Production lots already record output in ${prev}.`);
  }

  return { ok: true, unitChanging: true };
}

function formatScaledNumber(value) {
  const rounded = Number(value.toPrecision(12));
  if (Object.is(rounded, -0)) return "0";
  return String(rounded);
}

/**
 * Recipe lines are amounts per 1 stock unit of the parent. Restate them when
 * that stock unit changes so 2 cups per gallon stays 2 cups per gallon after
 * the parent is stocked in cups (0.125 cups per cup).
 *
 * Choosing a unit for the first time does not rescale. Incompatible units,
 * or clearing a unit, are refused when a recipe exists.
 */
export function scaleRecipeQuantities(lines, fromUnit, toUnit) {
  const rows = Array.isArray(lines) ? lines : [];
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (rows.length === 0 || from === to) {
    return { ok: true, lines: rows, factor: 1 };
  }

  if (!getUnitFamily(from)) {
    return { ok: true, lines: rows, factor: 1 };
  }

  const toLabel = to || "no unit";
  if (!to || !unitsAreCompatible(from, to)) {
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
    scaled.push({ ...line, quantity: formatScaledNumber(qty * factor) });
  }
  return { ok: true, lines: scaled, factor };
}

/**
 * Price per stock unit. A gallon at $128 becomes $8 per cup (128 / 16).
 * Blank stays blank. An unchanged or unknown unit leaves the typed value.
 */
export function restateUnitPrice(value, fromUnit, toUnit) {
  const raw = String(value ?? "").trim();
  if (!raw) return raw;
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (!from || !to || from === to || !unitsAreCompatible(from, to)) return raw;
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return raw;
  const factor = convertQuantity(1, from, to);
  if (factor == null || factor === 0) return raw;
  return formatScaledNumber(amount / factor);
}
