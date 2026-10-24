// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { createApp } from "./app";
import type { Db } from "./db";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on the environment (CI).
}

const url = process.env.DATABASE_URL;
const client = new pg.Client({ connectionString: url });

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
      const app = createApp({ query: (t: string) => client.query(t) } as Db, {
        corsOrigin: "http://localhost:5173",
      });
      const body = await (await app.request("/api/menu")).json();
      const names = body.items.map((i: { nameEn: string }) => i.nameEn);
      expect(names).toContain("TX unavailable");
      expect(names).not.toContain("TX in hidden");
    }));
});
