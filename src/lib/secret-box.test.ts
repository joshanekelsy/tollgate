import { describe, expect, it } from "vitest";
import { openSecret, sealSecret } from "./secret-box";

describe("secret storage", () => {
  const master = "a-test-encryption-secret-that-is-long-enough";

  it("round-trips only with the same project context", () => {
    const sealed = sealSecret("rk_test_private", master, "meter-1:stripe-key");
    expect(sealed).not.toContain("rk_test_private");
    expect(openSecret(sealed, master, "meter-1:stripe-key")).toBe("rk_test_private");
    expect(() => openSecret(sealed, master, "meter-2:stripe-key")).toThrow("Encrypted secret could not be opened");
  });

  it("rejects a changed encrypted value", () => {
    const sealed = sealSecret("whsec_private", master, "meter-1:webhook");
    const changed = `${sealed.slice(0, -1)}${sealed.endsWith("a") ? "b" : "a"}`;
    expect(() => openSecret(changed, master, "meter-1:webhook")).toThrow("Encrypted secret could not be opened");
  });
});
