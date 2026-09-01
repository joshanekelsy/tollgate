import { describe, expect, it } from "vitest";
import { summarizeBilling, type DashboardInvoiceRow } from "./dashboard-summary";

const row = (overrides: Partial<DashboardInvoiceRow> = {}): DashboardInvoiceRow => ({
  customerId: "acme",
  calls: 4,
  tokens: 8_000,
  rawCostUsd: 6,
  unknownCostCalls: 0,
  billedAmountUsd: 9,
  marginUsd: 3,
  ...overrides,
});

describe("dashboard billing summary", () => {
  it("totals invoice-ready customer usage", () => {
    expect(summarizeBilling([
      row(),
      row({ customerId: "beta", calls: 2, tokens: 2_000, rawCostUsd: 1, billedAmountUsd: 2, marginUsd: 1 }),
    ])).toEqual({
      calls: 6,
      tokens: 10_000,
      customers: 2,
      rawCostUsd: 7,
      totalBilledUsd: 11,
      marginUsd: 4,
      unattributedCalls: 0,
      unknownCostCalls: 0,
    });
  });

  it("keeps unattributed and unknown-cost calls visible", () => {
    expect(summarizeBilling([
      row({ customerId: "unattributed", calls: 3, unknownCostCalls: 1, billedAmountUsd: null, marginUsd: null }),
    ])).toMatchObject({
      unattributedCalls: 3,
      unknownCostCalls: 1,
      totalBilledUsd: null,
      marginUsd: null,
    });
  });

  it("returns stable zero totals for a new meter", () => {
    expect(summarizeBilling([])).toEqual({
      calls: 0,
      tokens: 0,
      customers: 0,
      rawCostUsd: 0,
      totalBilledUsd: 0,
      marginUsd: 0,
      unattributedCalls: 0,
      unknownCostCalls: 0,
    });
  });
});
