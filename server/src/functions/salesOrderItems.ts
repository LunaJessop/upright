import {
  deleteRow,
  getRow,
  insertRow,
  listRows,
  updateRow,
} from "../lib/tableCrud.js";

const TABLE = "sales_order_items";
const COLUMNS = ["sales_order_id", "item_id", "quantity", "unit_price", "total"] as const;

export function listSalesOrderItems(): Promise<Record<string, unknown>[]> {
  return listRows(TABLE);
}

export function getSalesOrderItemById(id: number): Promise<Record<string, unknown> | null> {
  return getRow(TABLE, id);
}

export function createSalesOrderItem(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return insertRow(TABLE, body, COLUMNS);
}

export function updateSalesOrderItem(
  id: number,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return updateRow(TABLE, id, body, COLUMNS, false);
}

export function deleteSalesOrderItem(id: number): Promise<boolean> {
  return deleteRow(TABLE, id);
}
