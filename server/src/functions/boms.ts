import {
  deleteRow,
  getRow,
  insertRow,
  listRows,
  updateRow,
} from "../lib/tableCrud.js";

const TABLE = "boms";
const COLUMNS = [
  "organization_id",
  "parent_item_id",
  "version",
  "is_active",
  "created_by",
] as const;

export function listBoms(): Promise<Record<string, unknown>[]> {
  return listRows(TABLE);
}

export function getBomById(id: number): Promise<Record<string, unknown> | null> {
  return getRow(TABLE, id);
}

export function createBom(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return insertRow(TABLE, body, COLUMNS);
}

export function updateBom(
  id: number,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return updateRow(TABLE, id, body, COLUMNS, false);
}

export function deleteBom(id: number): Promise<boolean> {
  return deleteRow(TABLE, id);
}
