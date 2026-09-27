import { friendlyUnitLabel } from "./formatQuantity.js";
import {
  bomQuantityInStockUnit,
  componentStockMultiplier,
  normalizeUnit,
} from "./units.js";

/**
 * Quantity for one BOM tree line, matching batch explosion in
 * upright-server `lib/productionTree.js`:
 * convert the line into the component's stock unit first, then multiply
 * by the parent quantity (already in the parent's stock unit).
 *
 * `parentMultiplier` is null when an ancestor line could not be converted,
 * so this line's rolled-up total is unknown.
 *
 * Flags describe legacy rows the server would now reject on save: a unit
 * mismatch, a missing stock unit, or a quantity that is not a number.
 */
export function resolveBomTreeQuantity(line, component, parentMultiplier) {
  const stockUnit = normalizeUnit(component?.unit_of_measure);
  const enteredUnit = normalizeUnit(line?.unit_of_measure);
  const lineUnit = enteredUnit || stockUnit;
  const componentName = String(component?.name ?? "").trim() || "this item";

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
    const shown = String(rawQuantity ?? "").trim() || "blank";
    flags.push({
      code: "non_numeric",
      message: `Quantity isn't a number: this line says "${shown}", so it can't be scaled. Edit the BOM line and enter a number.`,
    });
  } else if (perParentStock == null) {
    const from = friendlyUnitLabel(lineUnit) || "unset";
    const to = friendlyUnitLabel(stockUnit) || "unset";
    flags.push({
      code: "unit_mismatch",
      message: `Unit mismatch: this line is in ${from}, but ${componentName} is stocked in ${to}, so it can't be scaled. Edit this BOM line or change the item's stock unit.`,
    });
  } else {
    if (!stockUnit && !enteredUnit) {
      flags.push({
        code: "missing_unit",
        message: `No unit: this line has no unit, and ${componentName} has no stock unit, so the quantity can't be tied to inventory. Add a unit on the BOM line or set the item's stock unit.`,
      });
    } else if (!stockUnit) {
      flags.push({
        code: "missing_stock_unit",
        message: `No stock unit: ${componentName} has no stock unit, so this line stays in ${friendlyUnitLabel(enteredUnit) || enteredUnit}. Set a stock unit on the item so quantities can be converted.`,
      });
    }
    if (!parentKnown) {
      flags.push({
        code: "parent_blocked",
        message:
          "This line can't be rolled up because a parent quantity couldn't be converted. Fix the warning on that parent line, then this amount can scale.",
      });
    }
  }

  const canRollUp = perParentStock != null && parentKnown;
  // Same conversion-then-scale as batch explosion and PR #1's helper.
  // A failed conversion stays null so children are not scaled by the raw line.
  const rolledUp = canRollUp
    ? componentStockMultiplier(rawQuantity, lineUnit, stockUnit, parentScale)
    : null;

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

/**
 * Where to fix a flagged line. The BOM editor and the stock unit both live
 * on the item page (`?edit=1` opens that editor).
 */
export function bomTreeFlagActions(flag, parentItem, component) {
  const parentId = parentItem?.id;
  const componentId = component?.id;
  const hasParent = parentId != null && String(parentId) !== "";
  const hasComponent = componentId != null && String(componentId) !== "";
  const sameItem = hasParent && hasComponent && String(parentId) === String(componentId);
  const actions = [];

  const bomFirst = flag?.code === "unit_mismatch" || flag?.code === "missing_unit" || flag?.code === "non_numeric";
  const stockFirst = flag?.code === "missing_stock_unit";
  const wantsBom = bomFirst || stockFirst;
  const wantsStock = flag?.code === "unit_mismatch" || flag?.code === "missing_unit" || flag?.code === "missing_stock_unit";

  const bomAction = hasParent
    ? { href: `/items/${parentId}?edit=1#edit-bom`, label: "Edit this BOM line" }
    : null;
  const stockAction = hasComponent && !sameItem
    ? {
        href: `/items/${componentId}?edit=1#edit-stock-unit`,
        label: "Change stock unit",
      }
    : null;

  if (stockFirst) {
    if (stockAction) actions.push(stockAction);
    if (bomAction) actions.push(bomAction);
  } else if (wantsBom) {
    if (bomAction) actions.push(bomAction);
    if (wantsStock && stockAction) actions.push(stockAction);
  }

  return actions;
}
