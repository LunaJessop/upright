import {
  deleteRow,
  getRow,
  insertRow,
  listRows,
  updateRow,
} from "../lib/tableCrud.js";

const TABLE = "inventory";
const COLUMNS = ["organization_id", "item_id", "location_id", "quantity"] as const;

export function listInventory(): Promise<Record<string, unknown>[]> {
  return listRows(TABLE);
}

export function getInventoryById(id: number): Promise<Record<string, unknown> | null> {
  return getRow(TABLE, id);
}

export function createInventory(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return insertRow(TABLE, body, COLUMNS);
}

export function updateInventory(
  id: number,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return updateRow(TABLE, id, body, COLUMNS, true);
}

export function deleteInventory(id: number): Promise<boolean> {
  return deleteRow(TABLE, id);
}
