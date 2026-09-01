import { describe, expect, it } from "vitest";
import { accessCodeLookup, generateAccessCode, hashAccessCode, verifyAccessCode } from "./access-code";

describe("dashboard access codes", () => {
  it("generates distinct codes", () => expect(generateAccessCode()).not.toBe(generateAccessCode()));
  it("stores only a salted hash", async () => {
    const code = generateAccessCode();
    const stored = await hashAccessCode(code);
    expect(stored).not.toContain(code);
    expect(await verifyAccessCode(code, stored)).toBe(true);
    expect(await verifyAccessCode("wrong", stored)).toBe(false);
  });
  it("rejects malformed hashes", async () => {
    expect(await verifyAccessCode("code", "broken")).toBe(false);
  });
  it("creates a stable lookup without exposing the access code", () => {
    expect(accessCodeLookup("meter-code")).toBe(accessCodeLookup("meter-code"));
    expect(accessCodeLookup("meter-code")).not.toContain("meter-code");
    expect(accessCodeLookup("another-code")).not.toBe(accessCodeLookup("meter-code"));
  });
});
