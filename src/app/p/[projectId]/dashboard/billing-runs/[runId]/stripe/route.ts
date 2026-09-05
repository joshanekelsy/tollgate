import { api } from "../../../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../../../convex/_generated/dataModel";
import { dashboardMutationClient, noStoreJson } from "@/lib/dashboard-auth";
import { openSecret } from "@/lib/secret-box";
import { createStripeDraft, createStripeLineItem } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ projectId: string; runId: string }> }) {
  const { projectId, runId } = await context.params;
  const convex = await dashboardMutationClient(request, projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  const master = process.env.STRIPE_KEY_ENCRYPTION_SECRET;
  if (!master) return noStoreJson({ error: "Stripe secret storage is not configured" }, { status: 503 });
  const typedRunId = runId as Id<"billingRuns">;
  const [run, connection] = await Promise.all([
    convex.query(api.billingRuns.get, { projectId, runId: typedRunId }),
    convex.query(api.stripe.getConnection, { projectId }),
  ]);
  if (!run) return noStoreJson({ error: "Billing run not found" }, { status: 404 });
  if (!connection) return noStoreJson({ error: "Connect Stripe in Setup first" }, { status: 409 });
  let secretKey: string;
  try { secretKey = openSecret(connection.encryptedSecretKey, master, `${projectId}:stripe-key`); }
  catch { return noStoreJson({ error: "The Stripe connection cannot be opened. Reconnect it in Setup." }, { status: 503 }); }
  await convex.mutation(api.billingRuns.beginStripeExport, { projectId, runId: typedRunId });
  for (const item of run.items) {
    if (["draft", "open", "paid", "void"].includes(item.stripeStatus)) continue;
    if (!item.stripeCustomerId) {
      await convex.mutation(api.billingRuns.recordStripeResult, {
        projectId,
        itemId: item._id,
        stripeStatus: "failed",
        error: "Customer has no Stripe customer ID",
        now: Date.now(),
      });
      continue;
    }
    try {
      let invoiceId = item.stripeInvoiceId;
      if (!invoiceId) {
        const invoice = await createStripeDraft({
          secretKey,
          customerId: item.stripeCustomerId,
          projectId,
          runId,
          itemId: item._id,
        });
        invoiceId = invoice.id;
        await convex.mutation(api.billingRuns.recordStripeInvoice, { projectId, itemId: item._id, stripeInvoiceId: invoiceId, now: Date.now() });
      }
      await createStripeLineItem({
        secretKey,
        customerId: item.stripeCustomerId,
        invoiceId,
        projectId,
        runId,
        itemId: item._id,
        amountCents: item.amountCents,
        periodStart: run.periodStart,
        periodEnd: run.periodEnd,
      });
      await convex.mutation(api.billingRuns.recordStripeResult, { projectId, itemId: item._id, stripeStatus: "draft", now: Date.now() });
    } catch (error) {
      await convex.mutation(api.billingRuns.recordStripeResult, {
        projectId,
        itemId: item._id,
        stripeStatus: "failed",
        error: error instanceof Error ? error.message.slice(0, 200) : "Stripe export failed",
        now: Date.now(),
      });
    }
  }
  const updated = await convex.query(api.billingRuns.get, { projectId, runId: typedRunId });
  return noStoreJson({ run: updated }, { status: updated?.status === "partial" ? 207 : 200 });
}
