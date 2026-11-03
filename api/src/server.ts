import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { createPool } from "./db";
import { createNotifier } from "./mailer";

const config = loadConfig();
const app = createApp(createPool(config.DATABASE_URL), {
  corsOrigin: config.CORS_ORIGIN,
  secureCookies: process.env.NODE_ENV === "production",
  notify: createNotifier(
    config.RESEND_API_KEY && config.CONTACT_TO_EMAIL
      ? {
          apiKey: config.RESEND_API_KEY,
          to: config.CONTACT_TO_EMAIL,
          from: config.CONTACT_FROM_EMAIL,
        }
      : null,
  ),
});

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
