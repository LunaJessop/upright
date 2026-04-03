import { createCrudRouter } from "./crudRouter.js";
import * as fn from "../functions/salesOrderItems.js";

export const salesOrderItemsRouter = createCrudRouter({
  list: fn.listSalesOrderItems,
  getById: fn.getSalesOrderItemById,
  create: fn.createSalesOrderItem,
  update: fn.updateSalesOrderItem,
  remove: fn.deleteSalesOrderItem,
});
