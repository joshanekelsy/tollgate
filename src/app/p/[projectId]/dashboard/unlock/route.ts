import { api } from "../../../../../../convex/_generated/api";
import { verifyAccessCode } from "@/lib/access-code";
import { createConvexServiceClient } from "@/lib/convex-service";
import { createDashboardSession, dashboardSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  const convex = createConvexServiceClient();
  if (!convex || !secret) return Response.json({ error: "Dashboard is not configured" }, { status: 503 });
  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    return Response.json({ error: "Access code is incorrect" }, { status: 401 });
  }
  const project = await convex.query(api.projects.getAccessRecord, { projectId });
  if (!project || !(await verifyAccessCode(code, project.dashboardCodeHash))) {
    return Response.json({ error: "Access code is incorrect" }, { status: 401 });
  }
  const token = createDashboardSession(projectId, Date.now(), secret);
  return new Response(null, { status: 204, headers: {
    "set-cookie": dashboardSessionCookie(token, request.url),
    "cache-control": "no-store",
  } });
}
