import { createHash, randomBytes } from "node:crypto";

export type MeterEnvironment = "test" | "live";

const WRITE_KEY = /^tgw_(test|live)_[A-Za-z0-9_-]{43}$/;

export function generateWriteKey(environment: MeterEnvironment) {
  return `tgw_${environment}_${randomBytes(32).toString("base64url")}`;
}

export function isWriteKey(value: unknown): value is string {
  return typeof value === "string" && WRITE_KEY.test(value);
}

export function hashWriteKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function writeKeyPrefix(value: string) {
  return `${value.slice(0, 17)}...${value.slice(-4)}`;
}
