import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  return schema.parse(env);
}
