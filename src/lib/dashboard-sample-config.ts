import type { PriceRule } from "./billing";
import type { SupportedModel } from "./types";

export type SampleCustomerSummary = {
  customerId: string;
  name: string;
  calls: number;
  tokens: number;
  rawCostUsd: number;
  billedAmountUsd: number;
  marginUsd: number;
  model: SupportedModel;
};

export const samplePricingRule: PriceRule = { mode: "percentage", value: 40 };

export const sampleCustomerSummaries: SampleCustomerSummary[] = [
  { customerId: "acme", name: "Acme", calls: 184, tokens: 482_000, rawCostUsd: 38.4, billedAmountUsd: 53.76, marginUsd: 15.36, model: "gpt-5.4-mini" },
  { customerId: "northstar", name: "Northstar", calls: 96, tokens: 219_500, rawCostUsd: 17.2, billedAmountUsd: 24.08, marginUsd: 6.88, model: "gpt-5.4-nano" },
  { customerId: "unattributed", name: "Unattributed", calls: 14, tokens: 28_700, rawCostUsd: 2.05, billedAmountUsd: 2.87, marginUsd: 0.82, model: "gpt-5.4-mini" },
];

export const sampleDashboardTotals = sampleCustomerSummaries.reduce((totals, customer) => ({
  calls: totals.calls + customer.calls,
  tokens: totals.tokens + customer.tokens,
  rawCostUsd: totals.rawCostUsd + customer.rawCostUsd,
  billedAmountUsd: totals.billedAmountUsd + customer.billedAmountUsd,
  marginUsd: totals.marginUsd + customer.marginUsd,
}), { calls: 0, tokens: 0, rawCostUsd: 0, billedAmountUsd: 0, marginUsd: 0 });
