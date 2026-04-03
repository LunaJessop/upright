import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { bomItemsRouter } from "./routes/bomItems.js";
import { bomsRouter } from "./routes/boms.js";
import { inventoryRouter } from "./routes/inventory.js";
import { inventoryTransactionsRouter } from "./routes/inventoryTransactions.js";
import { itemsRouter } from "./routes/items.js";
import { jobComponentsRouter } from "./routes/jobComponents.js";
import { jobsRouter } from "./routes/jobs.js";
import { locationsRouter } from "./routes/locations.js";
import { organizationsRouter } from "./routes/organizations.js";
import { salesOrderItemsRouter } from "./routes/salesOrderItems.js";
import { salesOrdersRouter } from "./routes/salesOrders.js";
import { usersRouter } from "./routes/users.js";

export function createApp(): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/organizations", organizationsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/items", itemsRouter);
  app.use("/api/boms", bomsRouter);
  app.use("/api/bom-items", bomItemsRouter);
  app.use("/api/locations", locationsRouter);
  app.use("/api/inventory", inventoryRouter);
  app.use("/api/inventory-transactions", inventoryTransactionsRouter);
  app.use("/api/sales-orders", salesOrdersRouter);
  app.use("/api/sales-order-items", salesOrderItemsRouter);
  app.use("/api/jobs", jobsRouter);
  app.use("/api/job-components", jobComponentsRouter);

  app.use(errorHandler);
  return app;
}
