import { createCrudRouter } from "./crudRouter.js";
import * as fn from "../functions/jobs.js";

export const jobsRouter = createCrudRouter({
  list: fn.listJobs,
  getById: fn.getJobById,
  create: fn.createJob,
  update: fn.updateJob,
  remove: fn.deleteJob,
});
