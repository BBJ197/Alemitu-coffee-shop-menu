// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import type { Db } from "./db";

function setup() {
  const query = vi.fn(async (text: string) => {
    if (text.includes("from sessions s join admins"))
      return { rows: [{ id: "a1", email: "boss@example.com" }] };
    if (text.includes("from categories"))
      return {
        rows: [
          {
            id: "c1",
            name_en: "Hot drinks",
            name_am: null,
            sort_order: 1,
            is_visible: true,
          },
          {
            id: "c2",
            name_en: "Seasonal",
            name_am: "x",
            sort_order: 2,
            is_visible: false,
          },
        ],
      };
    return { rows: [] };
  });
  const app = createApp({ query } as Db, {
    corsOrigin: "http://localhost:5173",
  });
  return { app, query };
}

describe("admin categories", () => {
  it("rejects anonymous requests without reading categories", async () => {
    const { app, query } = setup();
    const res = await app.request("/api/admin/categories");
    expect(res.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  it("lists every category, including hidden ones", async () => {
    const { app } = setup();
    const res = await app.request("/api/admin/categories", {
      headers: { cookie: "alemitu_session=test" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: "c1",
        nameEn: "Hot drinks",
        nameAm: null,
        sortOrder: 1,
        isVisible: true,
      },
      {
        id: "c2",
        nameEn: "Seasonal",
        nameAm: "x",
        sortOrder: 2,
        isVisible: false,
      },
    ]);
  });
});
