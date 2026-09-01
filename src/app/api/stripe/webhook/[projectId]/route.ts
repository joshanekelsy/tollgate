import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { openSecret } from "@/lib/secret-box";
import { verifyStripeSignature } from "@/lib/stripe";

export const runtime = "nodejs";

type StripeEvent = {
  id?: unknown;
  type?: unknown;
  data?: { object?: { id?: unknown; status?: unknown; metadata?: Record<string, unknown> } };
};

function invoiceStatus(type: string, objectStatus: unknown) {
  if (type === "invoice.paid" || objectStatus === "paid") return "paid" as const;
  if (type === "invoice.voided" || objectStatus === "void") return "void" as const;
  if (type === "invoice.payment_failed") return "failed" as const;
  if (type === "invoice.finalized" || type === "invoice.sent" || objectStatus === "open") return "open" as const;
  return "draft" as const;
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const master = process.env.STRIPE_KEY_ENCRYPTION_SECRET;
  if (!convexUrl || !master) return Response.json({ error: "Webhook is not configured" }, { status: 503 });
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  const convex = new ConvexHttpClient(convexUrl);
  const connection = await convex.query(api.stripe.getConnection, { projectId });
  if (!connection) return Response.json({ error: "Stripe connection not found" }, { status: 404 });
  let webhookSecret: string;
  try { webhookSecret = openSecret(connection.encryptedWebhookSecret, master, `${projectId}:stripe-webhook`); }
  catch { return Response.json({ error: "Webhook secret cannot be opened" }, { status: 503 }); }
  if (!verifyStripeSignature(payload, signature, webhookSecret)) return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });
  let event: StripeEvent;
  try { event = JSON.parse(payload) as StripeEvent; }
  catch { return Response.json({ error: "Invalid Stripe event" }, { status: 400 }); }
  const eventId = typeof event.id === "string" ? event.id : "";
  const eventType = typeof event.type === "string" ? event.type : "";
  const invoice = event.data?.object;
  const invoiceId = typeof invoice?.id === "string" ? invoice.id : "";
  if (!/^evt_[A-Za-z0-9_]+$/.test(eventId) || !eventType.startsWith("invoice.") || !/^in_[A-Za-z0-9_]+$/.test(invoiceId)) {
    return Response.json({ received: true, ignored: true });
  }
  const metadataProject = invoice?.metadata?.tollgate_project_id;
  if (typeof metadataProject === "string" && metadataProject !== projectId) return Response.json({ error: "Project mismatch" }, { status: 400 });
  const result = await convex.mutation(api.stripe.recordWebhook, {
    projectId,
    eventId,
    eventType,
    stripeInvoiceId: invoiceId,
    stripeStatus: invoiceStatus(eventType, invoice?.status),
    now: Date.now(),
  });
  return Response.json({ received: true, ...result });
}
