// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import type { Db } from "./db";

const ORIGIN = "http://localhost:5173";
const CAT = "3f2b8c1e-5d4a-4b7e-9c1a-2e6f8a9b0c1d";
const ID = "9a7d6c5b-4e3f-4a2b-8c1d-0e9f8a7b6c5d";

const row = {
  id: ID,
  category_id: CAT,
  name_en: "Macchiato",
  name_am: null,
  description_en: null,
  description_am: null,
  price_etb: "55.00",
  image_path: null,
  is_available: true,
  is_featured: false,
  tag_ids: [],
};

type Result = { rows: Record<string, unknown>[] };

function setup(handler: (text: string) => Result = () => ({ rows: [] })) {
  const query = vi.fn(async (text: string, _params: unknown[] = []) => {
    if (text.includes("from sessions s join admins"))
      return { rows: [{ id: "a1", email: "boss@example.com" }] };
    return handler(text);
  });
  const app = createApp({ query } as Db, { corsOrigin: ORIGIN });
  const send = (
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ) =>
    app.request(`/api/admin/items${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
        cookie: "alemitu_session=test",
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const writes = () =>
    query.mock.calls.filter(([text]) => !/^\s*select/i.test(text));
  return { send, writes };
}

const good = {
  categoryId: CAT,
  nameEn: " Macchiato ",
  nameAm: "",
  priceEtb: 55,
};
const saved = (text: string): Result =>
  text.startsWith("with") ? { rows: [{ id: ID }] } : { rows: [row] };

describe("admin items: validation", () => {
  it("rejects a bad body with field messages and writes nothing", async () => {
    const { send, writes } = setup();
    const res = await send("POST", "", {
      categoryId: "nope",
      nameEn: "  ",
      priceEtb: 0,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("validation_failed");
    expect(Object.keys(body.fields)).toEqual(
      expect.arrayContaining(["categoryId", "nameEn", "priceEtb"]),
    );
    expect(writes()).toHaveLength(0);
  });

  it("rejects a price with more than 2 decimals", async () => {
    const { send } = setup();
    const res = await send("POST", "", { ...good, priceEtb: 10.001 });
    expect(res.status).toBe(400);
  });

  it("rejects a body that is not JSON", async () => {
    const { send } = setup();
    const res = await send("POST", "", undefined);
    expect(res.status).toBe(400);
  });
});

describe("admin items: writes", () => {
  it("creates an item with trimmed, normalised values", async () => {
    const { send, writes } = setup(saved);
    const res = await send("POST", "", good);
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ id: ID, priceEtb: 55 });
    const params = writes()[0]?.[1] as unknown[];
    expect(params[1]).toBe("Macchiato");
    expect(params[2]).toBeNull();
    expect(params[5]).toBe(55);
    expect(params[9]).toEqual([]);
  });

  it("returns 400 when the category or a tag does not exist", async () => {
    const { send } = setup((text) => {
      if (text.startsWith("with"))
        throw Object.assign(new Error("fk"), { code: "23503" });
      return { rows: [] };
    });
    const res = await send("POST", "", good);
    expect(res.status).toBe(400);
    expect((await res.json()).fields.categoryId).toBeDefined();
  });

  it("returns 404 for an id that is not a UUID, without touching the database", async () => {
    const { send, writes } = setup();
    expect((await send("PUT", "/not-a-uuid", good)).status).toBe(404);
    expect((await send("DELETE", "/not-a-uuid")).status).toBe(404);
    expect(writes()).toHaveLength(0);
  });

  it("returns 404 when updating a missing item", async () => {
    const { send } = setup(() => ({ rows: [] }));
    expect((await send("PUT", `/${ID}`, good)).status).toBe(404);
  });

  it("updates an existing item", async () => {
    const { send } = setup(saved);
    const res = await send("PUT", `/${ID}`, good);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: ID, nameEn: "Macchiato" });
  });

  it("toggles availability and validates the body", async () => {
    const { send } = setup(saved);
    expect(
      (await send("PATCH", `/${ID}/availability`, { isAvailable: "yes" }))
        .status,
    ).toBe(400);
    const res = await send("PATCH", `/${ID}/availability`, {
      isAvailable: false,
    });
    expect(res.status).toBe(200);
  });

  it("deletes an item, and returns 404 when it is gone", async () => {
    const gone = setup(() => ({ rows: [] }));
    expect((await gone.send("DELETE", `/${ID}`)).status).toBe(404);
    const there = setup(() => ({ rows: [{ id: ID }] }));
    expect((await there.send("DELETE", `/${ID}`)).status).toBe(204);
  });

  it("rejects a write from another origin", async () => {
    const { send, writes } = setup(saved);
    const res = await send("DELETE", `/${ID}`, undefined, {
      origin: "https://evil.example",
    });
    expect(res.status).toBe(403);
    expect(writes()).toHaveLength(0);
  });
});

describe("admin items: list", () => {
  it("lists items with numeric prices and tag ids", async () => {
    const { send } = setup(() => ({ rows: [row] }));
    const res = await send("GET", "");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      expect.objectContaining({
        nameEn: "Macchiato",
        priceEtb: 55,
        tagIds: [],
      }),
    ]);
  });
});
