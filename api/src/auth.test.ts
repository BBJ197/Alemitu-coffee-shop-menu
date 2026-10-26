// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import { LoginLimiter, hashToken } from "./auth";
import type { Db } from "./db";
import { hashPassword } from "./password";

const ORIGIN = "http://localhost:5173";
const TOKEN_COOKIE = /alemitu_session=([^;]+)/;

async function setup() {
  const passwordHash = await hashPassword("a-very-long-password");
  const sessions = new Map<string, string>();
  const query = vi.fn(async (text: string) => {
    if (text.includes("from admins where email")) {
      return text.includes("'boss@example.com'")
        ? { rows: [{ id: "a1", password_hash: passwordHash }] }
        : { rows: [] };
    }
    if (text.startsWith("insert into sessions")) {
      const hash = /values \('([0-9a-f]+)'/.exec(text)?.[1] ?? "";
      sessions.set(hash, "a1");
      return { rows: [] };
    }
    if (text.includes("from sessions s join admins")) {
      const hash = /token_hash = '([0-9a-f]+)'/.exec(text)?.[1] ?? "";
      return sessions.has(hash)
        ? { rows: [{ id: "a1", email: "boss@example.com" }] }
        : { rows: [] };
    }
    if (text.startsWith("delete from sessions")) {
      const hash = /token_hash = '([0-9a-f]+)'/.exec(text)?.[1] ?? "";
      sessions.delete(hash);
      return { rows: [] };
    }
    return { rows: [] };
  });
  const app = createApp({ query } as Db, {
    corsOrigin: ORIGIN,
    limiter: new LoginLimiter(),
  });
  const login = (
    email: string,
    password: string,
    headers: Record<string, string> = {},
  ) =>
    app.request("/api/admin/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
        ...headers,
      },
      body: JSON.stringify({ email, password }),
    });
  return { app, login, sessions, query };
}

describe("admin login", () => {
  it("signs in with the right credentials and sets an HttpOnly cookie", async () => {
    const { login, sessions } = await setup();
    const res = await login("Boss@Example.com", "a-very-long-password");
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    const token = TOKEN_COOKIE.exec(cookie)?.[1] ?? "";
    expect(sessions.has(hashToken(token))).toBe(true);
    expect(sessions.has(token)).toBe(false);
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    const { login } = await setup();
    const wrong = await login("boss@example.com", "not-the-password");
    const unknown = await login("nobody@example.com", "a-very-long-password");
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(await wrong.json()).toEqual(await unknown.json());
    expect(wrong.headers.get("set-cookie")).toBeNull();
  });

  it("blocks after five failed attempts, even with the right password", async () => {
    const { login } = await setup();
    for (let i = 0; i < 5; i++)
      await login("boss@example.com", "bad-password-here");
    const res = await login("boss@example.com", "a-very-long-password");
    expect(res.status).toBe(429);
  });

  it("rejects a login from another origin", async () => {
    const { login } = await setup();
    const res = await login("boss@example.com", "a-very-long-password", {
      origin: "https://evil.example",
    });
    expect(res.status).toBe(403);
  });
});

describe("admin session", () => {
  it("rejects admin routes without a session", async () => {
    const { app } = await setup();
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
      const res = await app.request("/api/admin/items", { method });
      expect(res.status).toBe(401);
    }
    expect((await app.request("/api/admin/me")).status).toBe(401);
  });

  it("rejects a made-up session cookie", async () => {
    const { app } = await setup();
    const res = await app.request("/api/admin/me", {
      headers: { cookie: "alemitu_session=forged" },
    });
    expect(res.status).toBe(401);
  });

  it("accepts a real session, and logout ends it", async () => {
    const { app, login } = await setup();
    const cookie =
      (await login("boss@example.com", "a-very-long-password")).headers.get(
        "set-cookie",
      ) ?? "";
    const pair = `alemitu_session=${TOKEN_COOKIE.exec(cookie)?.[1]}`;
    const me = await app.request("/api/admin/me", {
      headers: { cookie: pair },
    });
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ email: "boss@example.com" });

    await app.request("/api/admin/logout", {
      method: "POST",
      headers: { cookie: pair },
    });
    expect(
      (await app.request("/api/admin/me", { headers: { cookie: pair } }))
        .status,
    ).toBe(401);
  });
});
