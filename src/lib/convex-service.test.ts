import { afterEach, describe, expect, it } from "vitest";
import { getConvexServiceToken, withConvexServiceToken } from "./convex-service";

const originalToken = process.env.CONVEX_SERVICE_TOKEN;

afterEach(() => {
  if (originalToken === undefined) delete process.env.CONVEX_SERVICE_TOKEN;
  else process.env.CONVEX_SERVICE_TOKEN = originalToken;
});

describe("trusted Convex server calls", () => {
  it("treats missing and short configuration as unavailable", () => {
    delete process.env.CONVEX_SERVICE_TOKEN;
    expect(getConvexServiceToken()).toBeNull();

    process.env.CONVEX_SERVICE_TOKEN = "too-short";
    expect(getConvexServiceToken()).toBeNull();
  });

  it("adds a configured token without changing the input", () => {
    const configured = "a".repeat(64);
    const args = { projectId: "meter-1" };
    expect(withConvexServiceToken(args, configured)).toEqual({ projectId: "meter-1", serviceToken: configured });
    expect(args).toEqual({ projectId: "meter-1" });
  });

  it("refuses to build arguments without a strong token", () => {
    expect(() => withConvexServiceToken({ projectId: "meter-1" }, "short")).toThrow("Convex service authorization is not configured");
  });
});
