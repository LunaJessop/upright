import {
  deleteRow,
  getRow,
  insertRow,
  listRows,
  updateRow,
} from "../lib/tableCrud.js";

const TABLE = "users";
const COLUMNS = [
  "organization_id",
  "name",
  "email",
  "password_hash",
  "role",
  "active",
] as const;

export function listUsers(): Promise<Record<string, unknown>[]> {
  return listRows(TABLE);
}

export function getUserById(id: number): Promise<Record<string, unknown> | null> {
  return getRow(TABLE, id);
}

export function createUser(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return insertRow(TABLE, body, COLUMNS);
}

export function updateUser(
  id: number,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return updateRow(TABLE, id, body, COLUMNS, true);
}

export function deleteUser(id: number): Promise<boolean> {
  return deleteRow(TABLE, id);
}
