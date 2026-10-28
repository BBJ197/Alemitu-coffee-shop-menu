import type { Context } from "hono";
import {
  SESSION_COOKIE,
  getCookie,
  hashToken,
  type LoginLimiter,
} from "./auth";
import type { Db } from "./db";
import { hashPassword, verifyPassword } from "./password";

const MIN_LENGTH = 12;
const MAX_LENGTH = 200;

const sqlText = (value: string) => `'${value.replace(/'/g, "''")}'`;

export function changePassword(
  db: Db,
  opts: { corsOrigin: string; limiter: LoginLimiter },
) {
  return async (c: Context) => {
    const origin = c.req.header("origin");
    if (origin && origin !== opts.corsOrigin)
      return c.json({ error: "forbidden" }, 403);

    const admin = c.get("admin" as never) as { id: string };
    const body = (await c.req.json().catch(() => null)) as {
      currentPassword?: unknown;
      newPassword?: unknown;
    } | null;
    const current =
      typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const next = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!current || current.length > MAX_LENGTH || next.length > MAX_LENGTH)
      return c.json({ error: "invalid_request" }, 400);
    if (next.length < MIN_LENGTH)
      return c.json({ error: "weak_password" }, 400);
    if (next === current) return c.json({ error: "same_password" }, 400);

    const key = `password|${admin.id}`;
    if (opts.limiter.isBlocked(key))
      return c.json({ error: "too_many_attempts" }, 429);

    const result = await db.query(
      `select password_hash from admins where id = ${sqlText(admin.id)}`,
    );
    const stored = result.rows[0]?.password_hash;
    if (
      typeof stored !== "string" ||
      !(await verifyPassword(current, stored))
    ) {
      opts.limiter.recordFailure(key);
      return c.json({ error: "wrong_current_password" }, 403);
    }
    opts.limiter.reset(key);

    await db.query(
      `update admins set password_hash = ${sqlText(await hashPassword(next))} where id = ${sqlText(admin.id)}`,
    );
    // Sign out every other device; keep the one making this request.
    const keep = hashToken(getCookie(c, SESSION_COOKIE) ?? "");
    await db.query(
      `delete from sessions where admin_id = ${sqlText(admin.id)} and token_hash <> ${sqlText(keep)}`,
    );
    return c.json({ ok: true });
  };
}
