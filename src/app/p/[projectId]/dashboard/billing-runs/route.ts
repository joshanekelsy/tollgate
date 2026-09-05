import { api } from "../../../../../../convex/_generated/api";
import { dashboardClient, dashboardMutationClient, noStoreJson } from "@/lib/dashboard-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function utcMonth(value: number) {
  const date = new Date(value);
  return Number.isFinite(value)
    && value === Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

function periodFromUrl(url: string) {
  const parsed = new URL(url);
  const startValue = Number(parsed.searchParams.get("periodStart"));
  const endValue = Number(parsed.searchParams.get("periodEnd"));
  if (utcMonth(startValue) && utcMonth(endValue) && endValue === Date.UTC(new Date(startValue).getUTCFullYear(), new Date(startValue).getUTCMonth() + 1, 1)) {
    return { periodStart: startValue, periodEnd: endValue };
  }
  const now = new Date();
  return {
    periodStart: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    periodEnd: Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  };
}

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardClient(projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  const period = periodFromUrl(request.url);
  const [runs, preview] = await Promise.all([
    convex.query(api.billingRuns.list, { projectId }),
    convex.query(api.billing.previewPeriod, { projectId, environment: "live", ...period }),
  ]);
  return noStoreJson({ runs, preview });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardMutationClient(request, projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  let periodStart = Number.NaN;
  let periodEnd = Number.NaN;
  try {
    const body = await request.json() as { periodStart?: unknown; periodEnd?: unknown };
    periodStart = typeof body.periodStart === "number" ? body.periodStart : Number.NaN;
    periodEnd = typeof body.periodEnd === "number" ? body.periodEnd : Number.NaN;
  } catch {
    return noStoreJson({ error: "Choose a completed UTC month" }, { status: 400 });
  }
  const expectedEnd = utcMonth(periodStart)
    ? Date.UTC(new Date(periodStart).getUTCFullYear(), new Date(periodStart).getUTCMonth() + 1, 1)
    : Number.NaN;
  if (!utcMonth(periodStart) || !utcMonth(periodEnd) || periodEnd !== expectedEnd || periodEnd > Date.now()) {
    return noStoreJson({ error: "Only a completed UTC month can be closed" }, { status: 400 });
  }
  const result = await convex.mutation(api.billingRuns.closePeriod, { projectId, periodStart, periodEnd, now: Date.now() });
  return noStoreJson(result, { status: result.closed ? 200 : 409 });
}
