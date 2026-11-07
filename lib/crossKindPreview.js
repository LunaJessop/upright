import { formatQuantity, friendlyUnitLabel } from "./formatQuantity.js";
import { formatMoney } from "./pricing.js";

function qty(value, unit) {
  if (value == null || value === "") return "—";
  return formatQuantity(value, unit);
}

function money(value) {
  if (value == null || value === "") return "—";
  return formatMoney(value);
}

function change(before, after) {
  return `${before} → ${after}`;
}

/** Stable list key. Labels repeat (two lots, two recipes), so the index is part of it. */
export function previewRowKey(title, row, index) {
  return `${title}-${index}-${row?.label ?? ""}`;
}

function countWord(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** One-line summary from the server's counts. */
export function summarizeCrossKindCounts(counts = {}) {
  const stock = Number(counts.stock) || 0;
  const recipes = Number(counts.recipes) || 0;
  const batches = Number(counts.batches) || 0;
  return [
    countWord(stock, "stock record", "stock records"),
    countWord(recipes, "recipe line", "recipe lines"),
    countWord(batches, "batch", "batches"),
  ].join(", ");
}

/**
 * Rows for the confirm step. Each row is a label and a before → after value.
 */
export function describeCrossKindPreview(preview = {}) {
  const from = preview.fromUnit;
  const to = preview.toUnit;
  const stock = preview.stock ?? {};
  const stockLines = [
    { label: "On hand", value: change(qty(stock.quantity?.before, from), qty(stock.quantity?.after, to)) },
  ];
  if (stock.goalMin?.before != null || stock.goalMin?.after != null) {
    stockLines.push({
      label: "Min",
      value: change(qty(stock.goalMin.before, from), qty(stock.goalMin.after, to)),
    });
  }
  if (stock.goalMax?.before != null || stock.goalMax?.after != null) {
    stockLines.push({
      label: "Max",
      value: change(qty(stock.goalMax.before, from), qty(stock.goalMax.after, to)),
    });
  }
  stockLines.push({
    label: "Unit cost",
    value: change(money(stock.unitCost?.before), money(stock.unitCost?.after)),
  });
  stockLines.push({
    label: "Sell price",
    value: change(money(stock.unitSellPrice?.before), money(stock.unitSellPrice?.after)),
  });
  stockLines.forEach((row, index) => {
    row.key = previewRowKey("Stock", row, index);
  });

  const lots = (stock.purchaseLots ?? []).map((lot, index) => {
    const row = {
      label: lot.lotNumber ? `Lot ${lot.lotNumber}` : "Purchase lot",
      value: `${change(qty(lot.quantity?.before, from), qty(lot.quantity?.after, to))} · ${change(money(lot.unitCost?.before), money(lot.unitCost?.after))}`,
    };
    row.key = previewRowKey("Purchase lots", row, index);
    return row;
  });

  const recipes = (preview.recipes ?? []).map((line, index) => {
    const row = {
      label: line.parentName || "Recipe",
      value: change(
        qty(line.before, line.unitBefore || from),
        qty(line.after, line.unitAfter || to)
      ),
    };
    row.key = previewRowKey("Recipes using this item", row, index);
    return row;
  });

  const ownRecipe = (preview.ownRecipe ?? []).map((line, index) => {
    const row = {
      label: line.componentName || "Ingredient",
      value: change(qty(line.before, line.unit), qty(line.after, line.unit)),
    };
    row.key = previewRowKey("This item's recipe", row, index);
    return row;
  });

  const batches = (preview.batches ?? []).map((batch, index) => {
    const name = batch.sku || `Batch ${batch.batchId}`;
    const role = batch.role === "finished" ? "finished good" : "ingredient";
    const row = {
      label: `${name} (${role})`,
      value: change(
        qty(batch.before, batch.unitBefore || from),
        qty(batch.after, batch.unitAfter || to)
      ),
    };
    row.key = previewRowKey("Batches", row, index);
    return row;
  });

  return {
    summary: summarizeCrossKindCounts(preview.counts),
    fromLabel: friendlyUnitLabel(from) || from || "",
    toLabel: friendlyUnitLabel(to) || to || "",
    stockLines,
    lots,
    recipes,
    ownRecipe,
    batches,
  };
}
