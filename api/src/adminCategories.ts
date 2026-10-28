import { Hono, type Context } from "hono";
import { z } from "zod";
import type { Db } from "./db";

type Row = Record<string, unknown>;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

const categoryInput = z.object({
  nameEn: z.string().trim().min(1, "Name is required").max(80),
  nameAm: optionalText(80),
  isVisible: z.boolean().default(true),
});

const orderInput = z.object({
  ids: z
    .array(z.uuid())
    .min(1)
    .max(200)
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate ids"),
});

const isId = (value: string) => z.uuid().safeParse(value).success;

const COUNT_SQL =
  "(select count(*)::int from items where category_id = categories.id)";

const toCategory = (r: Row) => ({
  id: r.id,
  nameEn: r.name_en,
  nameAm: r.name_am,
  sortOrder: r.sort_order,
  isVisible: r.is_visible,
  itemCount: Number(r.item_count ?? 0),
});

const invalid = (c: Context, error: z.ZodError) =>
  c.json(
    { error: "validation_failed", fields: z.flattenError(error).fieldErrors },
    400,
  );

const pgCode = (err: unknown) =>
  typeof err === "object" && err !== null && "code" in err
    ? (err as { code: unknown }).code
    : undefined;

async function listCategories(db: Db) {
  const result = await db.query(
    `select id, name_en, name_am, sort_order, is_visible, ${COUNT_SQL} as item_count
       from categories order by sort_order, name_en`,
  );
  return result.rows.map(toCategory);
}

export function adminCategories(db: Db, corsOrigin: string) {
  const app = new Hono();

  app.use("*", async (c, next) => {
    const origin = c.req.header("origin");
    if (c.req.method !== "GET" && origin && origin !== corsOrigin)
      return c.json({ error: "forbidden" }, 403);
    await next();
  });

  app.get("/", async (c) => c.json(await listCategories(db)));

  app.post("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (body === null) return c.json({ error: "invalid_json" }, 400);
    const parsed = categoryInput.safeParse(body);
    if (!parsed.success) return invalid(c, parsed.error);
    const created = await db.query(
      `insert into categories (name_en, name_am, sort_order, is_visible)
       values ($1, $2, (select coalesce(max(sort_order), 0) + 1 from categories), $3)
       returning id, name_en, name_am, sort_order, is_visible, 0 as item_count`,
      [parsed.data.nameEn, parsed.data.nameAm, parsed.data.isVisible],
    );
    return c.json(toCategory(created.rows[0] as Row), 201);
  });

  // Registered before "/:id" so "order" is never read as an id.
  app.put("/order", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = orderInput.safeParse(body);
    if (!parsed.success) return invalid(c, parsed.error);
    await db.query(
      `update categories c set sort_order = o.n
         from unnest($1::uuid[]) with ordinality as o(id, n)
        where c.id = o.id`,
      [parsed.data.ids],
    );
    return c.json(await listCategories(db));
  });

  app.put("/:id", async (c) => {
    const id = c.req.param("id");
    if (!isId(id)) return c.json({ error: "not_found" }, 404);
    const body = await c.req.json().catch(() => null);
    if (body === null) return c.json({ error: "invalid_json" }, 400);
    const parsed = categoryInput.safeParse(body);
    if (!parsed.success) return invalid(c, parsed.error);
    const updated = await db.query(
      `update categories set name_en = $2, name_am = $3, is_visible = $4
        where id = $1
        returning id, name_en, name_am, sort_order, is_visible, ${COUNT_SQL} as item_count`,
      [id, parsed.data.nameEn, parsed.data.nameAm, parsed.data.isVisible],
    );
    if (!updated.rows[0]) return c.json({ error: "not_found" }, 404);
    return c.json(toCategory(updated.rows[0]));
  });

  app.delete("/:id", async (c) => {
    const id = c.req.param("id");
    if (!isId(id)) return c.json({ error: "not_found" }, 404);
    try {
      const deleted = await db.query(
        "delete from categories where id = $1 returning id",
        [id],
      );
      if (!deleted.rows[0]) return c.json({ error: "not_found" }, 404);
      return c.body(null, 204);
    } catch (err) {
      // items.category_id is "on delete restrict": the category still has items.
      if (pgCode(err) === "23503")
        return c.json({ error: "category_in_use" }, 409);
      throw err;
    }
  });

  return app;
}
