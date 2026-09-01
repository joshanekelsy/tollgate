import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const STRIPE_API = "https://api.stripe.com/v1";

export function stripeRetryKey(operation: string, runId: string, itemId: string) {
  const digest = createHash("sha256").update(`${operation}:${runId}:${itemId}`).digest("hex").slice(0, 32);
  return `tollgate-${operation}-${digest}`;
}

async function stripePost<T>(args: {
  secretKey: string;
  path: string;
  values: Record<string, string | number | boolean>;
  idempotencyKey: string;
  fetcher?: typeof fetch;
}) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(args.values)) body.set(key, String(value));
  const response = await (args.fetcher ?? fetch)(`${STRIPE_API}${args.path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": args.idempotencyKey,
    },
    body: body.toString(),
  });
  const result = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || `Stripe returned ${response.status}`);
  return result;
}

export async function validateStripeKey(secretKey: string, fetcher: typeof fetch = fetch) {
  const response = await fetcher(`${STRIPE_API}/account`, { headers: { Authorization: `Bearer ${secretKey}` } });
  const result = await response.json() as { id?: string; country?: string; default_currency?: string; error?: { message?: string } };
  if (!response.ok || !result.id) throw new Error(result.error?.message || "Stripe rejected this key");
  return { accountId: result.id, country: result.country, defaultCurrency: result.default_currency };
}

export function createStripeDraft(args: {
  secretKey: string;
  customerId: string;
  projectId: string;
  runId: string;
  itemId: string;
  fetcher?: typeof fetch;
}) {
  return stripePost<{ id: string; status: string }>({
    secretKey: args.secretKey,
    path: "/invoices",
    idempotencyKey: stripeRetryKey("invoice", args.runId, args.itemId),
    fetcher: args.fetcher,
    values: {
      customer: args.customerId,
      collection_method: "send_invoice",
      days_until_due: 30,
      auto_advance: false,
      "metadata[tollgate_project_id]": args.projectId,
      "metadata[tollgate_run_id]": args.runId,
      "metadata[tollgate_item_id]": args.itemId,
    },
  });
}

export function createStripeLineItem(args: {
  secretKey: string;
  customerId: string;
  invoiceId: string;
  projectId: string;
  runId: string;
  itemId: string;
  amountCents: number;
  periodStart: number;
  periodEnd: number;
  fetcher?: typeof fetch;
}) {
  const period = `${new Date(args.periodStart).toISOString().slice(0, 10)} to ${new Date(args.periodEnd - 1).toISOString().slice(0, 10)}`;
  return stripePost<{ id: string }>({
    secretKey: args.secretKey,
    path: "/invoiceitems",
    idempotencyKey: stripeRetryKey("line", args.runId, args.itemId),
    fetcher: args.fetcher,
    values: {
      customer: args.customerId,
      invoice: args.invoiceId,
      amount: args.amountCents,
      currency: "usd",
      description: `AI usage metered by Tollgate, ${period}`,
      "period[start]": Math.floor(args.periodStart / 1_000),
      "period[end]": Math.floor(args.periodEnd / 1_000),
      "metadata[tollgate_project_id]": args.projectId,
      "metadata[tollgate_run_id]": args.runId,
      "metadata[tollgate_item_id]": args.itemId,
    },
  });
}

export function verifyStripeSignature(payload: string, header: string, secret: string, nowSeconds = Math.floor(Date.now() / 1_000)) {
  const fields = header.split(",").map((part) => part.split("=", 2));
  const timestamp = Number(fields.find(([key]) => key === "t")?.[1]);
  const signatures = fields.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300 || !signatures.length) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex"), "hex");
  return signatures.some((signature) => {
    try {
      const actual = Buffer.from(signature, "hex");
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  });
}
