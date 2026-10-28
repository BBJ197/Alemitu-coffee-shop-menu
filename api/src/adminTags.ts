import { Hono, type Context } from "hono";
import { z } from "zod";
import type { Db } from "./db";

type Row = Record<string, unknown>;

const GROUPS = ["fasting", "diet", "temperature"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

const nameEn = z.string().trim().min(1, "Name is required").max(60);

const createInput = z.object({
  group: z.enum(GROUPS),
  nameEn,
  nameAm: optionalText(60),
});

const renameInput = z.object({ nameEn, nameAm: optionalText(60) });

const orderInput = z.object({
  ids: z
    .array(z.uuid())
    .min(1)
    .max(200)
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate ids"),
});

const isId = (value: string) => z.uuid().safeParse(value).success;

/** "Gluten free!" becomes "gluten-free". The slug is fixed once created. */
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const COUNT_SQL =
  "(select count(*)::int from item_tags where tag_id = tags.id)";
const COLUMNS = "id, slug, group_key, name_en, name_am, sort_order";

const toTag = (r: Row) => ({
  id: r.id,
  slug: r.slug,
  group: r.group_key,
  nameEn: r.name_en,
  nameAm: r.name_am,
  sortOrder: r.sort_order,
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

async function listTags(db: Db) {
  const result = await db.query(
    `select ${COLUMNS}, ${COUNT_SQL} as item_count
       from tags order by group_key, sort_order, name_en`,
  );
  return result.rows.map(toTag);
}

export function adminTags(db: Db, corsOrigin: string) {
  const app = new Hono();

  app.use("*", async (c, next) => {
    const origin = c.req.header("origin");
    if (c.req.method !== "GET" && origin && origin !== corsOrigin)
      return c.json({ error: "forbidden" }, 403);
    await next();
  });

  app.get("/", async (c) => c.json(await listTags(db)));

  app.post("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (body === null) return c.json({ error: "invalid_json" }, 400);
    const parsed = createInput.safeParse(body);
    if (!parsed.success) return invalid(c, parsed.error);
    const slug = slugify(parsed.data.nameEn);
    if (!slug)
      return c.json(
        {
          error: "validation_failed",
          fields: { nameEn: ["Use letters or numbers in the English name"] },
        },
        400,
      );
    try {
      const created = await db.query(
        `insert into tags (slug, group_key, name_en, name_am, sort_order)
         values ($1, $2, $3, $4,
           (select coalesce(max(sort_order), 0) + 1 from tags where group_key = $2))
         returning ${COLUMNS}, 0 as item_count`,
        [slug, parsed.data.group, parsed.data.nameEn, parsed.data.nameAm],
      );
      return c.json(toTag(created.rows[0] as Row), 201);
    } catch (err) {
      if (pgCode(err) === "23505")
        return c.json(
          {
            error: "validation_failed",
            fields: { nameEn: ["A tag with this name already exists"] },
          },
          400,
        );
      throw err;
    }
  });

  // Registered before "/:id" so "order" is never read as an id.
  app.put("/order", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = orderInput.safeParse(body);
    if (!parsed.success) return invalid(c, parsed.error);
    await db.query(
      `update tags t set sort_order = o.n
         from unnest($1::uuid[]) with ordinality as o(id, n)
        where t.id = o.id`,
      [parsed.data.ids],
    );
    return c.json(await listTags(db));
  });

  app.put("/:id", async (c) => {
    const id = c.req.param("id");
    if (!isId(id)) return c.json({ error: "not_found" }, 404);
    const body = await c.req.json().catch(() => null);
    if (body === null) return c.json({ error: "invalid_json" }, 400);
    const parsed = renameInput.safeParse(body);
    if (!parsed.success) return invalid(c, parsed.error);
    const updated = await db.query(
      `update tags set name_en = $2, name_am = $3
        where id = $1
        returning ${COLUMNS}, ${COUNT_SQL} as item_count`,
      [id, parsed.data.nameEn, parsed.data.nameAm],
    );
    if (!updated.rows[0]) return c.json({ error: "not_found" }, 404);
    return c.json(toTag(updated.rows[0]));
  });

  // item_tags rows go with the tag (on delete cascade); the screen warns first.
  app.delete("/:id", async (c) => {
    const id = c.req.param("id");
    if (!isId(id)) return c.json({ error: "not_found" }, 404);
    const deleted = await db.query(
      "delete from tags where id = $1 returning id",
      [id],
    );
    if (!deleted.rows[0]) return c.json({ error: "not_found" }, 404);
    return c.body(null, 204);
  });

  return app;
}
