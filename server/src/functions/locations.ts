import {
  deleteRow,
  getRow,
  insertRow,
  listRows,
  updateRow,
} from "../lib/tableCrud.js";

const TABLE = "locations";
const COLUMNS = ["organization_id", "name", "type"] as const;

export function listLocations(): Promise<Record<string, unknown>[]> {
  return listRows(TABLE);
}

export function getLocationById(id: number): Promise<Record<string, unknown> | null> {
  return getRow(TABLE, id);
}

export function createLocation(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return insertRow(TABLE, body, COLUMNS);
}

export function updateLocation(
  id: number,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return updateRow(TABLE, id, body, COLUMNS, false);
}

export function deleteLocation(id: number): Promise<boolean> {
  return deleteRow(TABLE, id);
}
