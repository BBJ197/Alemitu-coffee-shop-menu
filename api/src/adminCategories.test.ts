// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import type { Db } from "./db";

const ORIGIN = "http://localhost:5173";
const ID = "9a7d6c5b-4e3f-4a2b-8c1d-0e9f8a7b6c5d";
const ID2 = "3f2b8c1e-5d4a-4b7e-9c1a-2e6f8a9b0c1d";

const row = {
  id: ID,
  name_en: "Hot drinks",
  name_am: null,
  sort_order: 1,
  is_visible: true,
  item_count: 3,
};

type Result = { rows: Record<string, unknown>[] };

function setup(
  handler: (text: string) => Result | Promise<Result> = () => ({ rows: [] }),
) {
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
    app.request(`/api/admin/categories${path}`, {
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
  return { app, query, send, writes };
}

describe("admin categories", () => {
  it("rejects anonymous requests without reading categories", async () => {
    const { app, query } = setup();
    const res = await app.request("/api/admin/categories");
    expect(res.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  it("lists every category with its item count, hidden ones included", async () => {
    const { send } = setup(() => ({
      rows: [
        row,
        {
          ...row,
          id: ID2,
          name_en: "Seasonal",
          is_visible: false,
          item_count: 0,
        },
      ],
    }));
    const res = await send("GET", "");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: ID,
        nameEn: "Hot drinks",
        nameAm: null,
        sortOrder: 1,
        isVisible: true,
        itemCount: 3,
      },
      {
        id: ID2,
        nameEn: "Seasonal",
        nameAm: null,
        sortOrder: 1,
        isVisible: false,
        itemCount: 0,
      },
    ]);
  });

  it("creates a category at the end of the list", async () => {
    const { send, query } = setup(() => ({
      rows: [{ ...row, item_count: 0 }],
    }));
    const res = await send("POST", "", {
      nameEn: " Hot drinks ",
      nameAm: "",
      isVisible: true,
    });
    expect(res.status).toBe(201);
    expect((await res.json()).itemCount).toBe(0);
    const insert = query.mock.calls.find(([t]) =>
      /insert into categories/.test(t),
    );
    expect(insert?.[1]).toEqual(["Hot drinks", null, true]);
  });

  it("explains a missing name and writes nothing", async () => {
    const { send, writes } = setup();
    const res = await send("POST", "", { nameEn: "   " });
    expect(res.status).toBe(400);
    expect((await res.json()).fields.nameEn).toEqual(["Name is required"]);
    expect(writes()).toHaveLength(0);
  });

  it("renames and hides a category", async () => {
    const { send, query } = setup(() => ({
      rows: [{ ...row, name_en: "Coffee", is_visible: false }],
    }));
    const res = await send("PUT", `/${ID}`, {
      nameEn: "Coffee",
      nameAm: "Kaffe",
      isVisible: false,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).isVisible).toBe(false);
    const update = query.mock.calls.find(([t]) =>
      /update categories set name_en/.test(t),
    );
    expect(update?.[1]).toEqual([ID, "Coffee", "Kaffe", false]);
  });

  it("answers 404 for an unknown or malformed id", async () => {
    const { send } = setup();
    expect((await send("PUT", `/${ID}`, { nameEn: "x" })).status).toBe(404);
    expect((await send("PUT", "/nope", { nameEn: "x" })).status).toBe(404);
    expect((await send("DELETE", "/nope")).status).toBe(404);
  });

  it("saves a new order from the full list of ids", async () => {
    const { send, query } = setup(() => ({ rows: [row] }));
    const res = await send("PUT", "/order", { ids: [ID2, ID] });
    expect(res.status).toBe(200);
    const update = query.mock.calls.find(([t]) => /with ordinality/.test(t));
    expect(update?.[1]).toEqual([[ID2, ID]]);
  });

  it("rejects an order with duplicate or invalid ids", async () => {
    const { send, writes } = setup();
    expect((await send("PUT", "/order", { ids: [ID, ID] })).status).toBe(400);
    expect((await send("PUT", "/order", { ids: ["x"] })).status).toBe(400);
    expect((await send("PUT", "/order", { ids: [] })).status).toBe(400);
    expect(writes()).toHaveLength(0);
  });

  it("deletes an empty category", async () => {
    const { send } = setup(() => ({ rows: [{ id: ID }] }));
    expect((await send("DELETE", `/${ID}`)).status).toBe(204);
  });

  it("refuses to delete a category that still has items", async () => {
    const { send } = setup(() => {
      throw Object.assign(new Error("fk"), { code: "23503" });
    });
    const res = await send("DELETE", `/${ID}`);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "category_in_use" });
  });

  it("blocks writes from another origin", async () => {
    const { send, writes } = setup();
    const res = await send(
      "POST",
      "",
      { nameEn: "x" },
      { origin: "http://evil.example" },
    );
    expect(res.status).toBe(403);
    expect(writes()).toHaveLength(0);
  });
});
