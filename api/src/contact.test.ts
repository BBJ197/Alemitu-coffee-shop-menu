// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import { ContactLimiter } from "./contact";
import type { Db } from "./db";

const origin = { corsOrigin: "http://localhost:5173" };
const valid = { name: "Abel", email: "abel@example.com", message: "Hello" };
const ID = "11111111-1111-4111-8111-111111111111";

function setup(extra: Parameters<typeof createApp>[1] = origin) {
  const query = vi.fn(async (text: string) => {
    if (text.startsWith("insert")) return { rows: [] };
    if (text.startsWith("delete")) return { rows: [{ id: ID }] };
    return { rows: [] };
  });
  return { query, app: createApp({ query } as Db, { ...origin, ...extra }) };
}

const post = (app: ReturnType<typeof setup>["app"], body: unknown, h = {}) =>
  app.request("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...h },
    body: JSON.stringify(body),
  });

describe("POST /api/contact", () => {
  it("saves the message and emails the owner", async () => {
    const notify = vi.fn(async () => {});
    const { app, query } = setup({ ...origin, notify });
    const res = await post(app, valid);
    expect(res.status).toBe(201);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("insert into contact_messages"),
      ["Abel", "abel@example.com", "Hello"],
    );
    expect(notify).toHaveBeenCalledWith(valid);
  });

  it("still succeeds when the email fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const notify = vi.fn(async () => {
      throw new Error("down");
    });
    const res = await post(setup({ ...origin, notify }).app, valid);
    expect(res.status).toBe(201);
  });

  it("rejects an invalid email and an empty message", async () => {
    const { app, query } = setup();
    const res = await post(app, { ...valid, email: "nope", message: " " });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.fields.email).toBeDefined();
    expect(body.fields.message).toBeDefined();
    expect(query).not.toHaveBeenCalled();
  });

  it("ignores bot submissions that fill the hidden field", async () => {
    const { app, query } = setup();
    const res = await post(app, { ...valid, website: "http://spam" });
    expect(res.status).toBe(200);
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects other origins", async () => {
    const res = await post(setup().app, valid, { origin: "http://evil.test" });
    expect(res.status).toBe(403);
  });

  it("limits how many messages one visitor can send", async () => {
    const { app } = setup({ ...origin, contactLimiter: new ContactLimiter(2) });
    expect((await post(app, valid)).status).toBe(201);
    expect((await post(app, valid)).status).toBe(201);
    expect((await post(app, valid)).status).toBe(429);
  });
});

describe("admin messages", () => {
  it("needs an admin session", async () => {
    const { app } = setup();
    expect((await app.request("/api/admin/messages")).status).toBe(401);
    const del = await app.request(`/api/admin/messages/${ID}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(401);
  });
});
