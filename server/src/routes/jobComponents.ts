import { createCrudRouter } from "./crudRouter.js";
import * as fn from "../functions/jobComponents.js";

export const jobComponentsRouter = createCrudRouter({
  list: fn.listJobComponents,
  getById: fn.getJobComponentById,
  create: fn.createJobComponent,
  update: fn.updateJobComponent,
  remove: fn.deleteJobComponent,
});
