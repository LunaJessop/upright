import {
  deleteRow,
  getRow,
  insertRow,
  listRows,
  updateRow,
} from "../lib/tableCrud.js";

const TABLE = "inventory_transactions";
const COLUMNS = [
  "organization_id",
  "item_id",
  "location_id",
  "quantity_change",
  "reason",
  "reference_type",
  "reference_id",
  "created_by",
] as const;

export function listInventoryTransactions(): Promise<Record<string, unknown>[]> {
  return listRows(TABLE);
}

export function getInventoryTransactionById(
  id: number,
): Promise<Record<string, unknown> | null> {
  return getRow(TABLE, id);
}

export function createInventoryTransaction(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return insertRow(TABLE, body, COLUMNS);
}

export function updateInventoryTransaction(
  id: number,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return updateRow(TABLE, id, body, COLUMNS, false);
}

export function deleteInventoryTransaction(id: number): Promise<boolean> {
  return deleteRow(TABLE, id);
}
