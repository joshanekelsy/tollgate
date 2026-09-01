import { describe, expect, it } from "vitest";
import { generateWriteKey, hashWriteKey, isWriteKey } from "./write-key";

describe("meter write keys", () => {
  it.each(["test", "live"] as const)("generates a %s key without storing the raw value", (environment) => {
    const key = generateWriteKey(environment);
    expect(key).toMatch(new RegExp(`^tgw_${environment}_[A-Za-z0-9_-]{43}$`));
    expect(isWriteKey(key)).toBe(true);
    expect(hashWriteKey(key)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashWriteKey(key)).not.toContain(key);
  });

  it("rejects provider keys and malformed Tollgate keys", () => {
    expect(isWriteKey("sk-provider-secret")).toBe(false);
    expect(isWriteKey("tgw_live_short")).toBe(false);
  });
});
