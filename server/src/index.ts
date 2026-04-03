import "dotenv/config";
import { createApp } from "./app.js";
import { closePool } from "./db/pool.js";

const port = Number(process.env.PORT ?? 3001);

const app = createApp();
const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[api] Port ${port} is already in use. Stop the other Node process using it (e.g. another terminal running the API), or set PORT to a free port.`,
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}, closing server and database pool…`);
  server.close(() => {
    void closePool().then(() => process.exit(0));
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
