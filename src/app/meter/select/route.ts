import { api } from "../../../../convex/_generated/api";
import { accessCodeLookup, verifyAccessCode } from "@/lib/access-code";
import { createConvexServiceClient } from "@/lib/convex-service";
import { createDashboardSession, dashboardSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  const convex = createConvexServiceClient();
  if (!convex || !secret) return Response.json({ error: "Meter access is not configured" }, { status: 503 });
  let code = "";
  try {
    const body = await request.json() as { code?: unknown };
    code = typeof body.code === "string" ? body.code.trim() : "";
  } catch {
    return Response.json({ error: "Enter a valid access code" }, { status: 400 });
  }
  if (!code) return Response.json({ error: "Enter a valid access code" }, { status: 400 });

  const project = await convex.query(api.projects.findByCodeLookup, { dashboardCodeLookup: accessCodeLookup(code) });
  if (!project || !(await verifyAccessCode(code, project.dashboardCodeHash))) {
    return Response.json({ error: "That access code was not recognised" }, { status: 401 });
  }

  const token = createDashboardSession(project.projectId, Date.now(), secret);
  return Response.json({ projectId: project.projectId, name: project.name }, { headers: {
    "set-cookie": dashboardSessionCookie(token, request.url),
    "cache-control": "no-store",
  } });
}
