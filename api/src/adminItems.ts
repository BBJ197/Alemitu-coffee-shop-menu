import { Hono, type Context } from "hono";
import { z } from "zod";
import type { Db } from "./db";

type Row = Record<string, unknown>;

const twoDecimals = (n: number) =>
  Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

const optionalTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Use the format HH:MM")
  .nullish()
  .transform((v) => v ?? null);

export const itemInput = z
  .object({
    categoryId: z.uuid(),
    nameEn: z.string().trim().min(1, "Name is required").max(120),
    nameAm: optionalText(120),
    descriptionEn: optionalText(500),
    descriptionAm: optionalText(500),
    priceEtb: z
      .number()
      .positive("Price must be greater than 0")
      .max(100000, "Price is too high")
      .refine(twoDecimals, "Use at most 2 decimal places"),
    imagePath: optionalText(300),
    isAvailable: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    availableFrom: optionalTime,
    availableTo: optionalTime,
    tagIds: z
      .array(z.uuid())
      .max(20)
      .default([])
      .transform((ids) => [...new Set(ids)]),
  })
  .refine((v) => (v.availableFrom === null) === (v.availableTo === null), {
    message: "Set both times or neither",
    path: ["availableTo"],
  });

type ItemInput = z.output<typeof itemInput>;

const availabilityInput = z.object({ isAvailable: z.boolean() });
const isId = (value: string) => z.uuid().safeParse(value).success;

const ITEM_SELECT = `select i.id, i.category_id, i.name_en, i.name_am, i.description_en, i.description_am,
       i.price_etb, i.image_path, i.is_available, i.is_featured, i.available_from, i.available_to,
       coalesce(array_agg(it.tag_id) filter (where it.tag_id is not null), '{}') as tag_ids
  from items i left join item_tags it on it.item_id = i.id`;

// One statement each, so an item and its tags are saved together or not at all.
const CREATE_SQL = `with new_item as (
  insert into items (category_id, name_en, name_am, description_en, description_am,
                     price_etb, image_path, is_available, is_featured, available_from, available_to)
  values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  returning id
), new_tags as (
  insert into item_tags (item_id, tag_id)
  select new_item.id, t from new_item, unnest($12::uuid[]) as t
)
select id from new_item`;

const UPDATE_SQL = `with upd as (
  update items set category_id = $2, name_en = $3, name_am = $4, description_en = $5,
         description_am = $6, price_etb = $7, image_path = $8, is_available = $9,
         is_featured = $10, available_from = $11, available_to = $12
   where id = $1
  returning id
), removed as (
  delete from item_tags
   where item_id in (select id from upd) and tag_id <> all($13::uuid[])
), added as (
  insert into item_tags (item_id, tag_id)
  select upd.id, t from upd, unnest($13::uuid[]) as t
  on conflict do nothing
)
select id from upd`;

const toItem = (r: Row) => ({
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
  tagIds: (r.tag_ids as string[] | null) ?? [],
});

const itemParams = (v: ItemInput): unknown[] => [
  v.categoryId,
  v.nameEn,
  v.nameAm,
  v.descriptionEn,
  v.descriptionAm,
  v.priceEtb,
  v.imagePath,
  v.isAvailable,
  v.isFeatured,
  v.availableFrom,
  v.availableTo,
];

async function getItem(db: Db, id: string) {
  const result = await db.query(
    ITEM_SELECT + " where i.id = $1 group by i.id",
    [id],
  );
  return result.rows[0] ? toItem(result.rows[0]) : null;
}

const invalid = (c: Context, error: z.ZodError) =>
  c.json(
    { error: "validation_failed", fields: z.flattenError(error).fieldErrors },
    400,
  );

const pgCode = (err: unknown) =>
  typeof err === "object" && err !== null && "code" in err
    ? (err as { code: unknown }).code
    : undefined;

/** A foreign-key failure means the category or a tag does not exist. */
function writeFailed(c: Context, err: unknown) {
  if (pgCode(err) === "23503")
    return c.json(
      {
        error: "validation_failed",
        fields: { categoryId: ["That category or tag does not exist."] },
      },
      400,
    );
  throw err;
}

export function adminItems(db: Db, corsOrigin: string) {
  const app = new Hono();

  app.use("*", async (c, next) => {
    const origin = c.req.header("origin");
    if (c.req.method !== "GET" && origin && origin !== corsOrigin)
      return c.json({ error: "forbidden" }, 403);
    await next();
  });

  app.get("/", async (c) => {
    const result = await db.query(
      ITEM_SELECT + " group by i.id order by i.name_en",
    );
    return c.json(result.rows.map(toItem));
  });

  app.post("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (body === null) return c.json({ error: "invalid_json" }, 400);
    const parsed = itemInput.safeParse(body);
    if (!parsed.success) return invalid(c, parsed.error);
    try {
      const created = await db.query(CREATE_SQL, [
        ...itemParams(parsed.data),
        parsed.data.tagIds,
      ]);
      const item = await getItem(db, created.rows[0]?.id as string);
      return c.json(item, 201);
    } catch (err) {
      return writeFailed(c, err);
    }
  });

  app.put("/:id", async (c) => {
    const id = c.req.param("id");
    if (!isId(id)) return c.json({ error: "not_found" }, 404);
    const body = await c.req.json().catch(() => null);
    if (body === null) return c.json({ error: "invalid_json" }, 400);
    const parsed = itemInput.safeParse(body);
    if (!parsed.success) return invalid(c, parsed.error);
    try {
      const updated = await db.query(UPDATE_SQL, [
        id,
        ...itemParams(parsed.data),
        parsed.data.tagIds,
      ]);
      if (!updated.rows[0]) return c.json({ error: "not_found" }, 404);
      return c.json(await getItem(db, id));
    } catch (err) {
      return writeFailed(c, err);
    }
  });

  app.patch("/:id/availability", async (c) => {
    const id = c.req.param("id");
    if (!isId(id)) return c.json({ error: "not_found" }, 404);
    const body = await c.req.json().catch(() => null);
    const parsed = availabilityInput.safeParse(body);
    if (!parsed.success) return invalid(c, parsed.error);
    const updated = await db.query(
      "update items set is_available = $2 where id = $1 returning id",
      [id, parsed.data.isAvailable],
    );
    if (!updated.rows[0]) return c.json({ error: "not_found" }, 404);
    return c.json(await getItem(db, id));
  });

  app.delete("/:id", async (c) => {
    const id = c.req.param("id");
    if (!isId(id)) return c.json({ error: "not_found" }, 404);
    const deleted = await db.query(
      "delete from items where id = $1 returning id",
      [id],
    );
    if (!deleted.rows[0]) return c.json({ error: "not_found" }, 404);
    return c.body(null, 204);
  });

  return app;
}
