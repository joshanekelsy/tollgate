import { api } from "../../../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../../../convex/_generated/dataModel";
import { dashboardClient } from "@/lib/dashboard-auth";
import { billingRunCsv } from "@/lib/csv";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string; runId: string }> }) {
  const { projectId, runId } = await context.params;
  const convex = await dashboardClient(projectId);
  if (!convex) return Response.json({ error: "Access denied" }, { status: 403 });
  const run = await convex.query(api.billingRuns.get, { projectId, runId: runId as Id<"billingRuns"> });
  if (!run) return Response.json({ error: "Billing run not found" }, { status: 404 });
  const csv = billingRunCsv(run);
  const filename = `tollgate-${projectId}-${new Date(run.periodStart).toISOString().slice(0, 7)}.csv`;
  return new Response(csv, { headers: {
    "content-type": "text/csv; charset=utf-8",
    "content-disposition": `attachment; filename="${filename}"`,
    "cache-control": "no-store",
  } });
}
