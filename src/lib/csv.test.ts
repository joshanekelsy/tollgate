import { describe, expect, it } from "vitest";
import { billingRunCsv } from "./csv";

describe("billing run CSV", () => {
  it("uses stable columns and escapes customer text", () => {
    const csv = billingRunCsv({
      periodStart: Date.UTC(2026, 7, 1),
      periodEnd: Date.UTC(2026, 8, 1),
      items: [{
        customerId: "acme",
        customerName: "Acme, Inc.",
        billingEmail: "billing@acme.test",
        calls: 2,
        tokens: 2_500,
        rawCostCents: 120,
        amountCents: 500,
        marginCents: 380,
        stripeStatus: "not_sent",
      }],
    });
    expect(csv.split("\n")[0]).toBe("period_start,period_end,customer_id,customer_name,billing_email,calls,tokens,raw_cost_usd,amount_usd,margin_usd,stripe_status");
    expect(csv).toContain('acme,"Acme, Inc.",billing@acme.test,2,2500,1.20,5.00,3.80,not_sent');
  });

  it("prevents spreadsheet formulas from running", () => {
    const csv = billingRunCsv({
      periodStart: 0,
      periodEnd: 1,
      items: [{ customerId: "=cmd", customerName: "+SUM(1,2)", calls: 0, tokens: 0, rawCostCents: 0, amountCents: 0, stripeStatus: "not_sent" }],
    });
    expect(csv).toContain("'=cmd");
    expect(csv).toContain('"\'+SUM(1,2)"');
  });
});
