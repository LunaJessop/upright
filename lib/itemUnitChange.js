import { friendlyUnitLabel } from "./formatQuantity.js";
import {
  convertQuantity,
  getUnitFamily,
  normalizeUnit,
  unitsAreCompatible,
} from "./units.js";

function moneyText(value) {
  if (value == null) return "";
  return String(value).trim();
}

/** True when two price fields are the same amount, including blanks. */
export function sameMoney(a, b) {
  const left = moneyText(a);
  const right = moneyText(b);
  if (!left && !right) return true;
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber === rightNumber;
  }
  return left === right;
}

/**
 * A price typed while the form still shows the old unit.
 * The server divides money-per-unit by the quantity factor (16 lb dollars
 * become 1 oz dollar).
 */
export function scalePerUnitPrice(value, factor) {
  const text = moneyText(value);
  if (!text) return "";
  const number = Number(text);
  if (!Number.isFinite(number) || !Number.isFinite(factor) || factor === 0) {
    return text;
  }
  return (number / factor).toFixed(8).replace(/\.?0+$/, "");
}

/**
 * Price to send on the normal item save after the unit has already changed.
 * An untouched price keeps the amount the server just converted. A price
 * the person edited is still in the old unit, so it is scaled the same way.
 */
export function priceAfterUnitChange(original, draft, converted, factor) {
  if (sameMoney(original, draft)) {
    return moneyText(converted);
  }
  return scalePerUnitPrice(draft, factor);
}

/**
 * How to save a stock unit.
 * A real change goes to POST /api/items/:id/change-unit. The normal item
 * update then sends the other fields, with this unit already applied, so
 * the update does not try to change the unit again.
 * The first unit on a blank item stays on the normal update.
 */
export function planStockUnitChange(previousUnit, nextUnit) {
  const previous = normalizeUnit(previousUnit);
  const next = normalizeUnit(nextUnit);

  if (!previous && !next) {
    return { action: "keep", unitOfMeasure: "" };
  }
  if (!previous) {
    return { action: "keep", unitOfMeasure: next };
  }
  if (previous === next) {
    return { action: "keep", unitOfMeasure: next };
  }
  if (!next) {
    return {
      action: "reject",
      error: `Pick a unit. This item is stocked in ${friendlyUnitLabel(previous)}.`,
    };
  }
  if (!unitsAreCompatible(previous, next)) {
    return {
      action: "reject",
      error: `Can't change ${friendlyUnitLabel(previous)} to ${friendlyUnitLabel(next)}. Pick another unit of the same kind.`,
    };
  }
  const factor = convertQuantity(1, previous, next);
  if (factor == null || !Number.isFinite(factor) || factor <= 0) {
    return {
      action: "reject",
      error: `Can't change ${friendlyUnitLabel(previous)} to ${friendlyUnitLabel(next)}.`,
    };
  }
  return { action: "change", unitOfMeasure: next, factor };
}

/**
 * Recipe lines are amounts per 1 stock unit of the parent. Restate them when
 * that stock unit changes so 2 cups per gallon stays 2 cups per gallon after
 * the parent is stocked in cups (0.125 cups per cup).
 *
 * Choosing a unit for the first time does not rescale: there was no measured
 * unit to convert from. Incompatible units, or clearing a unit, are refused
 * when a recipe exists — those amounts cannot be restated.
 *
 * Lines on other items that omit a unit are left alone here. The change-unit
 * endpoint stamps those rows with the previous stock unit.
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
