import { createCrudRouter } from "./crudRouter.js";
import * as fn from "../functions/boms.js";

export const bomsRouter = createCrudRouter({
  list: fn.listBoms,
  getById: fn.getBomById,
  create: fn.createBom,
  update: fn.updateBom,
  remove: fn.deleteBom,
});
