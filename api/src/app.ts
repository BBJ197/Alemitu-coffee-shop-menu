import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  LoginLimiter,
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  endSession,
  getCookie,
  requireAdmin,
  setSessionCookie,
} from "./auth";
import type { Db } from "./db";
import { adminCategories } from "./adminCategories";
import { adminItems } from "./adminItems";
import { changePassword } from "./changePassword";
import { hashPassword, verifyPassword } from "./password";

type Row = Record<string, unknown>;

export interface AppOptions {
  corsOrigin: string;
  secureCookies?: boolean;
  limiter?: LoginLimiter;
}

export function createApp(db: Db, opts: AppOptions) {
  const app = new Hono();
  const limiter = opts.limiter ?? new LoginLimiter();
  const secure = opts.secureCookies ?? false;
  let dummyHash: Promise<string> | undefined;

  app.use(
    "/api/*",
    cors({
      origin: opts.corsOrigin,
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    }),
  );

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

  app.post("/api/admin/login", async (c) => {
    const origin = c.req.header("origin");
    if (origin && origin !== opts.corsOrigin)
      return c.json({ error: "forbidden" }, 403);

    const body = (await c.req.json().catch(() => null)) as {
      email?: unknown;
      password?: unknown;
    } | null;
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!email || !password || email.length > 254 || password.length > 200) {
      return c.json({ error: "invalid_credentials" }, 401);
    }

    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const key = `${ip}|${email}`;
    if (limiter.isBlocked(key))
      return c.json({ error: "too_many_attempts" }, 429);

    const result = await db.query(
      "select id, password_hash from admins where email = $1",
      [email],
    );
    const admin = result.rows[0];
    dummyHash ??= hashPassword("dummy-password-for-timing");
    const ok = await verifyPassword(
      password,
      admin ? (admin.password_hash as string) : await dummyHash,
    );

    if (!admin || !ok) {
      limiter.recordFailure(key);
      return c.json({ error: "invalid_credentials" }, 401);
    }

    limiter.reset(key);
    setSessionCookie(c, await createSession(db, admin.id as string), secure);
    return c.json({ email });
  });

  app.post("/api/admin/logout", async (c) => {
    await endSession(db, getCookie(c, SESSION_COOKIE));
    clearSessionCookie(c);
    return c.json({ ok: true });
  });

  // Everything else under /api/admin needs a valid session. Write routes arrive in M5.
  app.use("/api/admin/*", requireAdmin(db));

  app.get("/api/admin/me", (c) =>
    c.json({ email: (c.get("admin" as never) as { email: string }).email }),
  );

  app.post(
    "/api/admin/password",
    changePassword(db, { corsOrigin: opts.corsOrigin, limiter }),
  );

  app.route("/api/admin/categories", adminCategories(db, opts.corsOrigin));
  app.route("/api/admin/items", adminItems(db, opts.corsOrigin));

  app.notFound((c) => c.json({ error: "not_found" }, 404));
  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "server_error" }, 500);
  });

  return app;
}
