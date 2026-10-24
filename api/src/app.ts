import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Db } from "./db";

type Row = Record<string, unknown>;

export function createApp(db: Db, opts: { corsOrigin: string }) {
  const app = new Hono();

  app.use("/api/*", cors({ origin: opts.corsOrigin, allowMethods: ["GET"] }));

  app.get("/api/health", (c) => c.json({ ok: true }));

  app.get("/api/menu", async (c) => {
    const [cats, items, tags, links] = await Promise.all([
      db.query(
        "select id, name_en, name_am, sort_order from categories where is_visible order by sort_order, name_en",
      ),
      db.query(
        `select i.id, i.category_id, i.name_en, i.name_am, i.description_en, i.description_am,
                i.price_etb, i.image_path, i.is_available, i.is_featured, i.available_from, i.available_to
           from items i join categories c on c.id = i.category_id
          where c.is_visible order by i.name_en`,
      ),
      db.query(
        "select id, slug, group_key, name_en, name_am, sort_order from tags order by group_key, sort_order",
      ),
      db.query(
        `select it.item_id, it.tag_id from item_tags it
           join items i on i.id = it.item_id
           join categories c on c.id = i.category_id
          where c.is_visible`,
      ),
    ]);

    const tagIdsByItem = new Map<string, string[]>();
    for (const l of links.rows) {
      const list = tagIdsByItem.get(l.item_id as string) ?? [];
      list.push(l.tag_id as string);
      tagIdsByItem.set(l.item_id as string, list);
    }

    c.header("Cache-Control", "public, max-age=30");
    return c.json({
      categories: cats.rows.map((r: Row) => ({
        id: r.id,
        nameEn: r.name_en,
        nameAm: r.name_am,
        sortOrder: r.sort_order,
      })),
      items: items.rows.map((r: Row) => ({
        id: r.id,
        categoryId: r.category_id,
        nameEn: r.name_en,
        nameAm: r.name_am,
        descriptionEn: r.description_en,
        descriptionAm: r.description_am,
        priceEtb: Number(r.price_etb),
        imagePath: r.image_path,
        isAvailable: r.is_available,
        isFeatured: r.is_featured,
        availableFrom: r.available_from,
        availableTo: r.available_to,
        tagIds: tagIdsByItem.get(r.id as string) ?? [],
      })),
      tags: tags.rows.map((r: Row) => ({
        id: r.id,
        slug: r.slug,
        group: r.group_key,
        nameEn: r.name_en,
        nameAm: r.name_am,
      })),
    });
  });

  // Placeholder until real login (M4): every admin request is rejected.
  app.all("/api/admin/*", (c) => c.json({ error: "unauthorized" }, 401));

  app.notFound((c) => c.json({ error: "not_found" }, 404));
  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "server_error" }, 500);
  });

  return app;
}
