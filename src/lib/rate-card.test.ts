import { describe, expect, it } from "vitest";
import { estimateRateCardCost, findExactRateCard, type ModelRateCard } from "./rate-card";

const rates: ModelRateCard[] = [
  { provider: "anthropic", model: "claude-sonnet-4-5", inputUsdPerMillion: 3, outputUsdPerMillion: 15 },
  { provider: "gemini", model: "gemini-2.5-flash", inputUsdPerMillion: 0.3, outputUsdPerMillion: 2.5 },
];

describe("rate cards", () => {
  it("matches only an exact provider and model pair", () => {
    expect(findExactRateCard(rates, "anthropic", "claude-sonnet-4-5")).toEqual(rates[0]);
    expect(findExactRateCard(rates, "openai", "claude-sonnet-4-5")).toBeNull();
    expect(findExactRateCard(rates, "anthropic", "claude-sonnet-4-5-latest")).toBeNull();
  });

  it("prices input and output tokens independently", () => {
    expect(estimateRateCardCost({ promptTokens: 1_000_000, completionTokens: 200_000 }, rates[0])).toBe(6);
  });

  it("returns a stable six-decimal estimate for small calls", () => {
    expect(estimateRateCardCost({ promptTokens: 1_234, completionTokens: 567 }, rates[1])).toBe(0.001788);
  });
});
