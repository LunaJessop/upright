import { normalizeUnit } from "./units.js";

/**
 * Unit for a batch component's quantity_allocated and unit_cost_snapshot.
 *
 * Both numbers are in the component's stock unit. The component's
 * unit_of_measure on the batch is the recipe unit saved at create time,
 * which can be a different unit of the same kind: 16 oz of an item stocked
 * in lb is stored as quantity 1 with unit_of_measure "oz".
 *
 * An open batch cannot change that stock unit, so the catalog unit is still
 * the one those numbers are in. A finished or cancelled batch can change
 * unit later, and the row does not keep the original stock unit, so the
 * recorded recipe unit stays the label.
 */
export function allocationQuantityUnit({
  batchStatus,
  recordedUnit,
  stockUnit,
}) {
  const recorded = normalizeUnit(recordedUnit);
  const stock = normalizeUnit(stockUnit);
  const open = batchStatus === "planned" || batchStatus === "in_progress";
  if (open && stock) return stock;
  return recorded || stock || "";
}
