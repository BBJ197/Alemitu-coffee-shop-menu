import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";

const base = { DATABASE_URL: "postgres://u:p@h/db" };

describe("loadConfig", () => {
  it("accepts local development defaults", () => {
    expect(loadConfig({ ...base }).CORS_ORIGIN).toBe("http://localhost:5173");
  });

  it("accepts a real origin in production", () => {
    const config = loadConfig({
      ...base,
      NODE_ENV: "production",
      CORS_ORIGIN: "https://alemitu.example",
    });
    expect(config.CORS_ORIGIN).toBe("https://alemitu.example");
  });

  it("rejects production without a real CORS_ORIGIN", () => {
    expect(() => loadConfig({ ...base, NODE_ENV: "production" })).toThrow(
      /CORS_ORIGIN/,
    );
  });

  it("rejects a real origin without NODE_ENV=production", () => {
    expect(() =>
      loadConfig({ ...base, CORS_ORIGIN: "https://alemitu.example" }),
    ).toThrow(/NODE_ENV/);
  });
});
