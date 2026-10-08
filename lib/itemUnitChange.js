import { friendlyUnitLabel } from "./formatQuantity.js";
import { convertQuantity, normalizeUnit, unitsAreCompatible } from "./units.js";

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
