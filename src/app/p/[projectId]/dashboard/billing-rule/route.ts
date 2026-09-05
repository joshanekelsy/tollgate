import { api } from "../../../../../../convex/_generated/api";
import { dashboardClient, dashboardMutationClient, noStoreJson } from "@/lib/dashboard-auth";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardClient(projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  const environment = new URL(request.url).searchParams.get("environment") === "test" ? "test" as const : "live" as const;
  const [rule, rules] = await Promise.all([
    convex.query(api.billing.getRule, { projectId, environment }),
    convex.query(api.billing.listRules, { projectId, environment }),
  ]);
  return noStoreJson({ rule, rules, environment });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardMutationClient(request, projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  let body: { mode?: unknown; value?: unknown; environment?: unknown; customerId?: unknown; baseAmountUsd?: unknown; includedTokens?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return noStoreJson({ error: "Invalid price rule" }, { status: 400 }); }
  const environment = body.environment === "test" ? "test" as const : "live" as const;
  const customerId = typeof body.customerId === "string" && body.customerId.trim() ? body.customerId.trim() : undefined;
  const baseAmountUsd = body.baseAmountUsd === undefined ? 0 : body.baseAmountUsd;
  const includedTokens = body.includedTokens === undefined ? 0 : body.includedTokens;
  if ((body.mode !== "percentage" && body.mode !== "per_thousand_tokens")
    || typeof body.value !== "number" || !Number.isFinite(body.value) || body.value < 0
    || typeof baseAmountUsd !== "number" || !Number.isFinite(baseAmountUsd) || baseAmountUsd < 0
    || typeof includedTokens !== "number" || !Number.isSafeInteger(includedTokens) || includedTokens < 0) {
    return noStoreJson({ error: "Enter non-negative pricing values" }, { status: 400 });
  }
  await convex.mutation(api.billing.saveRule, { projectId, environment, customerId, mode: body.mode, value: body.value, baseAmountUsd, includedTokens, now: Date.now() });
  return noStoreJson({ rule: { mode: body.mode, value: body.value, baseAmountUsd, includedTokens } });
}
