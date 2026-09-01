import { describe, expect, it } from "vitest";
import { compareSameTokens } from "./comparison";

describe("compareSameTokens", () => {
  it("calculates the estimated difference for the same token volume", () => {
    const comparison = compareSameTokens(0.00002625, 0.0000072);
    expect(comparison?.differenceUsd).toBeCloseTo(0.00001905, 12);
    expect(comparison?.percentLower).toBeCloseTo(72.5714, 4);
  });

  it("does not invent a comparison when pricing is unavailable", () => {
    expect(compareSameTokens(undefined, 0.1)).toBeNull();
    expect(compareSameTokens(0, 0)).toBeNull();
  });
});
