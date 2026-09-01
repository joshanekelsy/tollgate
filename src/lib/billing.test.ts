import { describe, expect, it } from "vitest";
import { buildBillingPreview, buildInvoiceRows, calculateBilledAmount, type PriceRule } from "./billing";
import type { SafeCallRecord } from "./types";

const percentage: PriceRule = { mode: "percentage", value: 25 };
const fixed: PriceRule = { mode: "per_thousand_tokens", value: 2 };

function call(customerId: string, tokens: number, cost: number): SafeCallRecord {
  return { projectId: "meter", environment: "live", idempotencyKey: `event-${customerId}-${tokens}`, eventStatus: "accepted", pricingStatus: "priced", customerId, createdAt: Date.UTC(2026, 7, 15), provider: "openai", requestedModel: "gpt-5.4-mini", promptTokens: tokens, cachedPromptTokens: 0, completionTokens: 0, estimatedCostUsd: cost, costStatus: "estimated", latencyMs: 100, status: "ok", trafficType: "external" };
}

describe("billing", () => {
  it("applies a percentage markup to raw model cost", () => {
    expect(calculateBilledAmount({ rawCostUsd: 4, tokens: 10_000 }, percentage)).toBe(5);
  });

  it("applies a fixed price per 1,000 tokens", () => {
    expect(calculateBilledAmount({ rawCostUsd: 4, tokens: 2_500 }, fixed)).toBe(5);
  });

  it("adds a base charge and subtracts included token usage", () => {
    expect(calculateBilledAmount({ rawCostUsd: 4, tokens: 2_500 }, {
      mode: "per_thousand_tokens",
      value: 2,
      baseAmountUsd: 10,
      includedTokens: 500,
    })).toBe(14);
  });

  it("groups different customers and sorts by billed amount", () => {
    const rows = buildInvoiceRows([call("acme", 2_000, 1), call("beta", 1_000, 0.25), call("acme", 500, 0.2)], fixed);
    expect(rows).toEqual([
      { customerId: "acme", calls: 2, tokens: 2_500, rawCostUsd: 1.2, unknownCostCalls: 0, billedAmountUsd: 5, marginUsd: 3.8 },
      { customerId: "beta", calls: 1, tokens: 1_000, rawCostUsd: 0.25, unknownCostCalls: 0, billedAmountUsd: 2, marginUsd: 1.75 },
    ]);
  });

  it("does not invent percentage revenue or margin when raw cost is unavailable", () => {
    const unknown = call("acme", 1_000, 0);
    unknown.estimatedCostUsd = undefined;
    unknown.costStatus = "unavailable";
    expect(buildInvoiceRows([unknown], percentage)).toEqual([
      { customerId: "acme", calls: 1, tokens: 1_000, rawCostUsd: 0, unknownCostCalls: 1, billedAmountUsd: null, marginUsd: null },
    ]);
  });

  it("uses a provider-reported cost before a Tollgate estimate", () => {
    const reported = call("acme", 1_000, 99);
    reported.provider = "openrouter";
    reported.providerCostUsd = 0.4;
    reported.costStatus = "reported";
    const [row] = buildInvoiceRows([reported], percentage);
    expect(row).toMatchObject({ customerId: "acme", calls: 1, tokens: 1_000, rawCostUsd: 0.4, unknownCostCalls: 0, billedAmountUsd: 0.5 });
    expect(row.marginUsd).toBeCloseTo(0.1);
  });

  it("uses a customer rule before the project default", () => {
    const preview = buildBillingPreview({
      calls: [call("acme", 2_000, 1), call("beta", 2_000, 1)],
      environment: "live",
      defaultRule: fixed,
      customerRules: { acme: { mode: "per_thousand_tokens", value: 5 } },
      customers: [
        { customerId: "acme", status: "active", billingEmail: "billing@acme.test" },
        { customerId: "beta", status: "active", billingEmail: "billing@beta.test" },
      ],
    });
    expect(preview.blockers).toEqual([]);
    expect(preview.rows.map((row) => [row.customerId, row.billedAmountUsd])).toEqual([["acme", 10], ["beta", 4]]);
  });

  it("excludes test, failed, and duplicate attempts from live totals", () => {
    const live = call("acme", 1_000, 1);
    const test = { ...call("acme", 8_000, 8), environment: "test" as const };
    const failed = { ...call("acme", 4_000, 4), status: "error" as const, eventStatus: "failed" as const };
    const preview = buildBillingPreview({
      calls: [live, test, failed],
      environment: "live",
      defaultRule: fixed,
      customers: [{ customerId: "acme", status: "active", billingEmail: "billing@acme.test" }],
    });
    expect(preview.rows[0]).toMatchObject({ calls: 1, tokens: 1_000, billedAmountUsd: 2 });
  });

  it("reports every condition that blocks a safe close", () => {
    const unknown = call("missing", 1_000, 0);
    unknown.estimatedCostUsd = undefined;
    unknown.costStatus = "unavailable";
    unknown.pricingStatus = "unpriced";
    const preview = buildBillingPreview({
      calls: [unknown, call("unattributed", 20, 0.1), call("archived", 20, 0.1), call("no-contact", 20, 0.1)],
      environment: "live",
      defaultRule: percentage,
      customers: [
        { customerId: "archived", status: "archived", billingEmail: "old@example.test" },
        { customerId: "no-contact", status: "active" },
      ],
    });
    expect(preview.blockers.map((blocker) => blocker.code)).toEqual([
      "unattributed",
      "missing_customer",
      "unpriced",
      "inactive_customer",
      "missing_billing_contact",
    ]);
  });
});
