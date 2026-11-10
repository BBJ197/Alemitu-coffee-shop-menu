import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  // Optional: email each contact message to the owner (via resend.com).
  RESEND_API_KEY: z.string().optional(),
  CONTACT_TO_EMAIL: z.string().optional(),
  CONTACT_FROM_EMAIL: z
    .string()
    .default("Alemitu Coffee <onboarding@resend.dev>"),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const config = schema.parse(env);
  const isLocal = /localhost|127\.0\.0\.1/.test(config.CORS_ORIGIN);
  if (env.NODE_ENV === "production" && isLocal) {
    throw new Error(
      "CORS_ORIGIN must be set to your real site URL when NODE_ENV=production.",
    );
  }
  if (env.NODE_ENV !== "production" && !isLocal) {
    throw new Error(
      "CORS_ORIGIN is a real site, so set NODE_ENV=production (otherwise session cookies are not secure).",
    );
  }
  return config;
}
