// TEST ONLY: creates the admin used by the Playwright tests (CI or a throwaway database).
import pg from "pg";
import { hashPassword } from "../src/password";

const email = process.env.E2E_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.E2E_ADMIN_PASSWORD;

if (!process.env.DATABASE_URL || !email || !password) {
  console.error("Set DATABASE_URL, E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run with NODE_ENV=production.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const other = await client.query(
    "select 1 from admins where email <> $1 limit 1",
    [email],
  );
  if (other.rowCount) {
    console.error(
      "This database has a real admin. Use a separate test database.",
    );
    process.exit(1);
  }
  await client.query(
    `insert into admins (email, password_hash) values ($1, $2)
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [email, await hashPassword(password)],
  );
  console.log(`E2E admin ready: ${email}`);
} finally {
  await client.end();
}
