import "server-only";
import { randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const KEY_LENGTH = 64;
// The minimum length is part of the API contract: MIN_PASSWORD_LENGTH in lib/schemas/auth.ts.

/** Hashes with scrypt and a random per-user salt. Format: `scrypt$<salt hex>$<hash hex>`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return format(salt, await scryptAsync(password, salt, KEY_LENGTH));
}

/** Synchronous variant with a caller-chosen salt, for building seed data. */
export function hashPasswordSync(password: string, salt: string): string {
  const saltBytes = Buffer.from(salt, "utf8");
  return format(saltBytes, scryptSync(password, saltBytes, KEY_LENGTH));
}

/** Constant-time comparison against a stored hash. Malformed hashes never match. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function format(salt: Buffer, hash: Buffer): string {
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
