import { formatQuantity, friendlyUnitLabel, readableQuantity } from "./formatQuantity.js";
import { formatMargin, formatMoney, isMakeItem } from "./pricing.js";

function finiteNumber(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatCount(value) {
  const rounded = Math.round(value * 10000) / 10000;
  if (Object.is(rounded, -0)) return "0";
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}

function unitWord(count) {
  return count === 1 ? "unit" : "units";
}

/**
 * Ingredient rate in the same everyday unit the quantity is shown in.
 * The line total stays the recorded cost. The rate is only for the equation.
 */
function materialEquation(component) {
  const allocated = finiteNumber(component.quantity_allocated);
  const chosen = readableQuantity(allocated, component.unit_of_measure);
  const shownQty = finiteNumber(chosen.quantity);
  const qtyLabel =
    shownQty == null
      ? formatQuantity(component.quantity_allocated, component.unit_of_measure)
      : formatQuantity(shownQty, chosen.unit);

  let rate = null;
  const snapshot = finiteNumber(component.unit_cost_snapshot);
  if (snapshot != null && allocated != null && shownQty != null && shownQty !== 0 && allocated !== 0) {
    rate = snapshot * (allocated / shownQty);
  }
  const lineCost = finiteNumber(component.line_cost);
  if (rate == null && lineCost != null && shownQty != null && shownQty !== 0) {
    rate = lineCost / shownQty;
  }

  const unitLabel = friendlyUnitLabel(chosen.unit) || chosen.unit || "";
  if (rate == null) return qtyLabel;
  const per = unitLabel ? `${formatMoney(rate)}/${unitLabel}` : formatMoney(rate);
  return `${qtyLabel} × ${per}`;
}

function buyMaterials(components) {
  if (!Array.isArray(components)) return [];
  return components.filter(
    (component) => !isMakeItem(component?.make_or_buy) && finiteNumber(component?.line_cost) != null
  );
}

/**
 * Receipt math for one batch.
 * Totals are the exact ingredient costs. Per-unit money is rounded only
 * when formatted, so a rounded rate times the unit count can differ by a cent
 * without changing the total.
 */
export function buildBatchReceipt({
  components,
  quantity,
  unitSell,
  projectedCost,
} = {}) {
  const materials = buyMaterials(components);
  const summed = materials.reduce(
    (sum, component) => sum + finiteNumber(component.line_cost),
    0
  );
  const fallbackCost = finiteNumber(projectedCost);
  const materialTotal = materials.length > 0 ? summed : (fallbackCost ?? 0);
  const units = finiteNumber(quantity);
  const zeroUnits = units == null || units <= 0;
  const sell = finiteNumber(unitSell);
  const sellMissing = sell == null;

  const materialLines = materials.map((component, index) => ({
    key: component.id ?? component.item_id ?? index,
    title: component.name || "Material",
    detail: materialEquation(component),
    amount: formatMoney(component.line_cost),
  }));

  const countLabel = zeroUnits ? null : `${formatCount(units)} ${unitWord(units)}`;
  const unitCostExact = !zeroUnits ? materialTotal / units : null;

  const materialCost = {
    title: "Material cost",
    detail: zeroUnits
      ? "No units on this batch"
      : `${formatMoney(unitCostExact)}/unit × ${countLabel}`,
    amount: formatMoney(materialTotal),
  };

  let revenueMessage = null;
  let sellLine = null;
  let materialDeduction = null;
  let profit = null;
  let margin = null;
  let revenueExact = null;
  let profitExact = null;
  let marginExact = null;

  if (zeroUnits) {
    revenueMessage = "No units on this batch";
  } else if (sellMissing) {
    revenueMessage = "Set a sell price to see revenue";
  } else {
    revenueExact = sell * units;
    profitExact = revenueExact - materialTotal;
    sellLine = {
      title: "Sell price",
      detail: `${formatMoney(sell)}/unit × ${countLabel}`,
      amount: formatMoney(revenueExact),
    };
    materialDeduction = {
      title: "− Material cost",
      detail: "",
      amount: `−${formatMoney(Math.abs(materialTotal))}`,
    };
    profit = {
      title: "Projected profit",
      detail: "",
      amount: formatMoney(profitExact),
    };
    if (revenueExact === 0) {
      margin = {
        title: "Profit margin",
        detail: "No revenue to measure margin",
        amount: "—",
      };
    } else {
      marginExact = profitExact / revenueExact;
      margin = {
        title: "Profit margin",
        detail: `${formatMoney(profitExact)} ÷ ${formatMoney(revenueExact)}`,
        amount: formatMargin(marginExact),
      };
    }
  }

  return {
    materialLines,
    materialTotal,
    unitCostExact,
    materialCost,
    zeroUnits,
    sellMissing,
    revenueMessage,
    sellLine,
    materialDeduction,
    profit,
    margin,
    revenueExact,
    profitExact,
    marginExact,
  };
}
