// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { slugify } from "./adminTags";
import { createApp } from "./app";
import type { Db } from "./db";

const ORIGIN = "http://localhost:5173";
const ID = "9a7d6c5b-4e3f-4a2b-8c1d-0e9f8a7b6c5d";
const ID2 = "3f2b8c1e-5d4a-4b7e-9c1a-2e6f8a9b0c1d";

const row = {
  id: ID,
  slug: "hot",
  group_key: "temperature",
  name_en: "Hot",
  name_am: null,
  sort_order: 1,
  item_count: 4,
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
    app.request(`/api/admin/tags${path}`, {
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

describe("slugify", () => {
  it("makes a lowercase, hyphenated slug", () => {
    expect(slugify("Gluten free!")).toBe("gluten-free");
    expect(slugify("  Non-Fasting ")).toBe("non-fasting");
    expect(slugify("!!!")).toBe("");
  });
});

describe("admin tags", () => {
  it("rejects anonymous requests without reading tags", async () => {
    const { app, query } = setup();
    const res = await app.request("/api/admin/tags");
    expect(res.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  it("lists tags with the number of items using each", async () => {
    const { send } = setup(() => ({ rows: [row] }));
    const res = await send("GET", "");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: ID,
        slug: "hot",
        group: "temperature",
        nameEn: "Hot",
        nameAm: null,
        sortOrder: 1,
        itemCount: 4,
      },
    ]);
  });

  it("creates a tag with a slug made from its name", async () => {
    const { send, query } = setup(() => ({
      rows: [{ ...row, slug: "spicy", name_en: "Spicy", item_count: 0 }],
    }));
    const res = await send("POST", "", {
      group: "diet",
      nameEn: " Spicy ",
      nameAm: "",
    });
    expect(res.status).toBe(201);
    const insert = query.mock.calls.find(([t]) => /insert into tags/.test(t));
    expect(insert?.[1]).toEqual(["spicy", "diet", "Spicy", null]);
  });

  it("explains a missing name or unknown group and writes nothing", async () => {
    const { send, writes } = setup();
    const noName = await send("POST", "", { group: "diet", nameEn: "  " });
    expect(noName.status).toBe(400);
    expect((await noName.json()).fields.nameEn).toEqual(["Name is required"]);
    const badGroup = await send("POST", "", { group: "mood", nameEn: "Happy" });
    expect(badGroup.status).toBe(400);
    const noSlug = await send("POST", "", { group: "diet", nameEn: "!!!" });
    expect(noSlug.status).toBe(400);
    expect(writes()).toHaveLength(0);
  });

  it("explains a duplicate name", async () => {
    const { send } = setup(() => {
      throw Object.assign(new Error("dup"), { code: "23505" });
    });
    const res = await send("POST", "", { group: "diet", nameEn: "Vegetarian" });
    expect(res.status).toBe(400);
    expect((await res.json()).fields.nameEn).toEqual([
      "A tag with this name already exists",
    ]);
  });

  it("renames a tag without touching its slug or group", async () => {
    const { send, query } = setup(() => ({
      rows: [{ ...row, name_en: "Piping hot" }],
    }));
    const res = await send("PUT", `/${ID}`, {
      nameEn: "Piping hot",
      nameAm: "",
    });
    expect(res.status).toBe(200);
    const update = query.mock.calls.find(([t]) =>
      /update tags set name_en/.test(t),
    );
    expect(update?.[0]).toMatch(
      /set name_en = \$2, name_am = \$3\s+where id = \$1/,
    );
    expect(update?.[1]).toEqual([ID, "Piping hot", null]);
  });

  it("answers 404 for an unknown or malformed id", async () => {
    const { send } = setup();
    expect((await send("PUT", `/${ID}`, { nameEn: "x" })).status).toBe(404);
    expect((await send("PUT", "/nope", { nameEn: "x" })).status).toBe(404);
    expect((await send("DELETE", "/nope")).status).toBe(404);
    expect((await send("DELETE", `/${ID}`)).status).toBe(404);
  });

  it("saves a new order and rejects bad ones", async () => {
    const { send, query, writes } = setup(() => ({ rows: [row] }));
    expect((await send("PUT", "/order", { ids: [ID2, ID] })).status).toBe(200);
    const update = query.mock.calls.find(([t]) => /with ordinality/.test(t));
    expect(update?.[1]).toEqual([[ID2, ID]]);
    const before = writes().length;
    expect((await send("PUT", "/order", { ids: [ID, ID] })).status).toBe(400);
    expect((await send("PUT", "/order", { ids: [] })).status).toBe(400);
    expect(writes()).toHaveLength(before);
  });

  it("deletes a tag", async () => {
    const { send } = setup(() => ({ rows: [{ id: ID }] }));
    expect((await send("DELETE", `/${ID}`)).status).toBe(204);
  });

  it("blocks writes from another origin", async () => {
    const { send, writes } = setup();
    const res = await send(
      "POST",
      "",
      { group: "diet", nameEn: "x" },
      { origin: "http://evil.example" },
    );
    expect(res.status).toBe(403);
    expect(writes()).toHaveLength(0);
  });
});
