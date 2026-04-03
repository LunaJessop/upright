import { createCrudRouter } from "./crudRouter.js";
import * as fn from "../functions/users.js";

export const usersRouter = createCrudRouter({
  list: fn.listUsers,
  getById: fn.getUserById,
  create: fn.createUser,
  update: fn.updateUser,
  remove: fn.deleteUser,
});
