import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile("api/.env");
} catch {
  // No local api/.env (CI sets variables directly).
}

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:5173", trace: "retain-on-failure" },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: [
    {
      command: "npm start",
      cwd: "api",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: !process.env.CI,
      env: {
        ...(process.env as Record<string, string>),
        CORS_ORIGIN: "http://localhost:5173",
      },
    },
    {
      command: "npm run dev -- --port 5173 --strictPort",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
