// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import type { Db } from "./db";

function fakeDb() {
  const query = vi.fn(async (text: string) => {
    if (text.includes("item_tags"))
      return { rows: [{ item_id: "i1", tag_id: "t1" }] };
    if (text.includes("from items")) {
      return {
        rows: [
          {
            id: "i1",
            category_id: "c1",
            name_en: "Macchiato",
            name_am: null,
            description_en: null,
            description_am: null,
            price_etb: "55.00",
            image_path: null,
            is_available: false,
            is_featured: false,
          },
        ],
      };
    }
    if (text.includes("from tags")) {
      return {
        rows: [
          {
            id: "t1",
            slug: "hot",
            group_key: "temperature",
            name_en: "Hot",
            name_am: null,
          },
        ],
      };
    }
    return {
      rows: [{ id: "c1", name_en: "Hot drinks", name_am: null, sort_order: 1 }],
    };
  });
  return { db: { query } as Db, query };
}

const origin = { corsOrigin: "http://localhost:5173" };

describe("public API", () => {
  it("reports health", async () => {
    const res = await createApp(fakeDb().db, origin).request("/api/health");
    expect(res.status).toBe(200);
  });

  it("returns the menu with numeric prices, unavailable items and tag links", async () => {
    const res = await createApp(fakeDb().db, origin).request("/api/menu");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.categories).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      nameEn: "Macchiato",
      priceEtb: 55,
      isAvailable: false,
      tagIds: ["t1"],
    });
    expect(body.tags[0].slug).toBe("hot");
  });
});

describe("anonymous access", () => {
  it.each(["GET", "POST", "PUT", "PATCH", "DELETE"])(
    "rejects %s on admin routes",
    async (method) => {
      const { db, query } = fakeDb();
      const res = await createApp(db, origin).request("/api/admin/items", {
        method,
      });
      expect(res.status).toBe(401);
      expect(query).not.toHaveBeenCalled();
    },
  );

  it.each(["POST", "PUT", "DELETE"])(
    "has no public %s on the menu",
    async (method) => {
      const { db, query } = fakeDb();
      const res = await createApp(db, origin).request("/api/menu", { method });
      expect(res.status).toBe(404);
      expect(query).not.toHaveBeenCalled();
    },
  );
});
