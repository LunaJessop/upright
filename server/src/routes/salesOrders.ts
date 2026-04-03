import { createCrudRouter } from "./crudRouter.js";
import * as fn from "../functions/salesOrders.js";

export const salesOrdersRouter = createCrudRouter({
  list: fn.listSalesOrders,
  getById: fn.getSalesOrderById,
  create: fn.createSalesOrder,
  update: fn.updateSalesOrder,
  remove: fn.deleteSalesOrder,
});
