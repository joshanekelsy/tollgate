import { api } from "../../../../../../convex/_generated/api";
import { dashboardClient, noStoreJson } from "@/lib/dashboard-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardClient(projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  const summary = await convex.query(api.calls.summary, { projectId, now: Date.now() });
  return noStoreJson(summary);
}
