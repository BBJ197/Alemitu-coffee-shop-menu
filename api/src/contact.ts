import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "./db";
import type { Notify } from "./mailer";

type Row = Record<string, unknown>;

const contactInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email("Enter a valid email address")),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

/** At most `max` messages per visitor per window. Kept in memory. */
export class ContactLimiter {
  private hits = new Map<string, number[]>();
  constructor(
    private max = 5,
    private windowMs = 60 * 60 * 1000,
  ) {}

  /** Records the attempt and says whether it is allowed. */
  allow(key: string): boolean {
    const now = Date.now();
    const recent = (this.hits.get(key) ?? []).filter(
      (t) => now - t < this.windowMs,
    );
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}

export interface PublicContactOptions {
  corsOrigin: string;
  notify?: Notify;
  limiter?: ContactLimiter;
}

export function publicContact(db: Db, opts: PublicContactOptions) {
  const app = new Hono();
  const limiter = opts.limiter ?? new ContactLimiter();

  app.post("/", async (c) => {
    const origin = c.req.header("origin");
    if (origin && origin !== opts.corsOrigin)
      return c.json({ error: "forbidden" }, 403);

    const body = (await c.req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== "object")
      return c.json({ error: "validation_failed", fields: {} }, 400);

    // Hidden "website" field: only bots fill it in. Pretend it worked.
    if (typeof body.website === "string" && body.website.trim() !== "")
      return c.json({ ok: true });

    const parsed = contactInput.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: "validation_failed",
          fields: z.flattenError(parsed.error).fieldErrors,
        },
        400,
      );
    }

    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (!limiter.allow(ip)) return c.json({ error: "too_many_messages" }, 429);

    const { name, email, message } = parsed.data;
    await db.query(
      "insert into contact_messages (name, email, message) values ($1, $2, $3)",
      [name, email, message],
    );

    // The message is already saved; an email failure must not fail the request.
    if (opts.notify) {
      try {
        await opts.notify({ name, email, message });
      } catch (err) {
        console.error("Contact email failed:", err);
      }
    }
    return c.json({ ok: true }, 201);
  });

  return app;
}

const toMessage = (r: Row) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  message: r.message,
  isRead: r.is_read,
  createdAt: new Date(r.created_at as string | Date).toISOString(),
});

const isId = (value: string) => z.uuid().safeParse(value).success;

/** Mounted at /api/admin/messages, behind the admin session check. */
export function adminMessages(db: Db, corsOrigin: string) {
  const app = new Hono();

  app.use("*", async (c, next) => {
    const origin = c.req.header("origin");
    if (c.req.method !== "GET" && origin && origin !== corsOrigin)
      return c.json({ error: "forbidden" }, 403);
    await next();
  });

  app.get("/", async (c) => {
    const result = await db.query(
      `select id, name, email, message, is_read, created_at
         from contact_messages order by created_at desc limit 200`,
    );
    return c.json(result.rows.map(toMessage));
  });

  app.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = (await c.req.json().catch(() => null)) as {
      isRead?: unknown;
    } | null;
    if (!isId(id) || typeof body?.isRead !== "boolean")
      return c.json({ error: "validation_failed", fields: {} }, 400);
    const result = await db.query(
      `update contact_messages set is_read = $2 where id = $1
       returning id, name, email, message, is_read, created_at`,
      [id, body.isRead],
    );
    const row = result.rows[0];
    return row ? c.json(toMessage(row)) : c.json({ error: "not_found" }, 404);
  });

  app.delete("/:id", async (c) => {
    const id = c.req.param("id");
    if (!isId(id)) return c.json({ error: "not_found" }, 404);
    const result = await db.query(
      "delete from contact_messages where id = $1 returning id",
      [id],
    );
    return result.rows[0]
      ? c.json({ ok: true })
      : c.json({ error: "not_found" }, 404);
  });

  return app;
}
