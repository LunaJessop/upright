import { createCrudRouter } from "./crudRouter.js";
import * as fn from "../functions/inventoryTransactions.js";

export const inventoryTransactionsRouter = createCrudRouter({
  list: fn.listInventoryTransactions,
  getById: fn.getInventoryTransactionById,
  create: fn.createInventoryTransaction,
  update: fn.updateInventoryTransaction,
  remove: fn.deleteInventoryTransaction,
});
