import {
  deleteRow,
  getRow,
  insertRow,
  listRows,
  updateRow,
} from "../lib/tableCrud.js";

const TABLE = "organizations";
const COLUMNS = ["name", "slug", "email", "phone", "active"] as const;

export function listOrganizations(): Promise<Record<string, unknown>[]> {
  return listRows(TABLE);
}

export function getOrganizationById(id: number): Promise<Record<string, unknown> | null> {
  return getRow(TABLE, id);
}

export function createOrganization(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return insertRow(TABLE, body, COLUMNS);
}

export function updateOrganization(
  id: number,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return updateRow(TABLE, id, body, COLUMNS, true);
}

export function deleteOrganization(id: number): Promise<boolean> {
  return deleteRow(TABLE, id);
}
