import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

/** Returns "scrypt$<salt>$<key>" with a fresh random salt. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [algorithm, salt, key] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !key) return false;
  const actual = await derive(password, Buffer.from(salt, "base64"));
  const expected = Buffer.from(key, "base64");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
