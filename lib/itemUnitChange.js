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
 * Price after a cross-kind change. The server multiplies money-per-unit by
 * the factor (8 fl oz at $1 becomes $8 each). An untouched price keeps the
 * amount the server just stored.
 */
export function priceAfterCrossKindChange(original, draft, converted, factor) {
  if (sameMoney(original, draft)) {
    return moneyText(converted);
  }
  const text = moneyText(draft);
  if (!text) return "";
  const number = Number(text);
  if (!Number.isFinite(number) || !Number.isFinite(Number(factor))) return text;
  return (number * Number(factor)).toFixed(8).replace(/\.?0+$/, "");
}

/** This item's own recipe, restated per one new unit (each line times the factor). */
export function scaleOwnRecipeForCrossKind(lines, factor) {
  const parsed = Number(factor);
  const rows = Array.isArray(lines) ? lines : [];
  if (!Number.isFinite(parsed) || parsed <= 0) return rows;
  return rows.map((line) => {
    const qty = Number(line?.quantity);
    if (!Number.isFinite(qty)) return line;
    return { ...line, quantity: formatScaledQuantity(qty * parsed) };
  });
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
    if (getUnitFamily(previous) && getUnitFamily(next)) {
      return { action: "cross", unitOfMeasure: next };
    }
    return {
      action: "reject",
      error: `Can't change ${friendlyUnitLabel(previous)} to ${friendlyUnitLabel(next)}.`,
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

/** A known unit changing to a different kind, such as fl oz to each. */
export function isCrossKindUnitChange(fromUnit, toUnit) {
  return planStockUnitChange(fromUnit, toUnit).action === "cross";
}

/**
 * Escape while the item editor is open.
 * The unit dialog sits on top of that editor. Escape dismisses the dialog
 * and leaves the rest of the edit in place. Closing the editor instead
 * drops the draft, and Confirm can still convert stock with nothing to save.
 */
export function itemEditorEscapeAction({ busy = false, unitDialogOpen = false } = {}) {
  if (busy) return "ignore";
  if (unitDialogOpen) return "dismiss-unit-dialog";
  return "close-editor";
}

/**
 * Label for "per 1 parent" while the stock unit is being edited.
 * A cross-kind choice has no factor yet, so the recipe quantities are still
 * per the saved unit. Showing the new unit here would make an edit look like
 * it is already in the new unit, and the later multiply would scale it again.
 */
export function recipeParentUnitWhileEditing(savedUnit, draftUnit) {
  if (isCrossKindUnitChange(savedUnit, draftUnit)) return savedUnit ?? "";
  return draftUnit ?? "";
}

/**
 * Form values after the server has applied a cross-kind factor.
 * Prices the person typed are still in the old unit. Recipe lines are too.
 * Calling this once, then saving with the units already equal, keeps a retry
 * from multiplying those lines a second time.
 */
export function scaledFormAfterCrossKindChange({
  savedUnitCost,
  savedUnitSellPrice,
  draft,
  lines,
  convertedUnitCost,
  convertedUnitSellPrice,
  factor,
  unitOfMeasure,
}) {
  const source = draft ?? {};
  return {
    draft: {
      ...source,
      unit_of_measure: unitOfMeasure,
      unit_cost: priceAfterCrossKindChange(
        savedUnitCost,
        source.unit_cost,
        convertedUnitCost,
        factor
      ),
      unit_sell_price: priceAfterCrossKindChange(
        savedUnitSellPrice,
        source.unit_sell_price,
        convertedUnitSellPrice,
        factor
      ),
    },
    lines: scaleOwnRecipeForCrossKind(lines, factor),
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
