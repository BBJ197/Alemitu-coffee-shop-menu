import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import type { Db } from "./db";

/** Photos are resized to a few hundred kB in the browser; this is the hard cap. */
export const MAX_IMAGE_BYTES = 400_000;

const isId = (value: string) => z.uuid().safeParse(value).success;

/** A WebP file starts with "RIFF", four size bytes, then "WEBP". */
export function looksLikeWebp(bytes: Uint8Array): boolean {
  const text = (from: number, to: number) =>
    String.fromCharCode(...bytes.subarray(from, to));
  return bytes.length > 12 && text(0, 4) === "RIFF" && text(8, 12) === "WEBP";
}

/** Public: customers' browsers load photos from here. */
export function publicImages(db: Db) {
  const app = new Hono();

  app.get("/:id", async (c) => {
    const id = c.req.param("id");
    if (!isId(id)) return c.json({ error: "not_found" }, 404);
    const result = await db.query("select data from images where id = $1", [
      id,
    ]);
    const data = result.rows[0]?.data;
    if (!data) return c.json({ error: "not_found" }, 404);
    // An image never changes once stored (a replacement gets a new id).
    return new Response(new Uint8Array(data as Buffer), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });

  return app;
}

/** Admin only: upload one WebP image and get back the path to store on an item. */
export function adminImages(db: Db, corsOrigin: string) {
  const app = new Hono();

  app.use("*", async (c, next) => {
    const origin = c.req.header("origin");
    if (origin && origin !== corsOrigin)
      return c.json({ error: "forbidden" }, 403);
    await next();
  });

  app.post(
    "/",
    bodyLimit({
      maxSize: MAX_IMAGE_BYTES,
      onError: (c) => c.json({ error: "too_large" }, 413),
    }),
    async (c) => {
      const bytes = new Uint8Array(await c.req.arrayBuffer());
      if (bytes.length === 0) return c.json({ error: "empty" }, 400);
      if (!looksLikeWebp(bytes))
        return c.json({ error: "unsupported_type" }, 415);

      const created = await db.query(
        `insert into images (content_type, byte_size, data)
         values ('image/webp', $1, $2) returning id`,
        [bytes.length, Buffer.from(bytes)],
      );
      const id = created.rows[0]?.id as string;

      // Tidy up photos nobody uses any more (removed or replaced, or never saved).
      // The one-hour grace keeps a photo that is uploaded but not yet saved.
      try {
        await db.query(
          `delete from images
            where created_at < now() - interval '1 hour'
              and not exists (
                select 1 from items where image_path = '/api/images/' || images.id::text
              )`,
        );
      } catch (err) {
        console.error("image cleanup failed", err);
      }

      return c.json({ path: `/api/images/${id}` }, 201);
    },
  );

  return app;
}
