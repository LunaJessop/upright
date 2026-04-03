import {
  deleteRow,
  getRow,
  insertRow,
  listRows,
  updateRow,
} from "../lib/tableCrud.js";

const TABLE = "sales_orders";
const COLUMNS = [
  "organization_id",
  "customer_name",
  "customer_email",
  "status",
  "order_date",
  "shipping_date",
  "total",
  "created_by",
  "updated_by",
] as const;

export function listSalesOrders(): Promise<Record<string, unknown>[]> {
  return listRows(TABLE);
}

export function getSalesOrderById(id: number): Promise<Record<string, unknown> | null> {
  return getRow(TABLE, id);
}

export function createSalesOrder(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return insertRow(TABLE, body, COLUMNS);
}

export function updateSalesOrder(
  id: number,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return updateRow(TABLE, id, body, COLUMNS, true);
}

export function deleteSalesOrder(id: number): Promise<boolean> {
  return deleteRow(TABLE, id);
}
