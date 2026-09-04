import { randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto";

/**
 * Plain (non-"use server") crypto helpers for the shared class-login
 * credentials feature — kept out of classLogin.ts because every export from
 * a "use server" file is treated as a Server Action, which must be async;
 * these are synchronous and get imported from both classLogin.ts and
 * src/app/admin/users/actions.ts.
 */

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
