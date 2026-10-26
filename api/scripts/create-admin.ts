// One-off: creates the single admin account. Run with `npm run create-admin` inside api/.
import readline from "node:readline";
import pg from "pg";
import { hashPassword } from "../src/password";

function ask(question: string, hidden: boolean): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    let muted = false;
    const out = rl as unknown as { _writeToOutput: (text: string) => void };
    out._writeToOutput = (text) => {
      if (!muted) process.stdout.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
    muted = hidden;
  });
}

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Run this from the api folder with npm run create-admin.",
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const existing = await client.query("select count(*)::int as n from admins");
  if (existing.rows[0].n > 0) {
    console.error("An admin account already exists. Only one is allowed.");
    process.exit(1);
  }

  const email = (await ask("Admin email: ", false)).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("That does not look like an email address.");
    process.exit(1);
  }

  const password = await ask(
    "Password (at least 12 characters, hidden): ",
    true,
  );
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  const again = await ask("Repeat password: ", true);
  if (again !== password) {
    console.error("The passwords do not match.");
    process.exit(1);
  }

  await client.query(
    "insert into admins (email, password_hash) values ($1, $2)",
    [email, await hashPassword(password)],
  );
  console.log(`Admin created for ${email}.`);
} finally {
  await client.end();
}
