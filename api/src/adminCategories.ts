import { Hono } from "hono";
import type { Db } from "./db";

/** Read-only for now: every category, including hidden ones. Writes arrive with the categories screen. */
export function adminCategories(db: Db) {
  const app = new Hono();

  app.get("/", async (c) => {
    const result = await db.query(
      "select id, name_en, name_am, sort_order, is_visible from categories order by sort_order, name_en",
    );
    return c.json(
      result.rows.map((r) => ({
        id: r.id,
        nameEn: r.name_en,
        nameAm: r.name_am,
        sortOrder: r.sort_order,
        isVisible: r.is_visible,
      })),
    );
  });

  return app;
}
