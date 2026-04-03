import {
  deleteRow,
  getRow,
  insertRow,
  listRows,
  updateRow,
} from "../lib/tableCrud.js";

const TABLE = "items";
const COLUMNS = [
  "organization_id",
  "name",
  "sku",
  "description",
  "item_type",
  "make_or_buy",
  "unit_of_measure",
  "default_cost",
  "active",
  "created_by",
  "updated_by",
] as const;

export function listItems(): Promise<Record<string, unknown>[]> {
  return listRows(TABLE);
}

export function getItemById(id: number): Promise<Record<string, unknown> | null> {
  return getRow(TABLE, id);
}

export function createItem(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return insertRow(TABLE, body, COLUMNS);
}

export function updateItem(
  id: number,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return updateRow(TABLE, id, body, COLUMNS, true);
}

export function deleteItem(id: number): Promise<boolean> {
  return deleteRow(TABLE, id);
}
