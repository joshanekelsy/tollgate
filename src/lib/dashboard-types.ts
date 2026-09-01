import type { PriceRule } from "./billing";
import type { DashboardInvoiceRow } from "./dashboard-summary";
import type { SafeCallRecord } from "./types";

export type MeterEnvironment = "test" | "live";
export type DashboardCall = SafeCallRecord & { _id: string; duplicateAttempts?: number };
export type UsageData = { calls: DashboardCall[] };
export type InvoiceData = {
  rule: PriceRule | null;
  rows: DashboardInvoiceRow[];
  monthStart: number;
  blockers?: BillingBlocker[];
};
export type BillingBlocker = { code: string; customerId: string; count: number };
export type CustomerRecord = {
  _id: string;
  customerId: string;
  environment: MeterEnvironment;
  name?: string;
  billingEmail?: string;
  stripeCustomerId?: string;
  status: "active" | "archived";
  updatedAt: number;
};
export type RateCard = {
  _id: string;
  provider: "openai" | "anthropic" | "gemini" | "openrouter";
  model: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
};
export type StoredPriceRule = PriceRule & { _id: string; customerId?: string; active: boolean };
export type BillingPreviewRow = DashboardInvoiceRow & {
  customer?: { name: string; billingEmail?: string; stripeCustomerId?: string; status: string } | null;
};
export type BillingPreview = {
  periodStart: number;
  periodEnd: number;
  rows: BillingPreviewRow[];
  blockers: BillingBlocker[];
};
export type BillingRunItem = {
  _id: string;
  customerId: string;
  customerName: string;
  billingEmail?: string;
  stripeCustomerId?: string;
  calls: number;
  tokens: number;
  rawCostCents: number;
  amountCents: number;
  marginCents?: number;
  stripeStatus: "not_sent" | "draft" | "open" | "paid" | "void" | "failed";
  stripeInvoiceId?: string;
  stripeError?: string;
};
export type BillingRun = {
  _id: string;
  periodStart: number;
  periodEnd: number;
  status: "closed" | "exporting" | "exported" | "partial";
  customerCount: number;
  totalAmountCents: number;
  totalRawCostCents: number;
  closedAt: number;
  items: BillingRunItem[];
};
export type KeyMetadata = { environment: MeterEnvironment; keyPrefix: string; createdAt: number };
export type StripeConnection = {
  keyPrefix: string;
  accountId: string;
  accountCountry: string;
  livemode: boolean;
  updatedAt: number;
};
export type DashboardResources = {
  events: DashboardCall[];
  customers: CustomerRecord[];
  rates: RateCard[];
  rules: StoredPriceRule[];
  billingRuns: BillingRun[];
  billingPreview: BillingPreview;
  keys: KeyMetadata[];
  stripe: StripeConnection | null;
  stripeWebhookUrl: string;
};
