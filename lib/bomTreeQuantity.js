import { bomQuantityInStockUnit, normalizeUnit } from "./units.js";

/**
 * Quantity for one BOM tree line, matching batch explosion in
 * upright-server `lib/productionTree.js`:
 * convert the line into the component's stock unit first, then multiply
 * by the parent quantity (already in the parent's stock unit).
 *
 * `parentMultiplier` is null when an ancestor line could not be converted,
 * so this line's rolled-up total is unknown.
 */
export function resolveBomTreeQuantity(line, component, parentMultiplier) {
  const stockUnit = normalizeUnit(component?.unit_of_measure);
  const enteredUnit = normalizeUnit(line?.unit_of_measure);
  const lineUnit = enteredUnit || stockUnit;

  const rawQuantity = line?.quantity;
  const enteredQty = Number(rawQuantity);
  const enteredKnown = Number.isFinite(enteredQty);

  const parentScale = Number(parentMultiplier);
  const parentKnown =
    parentMultiplier != null &&
    parentMultiplier !== "" &&
    Number.isFinite(parentScale);

  const perParentStock = enteredKnown
    ? bomQuantityInStockUnit(rawQuantity, lineUnit, stockUnit)
    : null;

  const flags = [];
  if (!enteredKnown) {
    flags.push("Quantity isn't a number");
  } else if (perParentStock == null) {
    const from = lineUnit || "unset";
    const to = stockUnit || "unset";
    flags.push(`Can't convert ${from} to ${to}`);
  } else {
    if (!stockUnit && !enteredUnit) flags.push("No unit");
    else if (!stockUnit) flags.push("No stock unit");
    if (!parentKnown) {
      flags.push("Can't roll up — a parent line couldn't be converted");
    }
  }

  const canRollUp = perParentStock != null && parentKnown;
  const rolledUp = canRollUp ? perParentStock * parentScale : null;

  return {
    enteredQty: enteredKnown ? enteredQty : rawQuantity,
    enteredUnit,
    stockUnit,
    displayUnit: stockUnit || enteredUnit,
    perParentStock,
    rolledUp,
    childMultiplier: canRollUp ? rolledUp : null,
    unitsDiffer: Boolean(enteredUnit && stockUnit && enteredUnit !== stockUnit),
    flags,
  };
}
