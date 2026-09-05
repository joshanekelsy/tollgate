import { cookies } from "next/headers";
import { api } from "../../../../../../convex/_generated/api";
import { createConvexServiceClient } from "@/lib/convex-service";
import { verifyDashboardSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  const convex = createConvexServiceClient();
  if (!secret || !convex) return Response.json({ error: "Dashboard is not configured" }, { status: 503 });
  const token = (await cookies()).get("tollgate_dashboard_session")?.value;
  if (!token) return Response.json({ error: "Locked" }, { status: 401, headers: { "cache-control": "no-store" } });
  if (!verifyDashboardSession(token, projectId, Date.now(), secret)) {
    return Response.json({ error: "Access denied" }, { status: 403, headers: { "cache-control": "no-store" } });
  }
  const summary = await convex.query(api.calls.summary, { projectId, now: Date.now() });
  return Response.json(summary, { headers: { "cache-control": "no-store" } });
}
