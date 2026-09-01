import { describe, expect, it } from "vitest";
import { estimateModelAlternatives, priceCall, PRICING_VERIFIED_AT } from "./pricing";

describe("priceCall", () => {
  it("prices supported mini usage and the nano same-token comparison", () => {
    expect(priceCall({ promptTokens: 1_000_000, cachedPromptTokens: 0, completionTokens: 1_000_000 })).toEqual({
      costStatus: "estimated",
      estimatedCostUsd: 5.25,
      sameTokenEstimateUsd: 1.45,
    });
  });

  it("uses the cached-input rates", () => {
    expect(priceCall({ promptTokens: 1_000_000, cachedPromptTokens: 1_000_000, completionTokens: 0 })).toEqual({
      costStatus: "estimated",
      estimatedCostUsd: 0.075,
      sameTokenEstimateUsd: 0.02,
    });
  });

  it.each([
    { promptTokens: -1, cachedPromptTokens: 0, completionTokens: 0 },
    { promptTokens: 1.5, cachedPromptTokens: 0, completionTokens: 0 },
    { promptTokens: 10, cachedPromptTokens: 11, completionTokens: 0 },
  ])("rejects untrustworthy token counts", (usage) => {
    expect(priceCall(usage)).toEqual({ costStatus: "unavailable" });
  });

  it("does not estimate exceptional pricing", () => {
    expect(priceCall({ promptTokens: 10, cachedPromptTokens: 0, completionTokens: 10, exceptionalPricing: true })).toEqual({
      costStatus: "unavailable",
    });
  });

  it("marks a model without verified pricing as unavailable", () => {
    expect(priceCall({ promptTokens: 10, cachedPromptTokens: 0, completionTokens: 10 }, "gpt-future-model")).toEqual({
      costStatus: "unavailable",
    });
  });
});

describe("estimateModelAlternatives", () => {
  it("returns a cheapest-first ladder from the controlled catalogue", () => {
    const alternatives = estimateModelAlternatives({ promptTokens: 1_000_000, cachedPromptTokens: 0, completionTokens: 1_000_000 });
    expect(alternatives.map(({ model, estimatedCostUsd }) => ({ model, estimatedCostUsd }))).toEqual([
      { model: "gpt-5-nano", estimatedCostUsd: 0.45 },
      { model: "gpt-5.6-luna", estimatedCostUsd: 1.4 },
      { model: "gpt-5.4-nano", estimatedCostUsd: 1.45 },
    ]);
    expect(PRICING_VERIFIED_AT).toBe("2026-08-30");
  });
});
