import { buildInvoiceRows, type PriceRule } from "./billing";
import { sampleCustomerSummaries, samplePricingRule } from "./dashboard-sample-config";
import type { SafeCallRecord, SupportedModel } from "./types";

export type SampleDashboardCall = SafeCallRecord & { _id: string };
export type SampleDashboardData = {
  usage: { calls: SampleDashboardCall[] };
  invoice: {
    rule: PriceRule;
    rows: ReturnType<typeof buildInvoiceRows>;
    monthStart: number;
  };
};

type CustomerSample = {
  customerId: string;
  calls: number;
  tokens: number;
  rawCostUsd: number;
  model: SupportedModel;
};

const customers: CustomerSample[] = sampleCustomerSummaries;
const rule: PriceRule = samplePricingRule;
const now = new Date();
const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);

function customerCalls(sample: CustomerSample, customerIndex: number): SampleDashboardCall[] {
  const baseTokens = Math.floor(sample.tokens / sample.calls);
  const extraTokens = sample.tokens - baseTokens * sample.calls;
  const baseCost = sample.rawCostUsd / sample.calls;

  return Array.from({ length: sample.calls }, (_, index) => {
    const tokens = baseTokens + (index < extraTokens ? 1 : 0);
    const promptTokens = Math.floor(tokens * 0.72);
    return {
      _id: `sample-${sample.customerId}-${index + 1}`,
      projectId: "sample-meter",
      environment: "live",
      idempotencyKey: `sample-event-${customerIndex + 1}-${index + 1}`,
      eventStatus: "accepted",
      pricingStatus: "priced",
      customerId: sample.customerId,
      createdAt: monthStart + (customerIndex + 1) * 86_400_000 + index * 60_000,
      provider: "openai",
      providerRequestId: `sample-request-${customerIndex + 1}-${index + 1}`,
      requestedModel: sample.model,
      reportedModel: sample.model,
      promptTokens,
      cachedPromptTokens: 0,
      completionTokens: tokens - promptTokens,
      estimatedCostUsd: baseCost,
      costStatus: "estimated",
      latencyMs: 640 + ((index * 47) % 1_400),
      status: "ok",
      trafficType: "demo",
      privacyMode: "private",
      taskId: `sample-billing-${customerIndex + 1}`,
      sessionId: `sample-session-${customerIndex + 1}`,
      agentName: "billing-assistant",
      toolNames: [],
      toolCallCount: 0,
    };
  });
}

const calls = customers.flatMap(customerCalls).sort((a, b) => b.createdAt - a.createdAt);

export const sampleDashboardData: SampleDashboardData = {
  usage: { calls },
  invoice: {
    rule,
    rows: buildInvoiceRows(calls, rule),
    monthStart,
  },
};
