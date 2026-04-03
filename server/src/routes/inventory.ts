import { createCrudRouter } from "./crudRouter.js";
import * as fn from "../functions/inventory.js";

export const inventoryRouter = createCrudRouter({
  list: fn.listInventory,
  getById: fn.getInventoryById,
  create: fn.createInventory,
  update: fn.updateInventory,
  remove: fn.deleteInventory,
});
