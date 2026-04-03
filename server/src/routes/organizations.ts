import { createCrudRouter } from "./crudRouter.js";
import * as fn from "../functions/organizations.js";

export const organizationsRouter = createCrudRouter({
  list: fn.listOrganizations,
  getById: fn.getOrganizationById,
  create: fn.createOrganization,
  update: fn.updateOrganization,
  remove: fn.deleteOrganization,
});
