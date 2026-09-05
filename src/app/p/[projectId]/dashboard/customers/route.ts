import { api } from "../../../../../../convex/_generated/api";
import { dashboardClient, dashboardMutationClient, noStoreJson } from "@/lib/dashboard-auth";
import { SAFE_PRIVATE_ID } from "@/lib/providers/shared";

export const runtime = "nodejs";

function environment(value: unknown) {
  return value === "test" ? "test" as const : value === "live" ? "live" as const : null;
}

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardClient(projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  const selected = environment(new URL(request.url).searchParams.get("environment")) ?? "live";
  const customers = await convex.query(api.customers.list, { projectId, environment: selected });
  return noStoreJson({ customers, environment: selected });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardMutationClient(request, projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return noStoreJson({ error: "Customer details must be valid JSON" }, { status: 400 }); }
  const selected = environment(body.environment);
  const customerId = typeof body.customerId === "string" ? body.customerId.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const billingEmail = typeof body.billingEmail === "string" ? body.billingEmail.trim().toLowerCase().slice(0, 200) : "";
  const stripeCustomerId = typeof body.stripeCustomerId === "string" ? body.stripeCustomerId.trim() : "";
  const status = body.status === "archived" ? "archived" as const : "active" as const;
  if (!selected || !SAFE_PRIVATE_ID.test(customerId) || customerId === "unattributed") {
    return noStoreJson({ error: "Use a safe customer ID other than unattributed" }, { status: 400 });
  }
  if (billingEmail && (!billingEmail.includes("@") || billingEmail.startsWith("@") || billingEmail.endsWith("@"))) {
    return noStoreJson({ error: "Enter a valid billing email" }, { status: 400 });
  }
  if (stripeCustomerId && !/^cus_[A-Za-z0-9]{8,64}$/.test(stripeCustomerId)) {
    return noStoreJson({ error: "Stripe customer IDs start with cus_" }, { status: 400 });
  }
  await convex.mutation(api.customers.upsert, {
    projectId,
    environment: selected,
    customerId,
    name: name || undefined,
    billingEmail: billingEmail || undefined,
    stripeCustomerId: stripeCustomerId || undefined,
    status,
    now: Date.now(),
  });
  return noStoreJson({ saved: true });
}
