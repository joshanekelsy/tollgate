import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export function generateAccessCode() {
  return randomBytes(24).toString("base64url");
}

export function accessCodeLookup(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function hashAccessCode(code: string) {
  const salt = randomBytes(16);
  const derived = (await scrypt(code, salt, 64)) as Buffer;
  return `${salt.toString("base64url")}.${derived.toString("base64url")}`;
}

export async function verifyAccessCode(code: string, stored: string) {
  try {
    const [saltText, hashText, extra] = stored.split(".");
    if (!saltText || !hashText || extra) return false;
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    if (salt.length !== 16 || expected.length !== 64) return false;
    const actual = (await scrypt(code, salt, 64)) as Buffer;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
