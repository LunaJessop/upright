import { createCrudRouter } from "./crudRouter.js";
import * as fn from "../functions/bomItems.js";

export const bomItemsRouter = createCrudRouter({
  list: fn.listBomItems,
  getById: fn.getBomItemById,
  create: fn.createBomItem,
  update: fn.updateBomItem,
  remove: fn.deleteBomItem,
});
