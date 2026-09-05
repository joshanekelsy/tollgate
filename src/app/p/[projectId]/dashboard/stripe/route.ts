import { api } from "../../../../../../convex/_generated/api";
import { dashboardClient, dashboardMutationClient, noStoreJson } from "@/lib/dashboard-auth";
import { sealSecret } from "@/lib/secret-box";
import { validateStripeKey } from "@/lib/stripe";

export const runtime = "nodejs";

function keyPrefix(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardClient(projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  const connection = await convex.query(api.stripe.getMetadata, { projectId });
  const webhookUrl = `${new URL(request.url).origin}/api/stripe/webhook/${encodeURIComponent(projectId)}`;
  return noStoreJson({ connection, webhookUrl });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardMutationClient(request, projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  const master = process.env.STRIPE_KEY_ENCRYPTION_SECRET;
  if (!master || Buffer.byteLength(master) < 32) return noStoreJson({ error: "Stripe secret storage is not configured" }, { status: 503 });
  let secretKey = "";
  let webhookSecret = "";
  try {
    const body = await request.json() as { secretKey?: unknown; webhookSecret?: unknown };
    secretKey = typeof body.secretKey === "string" ? body.secretKey.trim() : "";
    webhookSecret = typeof body.webhookSecret === "string" ? body.webhookSecret.trim() : "";
  } catch {
    return noStoreJson({ error: "Enter a Stripe restricted key and webhook secret" }, { status: 400 });
  }
  if (!/^(?:rk|sk)_(?:test|live)_[A-Za-z0-9_]{12,}$/.test(secretKey) || !/^whsec_[A-Za-z0-9_]{12,}$/.test(webhookSecret)) {
    return noStoreJson({ error: "Enter a valid Stripe restricted key and whsec_ webhook secret" }, { status: 400 });
  }
  try {
    const account = await validateStripeKey(secretKey);
    if (account.country !== "US") return noStoreJson({ error: "Tollgate V1 supports US Stripe accounts only" }, { status: 400 });
    await convex.mutation(api.stripe.saveConnection, {
      projectId,
      encryptedSecretKey: sealSecret(secretKey, master, `${projectId}:stripe-key`),
      encryptedWebhookSecret: sealSecret(webhookSecret, master, `${projectId}:stripe-webhook`),
      keyPrefix: keyPrefix(secretKey),
      accountId: account.accountId,
      accountCountry: account.country,
      livemode: secretKey.includes("_live_"),
      now: Date.now(),
    });
    return noStoreJson({ saved: true, accountId: account.accountId, livemode: secretKey.includes("_live_") });
  } catch (error) {
    return noStoreJson({ error: error instanceof Error ? error.message.slice(0, 200) : "Stripe rejected this key" }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardMutationClient(request, projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  await convex.mutation(api.stripe.removeConnection, { projectId });
  return noStoreJson({ removed: true });
}
