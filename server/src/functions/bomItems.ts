import {
  deleteRow,
  getRow,
  insertRow,
  listRows,
  updateRow,
} from "../lib/tableCrud.js";

const TABLE = "bom_items";
const COLUMNS = [
  "bom_id",
  "component_item_id",
  "quantity_required",
  "unit_of_measure",
  "scrap_factor",
] as const;

export function listBomItems(): Promise<Record<string, unknown>[]> {
  return listRows(TABLE);
}

export function getBomItemById(id: number): Promise<Record<string, unknown> | null> {
  return getRow(TABLE, id);
}

export function createBomItem(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return insertRow(TABLE, body, COLUMNS);
}

export function updateBomItem(
  id: number,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return updateRow(TABLE, id, body, COLUMNS, false);
}

export function deleteBomItem(id: number): Promise<boolean> {
  return deleteRow(TABLE, id);
}
