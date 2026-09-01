import { describe, expect, it } from "vitest";
import { sampleDashboardData } from "./dashboard-sample";
import { summarizeBilling } from "./dashboard-summary";

describe("sample dashboard data", () => {
  it("uses one complete dataset across all dashboard views", () => {
    const summary = summarizeBilling(sampleDashboardData.invoice.rows);

    expect(sampleDashboardData.invoice.rule).toEqual({ mode: "percentage", value: 40 });
    expect(summary.customers).toBe(3);
    expect(summary.calls).toBe(294);
    expect(summary.tokens).toBe(730_200);
    expect(summary.unattributedCalls).toBe(14);
    expect(summary.unknownCostCalls).toBe(0);
    expect(summary.rawCostUsd).toBeCloseTo(57.65);
    expect(summary.totalBilledUsd).toBeCloseTo(80.71);
    expect(summary.marginUsd).toBeCloseTo(23.06);
  });

  it("keeps recent evidence for every sample customer", () => {
    const customerIds = new Set(sampleDashboardData.usage.calls.map((call) => call.customerId));
    expect(customerIds).toEqual(new Set(["acme", "northstar", "unattributed"]));
  });
});
