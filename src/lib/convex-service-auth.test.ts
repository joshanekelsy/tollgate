import { afterEach, describe, expect, it } from "vitest";
import { requireServiceToken } from "../../convex/serviceAuth";

const originalToken = process.env.CONVEX_SERVICE_TOKEN;

afterEach(() => {
  if (originalToken === undefined) delete process.env.CONVEX_SERVICE_TOKEN;
  else process.env.CONVEX_SERVICE_TOKEN = originalToken;
});

describe("Convex service authorization", () => {
  it("fails closed when the configured token is missing or too short", () => {
    delete process.env.CONVEX_SERVICE_TOKEN;
    expect(() => requireServiceToken({ serviceToken: "x".repeat(32) })).toThrow("Service authorization failed");

    process.env.CONVEX_SERVICE_TOKEN = "too-short";
    expect(() => requireServiceToken({ serviceToken: "too-short" })).toThrow("Service authorization failed");
  });

  it("rejects an incorrect token without exposing either value", () => {
    process.env.CONVEX_SERVICE_TOKEN = "a".repeat(64);
    expect(() => requireServiceToken({ serviceToken: "b".repeat(64) })).toThrow("Service authorization failed");
  });

  it("accepts the configured token", () => {
    process.env.CONVEX_SERVICE_TOKEN = "a".repeat(64);
    expect(() => requireServiceToken({ serviceToken: "a".repeat(64) })).not.toThrow();
  });
});
