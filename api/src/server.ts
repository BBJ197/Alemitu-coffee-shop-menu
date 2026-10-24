import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { createPool } from "./db";

const config = loadConfig();
const app = createApp(createPool(config.DATABASE_URL), {
  corsOrigin: config.CORS_ORIGIN,
});

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
