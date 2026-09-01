import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { verifyDashboardSession } from "@/lib/session";

export const runtime = "nodejs";

async function clientFor(projectId: string) {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!secret || !convexUrl) return null;
  const token = (await cookies()).get("tollgate_dashboard_session")?.value;
  if (!token || !verifyDashboardSession(token, projectId, Date.now(), secret)) return null;
  return new ConvexHttpClient(convexUrl);
}

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await clientFor(projectId);
  if (!convex) return Response.json({ error: "Access denied" }, { status: 403 });
  const environment = new URL(request.url).searchParams.get("environment") === "test" ? "test" as const : "live" as const;
  const [rule, rules] = await Promise.all([
    convex.query(api.billing.getRule, { projectId, environment }),
    convex.query(api.billing.listRules, { projectId, environment }),
  ]);
  return Response.json({ rule, rules, environment }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await clientFor(projectId);
  if (!convex) return Response.json({ error: "Access denied" }, { status: 403 });
  let body: { mode?: unknown; value?: unknown; environment?: unknown; customerId?: unknown; baseAmountUsd?: unknown; includedTokens?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return Response.json({ error: "Invalid price rule" }, { status: 400 }); }
  const environment = body.environment === "test" ? "test" as const : "live" as const;
  const customerId = typeof body.customerId === "string" && body.customerId.trim() ? body.customerId.trim() : undefined;
  const baseAmountUsd = body.baseAmountUsd === undefined ? 0 : body.baseAmountUsd;
  const includedTokens = body.includedTokens === undefined ? 0 : body.includedTokens;
  if ((body.mode !== "percentage" && body.mode !== "per_thousand_tokens")
    || typeof body.value !== "number" || !Number.isFinite(body.value) || body.value < 0
    || typeof baseAmountUsd !== "number" || !Number.isFinite(baseAmountUsd) || baseAmountUsd < 0
    || typeof includedTokens !== "number" || !Number.isSafeInteger(includedTokens) || includedTokens < 0) {
    return Response.json({ error: "Enter non-negative pricing values" }, { status: 400 });
  }
  await convex.mutation(api.billing.saveRule, { projectId, environment, customerId, mode: body.mode, value: body.value, baseAmountUsd, includedTokens, now: Date.now() });
  return Response.json({ rule: { mode: body.mode, value: body.value, baseAmountUsd, includedTokens } }, { headers: { "cache-control": "no-store" } });
}
