import { createCrudRouter } from "./crudRouter.js";
import * as fn from "../functions/items.js";

export const itemsRouter = createCrudRouter({
  list: fn.listItems,
  getById: fn.getItemById,
  create: fn.createItem,
  update: fn.updateItem,
  remove: fn.deleteItem,
});
