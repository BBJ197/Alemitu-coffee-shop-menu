import { createHash, randomBytes } from "node:crypto";
import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Db } from "./db";

export const SESSION_COOKIE = "alemitu_session";
const SESSION_DAYS = 7;
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export interface Admin {
  id: string;
  email: string;
}

export async function createSession(db: Db, adminId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.query(
    `insert into sessions (token_hash, admin_id, expires_at)
     values ($1, $2, now() + make_interval(days => $3))`,
    [hashToken(token), adminId, SESSION_DAYS],
  );
  return token;
}

export async function findAdminBySession(
  db: Db,
  token: string | undefined,
): Promise<Admin | null> {
  if (!token) return null;
  const result = await db.query(
    `select a.id, a.email from sessions s join admins a on a.id = s.admin_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  );
  const row = result.rows[0];
  return row ? { id: row.id as string, email: row.email as string } : null;
}

export async function endSession(
  db: Db,
  token: string | undefined,
): Promise<void> {
  if (token)
    await db.query("delete from sessions where token_hash = $1", [
      hashToken(token),
    ]);
}

export function setSessionCookie(c: Context, token: string, secure: boolean) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    secure,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export const clearSessionCookie = (c: Context) =>
  deleteCookie(c, SESSION_COOKIE, { path: "/" });

/** Counts failed logins per key within a sliding window. In memory: resets on restart. */
export class LoginLimiter {
  private failures = new Map<string, number[]>();

  constructor(private now: () => number = Date.now) {}

  private recent(key: string): number[] {
    const cutoff = this.now() - WINDOW_MS;
    const list = (this.failures.get(key) ?? []).filter((t) => t > cutoff);
    this.failures.set(key, list);
    return list;
  }

  isBlocked(key: string): boolean {
    return this.recent(key).length >= MAX_FAILURES;
  }

  recordFailure(key: string): void {
    this.recent(key).push(this.now());
  }

  reset(key: string): void {
    this.failures.delete(key);
  }
}

export function requireAdmin(
  db: Db,
): MiddlewareHandler<{ Variables: { admin: Admin } }> {
  return async (c, next) => {
    const admin = await findAdminBySession(db, getCookie(c, SESSION_COOKIE));
    if (!admin) return c.json({ error: "unauthorized" }, 401);
    c.set("admin", admin);
    await next();
  };
}

export { getCookie };
