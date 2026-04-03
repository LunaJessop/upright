import {
  deleteRow,
  getRow,
  insertRow,
  listRows,
  updateRow,
} from "../lib/tableCrud.js";

const TABLE = "jobs";
const COLUMNS = [
  "organization_id",
  "item_id",
  "bom_id",
  "quantity",
  "status",
  "start_date",
  "end_date",
  "created_by",
  "updated_by",
] as const;

export function listJobs(): Promise<Record<string, unknown>[]> {
  return listRows(TABLE);
}

export function getJobById(id: number): Promise<Record<string, unknown> | null> {
  return getRow(TABLE, id);
}

export function createJob(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return insertRow(TABLE, body, COLUMNS);
}

export function updateJob(
  id: number,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return updateRow(TABLE, id, body, COLUMNS, true);
}

export function deleteJob(id: number): Promise<boolean> {
  return deleteRow(TABLE, id);
}
