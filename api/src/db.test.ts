// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { createApp } from "./app";
import {
  LoginLimiter,
  createSession,
  endSession,
  findAdminBySession,
} from "./auth";
import type { Db } from "./db";
import { hashPassword } from "./password";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on the environment (CI).
}

const ORIGIN = "http://localhost:5173";
const url = process.env.DATABASE_URL;
const client = new pg.Client({ connectionString: url });
const txDb = { query: (t: string, p?: unknown[]) => client.query(t, p) } as Db;

async function inTx(fn: () => Promise<void>) {
  await client.query("begin");
  try {
    await fn();
  } finally {
    await client.query("rollback");
  }
}

async function newCategory(name: string, visible = true) {
  const r = await client.query(
    "insert into categories (name_en, is_visible) values ($1, $2) returning id",
    [name, visible],
  );
  return r.rows[0].id as string;
}

describe.skipIf(!url)("database rules (real Postgres, rolled back)", () => {
  beforeAll(() => client.connect());
  afterAll(() => client.end());

  it("rejects a price of zero", () =>
    inTx(async () => {
      const c = await newCategory("TX category");
      await expect(
        client.query(
          "insert into items (category_id, name_en, price_etb) values ($1, 'Bad', 0)",
          [c],
        ),
      ).rejects.toThrow(/items_price_etb_check/);
    }));

  it("rejects a blank category name", () =>
    inTx(async () => {
      await expect(
        client.query("insert into categories (name_en) values ('   ')"),
      ).rejects.toThrow(/categories_name_en_check/);
    }));

  it("rejects a half-set schedule", () =>
    inTx(async () => {
      const c = await newCategory("TX category");
      await expect(
        client.query(
          "insert into items (category_id, name_en, price_etb, available_from) values ($1, 'Half', 10, '08:00')",
          [c],
        ),
      ).rejects.toThrow(/items_schedule_pair/);
    }));

  it("blocks deleting a category that still has items", () =>
    inTx(async () => {
      const c = await newCategory("TX category");
      await client.query(
        "insert into items (category_id, name_en, price_etb) values ($1, 'Keep', 10)",
        [c],
      );
      await expect(
        client.query("delete from categories where id = $1", [c]),
      ).rejects.toThrow(/foreign key/);
    }));

  it("menu hides hidden categories but keeps unavailable items", () =>
    inTx(async () => {
      const shown = await newCategory("TX shown");
      const hidden = await newCategory("TX hidden", false);
      await client.query(
        "insert into items (category_id, name_en, price_etb, is_available) values ($1, 'TX unavailable', 10, false)",
        [shown],
      );
      await client.query(
        "insert into items (category_id, name_en, price_etb) values ($1, 'TX in hidden', 10)",
        [hidden],
      );
      const app = createApp(txDb, { corsOrigin: ORIGIN });
      const body = await (await app.request("/api/menu")).json();
      const names = body.items.map((i: { nameEn: string }) => i.nameEn);
      expect(names).toContain("TX unavailable");
      expect(names).not.toContain("TX in hidden");
    }));

  it("creates, finds and ends a session with parameterised queries", () =>
    inTx(async () => {
      const admin = await client.query(
        "insert into admins (email, password_hash) values ($1, $2) returning id",
        ["tx-admin@example.com", "x"],
      );
      const id = admin.rows[0].id as string;
      const token = await createSession(txDb, id);
      expect(await findAdminBySession(txDb, token)).toEqual({
        id,
        email: "tx-admin@example.com",
      });
      await endSession(txDb, token);
      expect(await findAdminBySession(txDb, token)).toBeNull();
    }));

  it("logs in, changes the password and signs out other devices", () =>
    inTx(async () => {
      const email = "tx-boss@example.com";
      const OLD = "the-old-password-1";
      const NEW = "a-brand-new-password";
      await client.query(
        "insert into admins (email, password_hash) values ($1, $2)",
        [email, await hashPassword(OLD)],
      );
      const app = createApp(txDb, {
        corsOrigin: ORIGIN,
        limiter: new LoginLimiter(),
      });
      const post = (path: string, body: object, cookie = "") =>
        app.request(path, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: ORIGIN,
            cookie,
          },
          body: JSON.stringify(body),
        });
      const signIn = async () => {
        const res = await post("/api/admin/login", { email, password: OLD });
        expect(res.status).toBe(200);
        const token = /alemitu_session=([^;]+)/.exec(
          res.headers.get("set-cookie") ?? "",
        )?.[1];
        return `alemitu_session=${token}`;
      };
      const me = (cookie: string) =>
        app.request("/api/admin/me", { headers: { cookie } });

      const mine = await signIn();
      const other = await signIn();
      const changed = await post(
        "/api/admin/password",
        { currentPassword: OLD, newPassword: NEW },
        mine,
      );
      expect(changed.status).toBe(200);
      expect((await me(mine)).status).toBe(200);
      expect((await me(other)).status).toBe(401);
      expect(
        (await post("/api/admin/login", { email, password: OLD })).status,
      ).toBe(401);
      expect(
        (await post("/api/admin/login", { email, password: NEW })).status,
      ).toBe(200);
      // A hostile email is just a value, not SQL.
      expect(
        (
          await post("/api/admin/login", {
            email: "x' or '1'='1",
            password: "whatever-password",
          })
        ).status,
      ).toBe(401);
    }));
});
