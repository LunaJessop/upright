import {
  deleteRow,
  getRow,
  insertRow,
  listRows,
  updateRow,
} from "../lib/tableCrud.js";

const TABLE = "job_components";
const COLUMNS = ["job_id", "item_id", "quantity_allocated", "unit_of_measure"] as const;

export function listJobComponents(): Promise<Record<string, unknown>[]> {
  return listRows(TABLE);
}

export function getJobComponentById(id: number): Promise<Record<string, unknown> | null> {
  return getRow(TABLE, id);
}

export function createJobComponent(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return insertRow(TABLE, body, COLUMNS);
}

export function updateJobComponent(
  id: number,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return updateRow(TABLE, id, body, COLUMNS, false);
}

export function deleteJobComponent(id: number): Promise<boolean> {
  return deleteRow(TABLE, id);
}
