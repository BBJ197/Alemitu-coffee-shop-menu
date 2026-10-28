// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import { LoginLimiter } from "./auth";
import type { Db } from "./db";
import { hashPassword } from "./password";

const ORIGIN = "http://localhost:5173";
const OLD = "the-old-password-1";
const NEW = "a-brand-new-password";
const WRONG = "wrong-password-xx";
const TOKEN = /alemitu_session=([^;]+)/;

async function setup() {
  const state = { hash: await hashPassword(OLD) };
  const sessions = new Set<string>();
  const query = vi.fn(async (text: string, params: unknown[] = []) => {
    const [first, second] = params as string[];
    if (text.includes("from admins where email"))
      return first === "boss@example.com"
        ? { rows: [{ id: "a1", password_hash: state.hash }] }
        : { rows: [] };
    if (text.includes("from admins where id"))
      return { rows: [{ password_hash: state.hash }] };
    if (text.startsWith("update admins set password_hash")) {
      state.hash = first;
      return { rows: [] };
    }
    if (text.startsWith("insert into sessions")) {
      sessions.add(first);
      return { rows: [] };
    }
    if (text.includes("from sessions s join admins"))
      return sessions.has(first)
        ? { rows: [{ id: "a1", email: "boss@example.com" }] }
        : { rows: [] };
    if (text.startsWith("delete from sessions where admin_id")) {
      for (const hash of [...sessions])
        if (hash !== second) sessions.delete(hash);
      return { rows: [] };
    }
    return { rows: [] };
  });
  const app = createApp({ query } as Db, {
    corsOrigin: ORIGIN,
    limiter: new LoginLimiter(),
  });
  const json = { "content-type": "application/json", origin: ORIGIN };
  const login = (password: string) =>
    app.request("/api/admin/login", {
      method: "POST",
      headers: json,
      body: JSON.stringify({ email: "boss@example.com", password }),
    });
  const signIn = async () => {
    const res = await login(OLD);
    return `alemitu_session=${TOKEN.exec(res.headers.get("set-cookie") ?? "")?.[1]}`;
  };
  const change = (
    cookie: string,
    body: object,
    headers: Record<string, string> = {},
  ) =>
    app.request("/api/admin/password", {
      method: "POST",
      headers: { ...json, cookie, ...headers },
      body: JSON.stringify(body),
    });
  const me = (cookie: string) =>
    app.request("/api/admin/me", { headers: { cookie } });
  return { app, state, login, signIn, change, me };
}

describe("change password", () => {
  it("requires a session", async () => {
    const { app } = await setup();
    const res = await app.request("/api/admin/password", {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({ currentPassword: OLD, newPassword: NEW }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects a wrong current password and keeps the old one", async () => {
    const { signIn, change, state } = await setup();
    const before = state.hash;
    const res = await change(await signIn(), {
      currentPassword: WRONG,
      newPassword: NEW,
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "wrong_current_password" });
    expect(state.hash).toBe(before);
  });

  it("rejects a new password shorter than 12 characters", async () => {
    const { signIn, change } = await setup();
    const res = await change(await signIn(), {
      currentPassword: OLD,
      newPassword: "short",
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "weak_password" });
  });

  it("rejects reusing the current password", async () => {
    const { signIn, change } = await setup();
    const res = await change(await signIn(), {
      currentPassword: OLD,
      newPassword: OLD,
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "same_password" });
  });

  it("rejects a request from another origin", async () => {
    const { signIn, change } = await setup();
    const res = await change(
      await signIn(),
      { currentPassword: OLD, newPassword: NEW },
      { origin: "https://evil.example" },
    );
    expect(res.status).toBe(403);
  });

  it("changes the password: the new one signs in, the old one does not", async () => {
    const { signIn, change, login } = await setup();
    const res = await change(await signIn(), {
      currentPassword: OLD,
      newPassword: NEW,
    });
    expect(res.status).toBe(200);
    expect((await login(NEW)).status).toBe(200);
    expect((await login(OLD)).status).toBe(401);
  });

  it("signs out other devices but keeps this one", async () => {
    const { signIn, change, me } = await setup();
    const mine = await signIn();
    const other = await signIn();
    await change(mine, { currentPassword: OLD, newPassword: NEW });
    expect((await me(mine)).status).toBe(200);
    expect((await me(other)).status).toBe(401);
  });

  it("blocks after five wrong current passwords", async () => {
    const { signIn, change } = await setup();
    const cookie = await signIn();
    for (let i = 0; i < 5; i++)
      await change(cookie, { currentPassword: WRONG, newPassword: NEW });
    const res = await change(cookie, {
      currentPassword: OLD,
      newPassword: NEW,
    });
    expect(res.status).toBe(429);
  });
});
