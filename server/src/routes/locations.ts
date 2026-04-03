import { createCrudRouter } from "./crudRouter.js";
import * as fn from "../functions/locations.js";

export const locationsRouter = createCrudRouter({
  list: fn.listLocations,
  getById: fn.getLocationById,
  create: fn.createLocation,
  update: fn.updateLocation,
  remove: fn.deleteLocation,
});
