import type { SafeCallRecord } from "./types";

export type PriceRule = {
  mode: "percentage" | "per_thousand_tokens";
  value: number;
  baseAmountUsd?: number;
  includedTokens?: number;
  version?: number;
};
export type InvoiceRow = { customerId: string; calls: number; tokens: number; rawCostUsd: number; unknownCostCalls: number };
export type PricedInvoiceRow = InvoiceRow & { billedAmountUsd: number | null; marginUsd: number | null };
export type BillingCustomer = {
  customerId: string;
  name?: string;
  billingEmail?: string;
  stripeCustomerId?: string;
  status: "active" | "archived";
};
export type BillingBlocker = {
  code: "unattributed" | "missing_customer" | "inactive_customer" | "missing_billing_contact" | "missing_rule" | "unpriced";
  customerId: string;
  count: number;
};

export function rawCallCostUsd(call: SafeCallRecord) {
  return call.providerCostUsd ?? call.estimatedCostUsd;
}

export function calculateBilledAmount(usage: { rawCostUsd: number; tokens: number }, rule: PriceRule) {
  const base = rule.baseAmountUsd ?? 0;
  if (rule.mode === "percentage") return base + usage.rawCostUsd * (1 + rule.value / 100);
  const chargeableTokens = Math.max(0, usage.tokens - (rule.includedTokens ?? 0));
  return base + (chargeableTokens / 1_000) * rule.value;
}

export function buildInvoiceRows(calls: SafeCallRecord[], rule: PriceRule) {
  const grouped = new Map<string, InvoiceRow>();
  for (const call of calls) {
    const customerId = call.customerId || "unattributed";
    const current = grouped.get(customerId) ?? { customerId, calls: 0, tokens: 0, rawCostUsd: 0, unknownCostCalls: 0 };
    current.calls += 1;
    current.tokens += call.promptTokens + call.completionTokens;
    const rawCostUsd = rawCallCostUsd(call);
    current.rawCostUsd += rawCostUsd ?? 0;
    if (call.costStatus === "unavailable" || rawCostUsd === undefined) current.unknownCostCalls += 1;
    grouped.set(customerId, current);
  }
  return Array.from(grouped.values(), (usage) => {
    const billedAmountUsd = rule.mode === "percentage" && usage.unknownCostCalls
      ? null
      : calculateBilledAmount(usage, rule);
    const marginUsd = billedAmountUsd === null || usage.unknownCostCalls
      ? null
      : billedAmountUsd - usage.rawCostUsd;
    return { ...usage, billedAmountUsd, marginUsd };
  }).sort((a, b) => (b.billedAmountUsd ?? -1) - (a.billedAmountUsd ?? -1));
}

export function buildBillingPreview(args: {
  calls: SafeCallRecord[];
  environment: "test" | "live";
  defaultRule: PriceRule | null;
  customerRules?: Record<string, PriceRule>;
  customers: BillingCustomer[];
}) {
  const blockers: BillingBlocker[] = [];
  const billableCalls = args.calls.filter((call) =>
    call.environment === args.environment
    && call.status === "ok"
    && call.eventStatus === "accepted",
  );
  const unattributed = billableCalls.filter((call) => call.customerId === "unattributed");
  if (unattributed.length) blockers.push({ code: "unattributed", customerId: "unattributed", count: unattributed.length });

  const grouped = new Map<string, SafeCallRecord[]>();
  for (const call of billableCalls) {
    if (call.customerId === "unattributed") continue;
    const current = grouped.get(call.customerId) ?? [];
    current.push(call);
    grouped.set(call.customerId, current);
  }
  const customers = new Map(args.customers.map((customer) => [customer.customerId, customer]));
  const rows = Array.from(grouped, ([customerId, calls]) => {
    const customer = customers.get(customerId);
    const rule = args.customerRules?.[customerId] ?? args.defaultRule;
    if (!customer) blockers.push({ code: "missing_customer", customerId, count: calls.length });
    else if (customer.status !== "active") blockers.push({ code: "inactive_customer", customerId, count: calls.length });
    else if (!customer.billingEmail && !customer.stripeCustomerId) blockers.push({ code: "missing_billing_contact", customerId, count: calls.length });
    if (!rule) blockers.push({ code: "missing_rule", customerId, count: calls.length });
    const usage = calls.reduce((total, call) => {
      const rawCost = rawCallCostUsd(call);
      total.calls += 1;
      total.tokens += call.promptTokens + call.completionTokens;
      total.rawCostUsd += rawCost ?? 0;
      if (rawCost === undefined || call.costStatus === "unavailable") total.unknownCostCalls += 1;
      return total;
    }, { calls: 0, tokens: 0, rawCostUsd: 0, unknownCostCalls: 0 });
    const unpriced = Boolean(rule?.mode === "percentage" && usage.unknownCostCalls);
    if (unpriced) blockers.push({ code: "unpriced", customerId, count: usage.unknownCostCalls });
    const billedAmountUsd = rule && !unpriced ? calculateBilledAmount(usage, rule) : null;
    return {
      customerId,
      ...usage,
      billedAmountUsd,
      marginUsd: billedAmountUsd === null || usage.unknownCostCalls ? null : billedAmountUsd - usage.rawCostUsd,
      rule,
      customer,
      sourceEventIds: calls.map((call) => call.idempotencyKey),
    };
  }).sort((a, b) => (b.billedAmountUsd ?? -1) - (a.billedAmountUsd ?? -1));
  return { rows, blockers };
}
