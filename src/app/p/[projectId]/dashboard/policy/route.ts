import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { verifyDashboardSession } from "@/lib/session";
import { isSupportedModel } from "@/lib/pricing";

export const runtime = "nodejs";

async function authorized(projectId: string) {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!secret || !convexUrl) return null;
  const token = (await cookies()).get("tollgate_dashboard_session")?.value;
  if (!token || !verifyDashboardSession(token, projectId, Date.now(), secret)) return null;
  return new ConvexHttpClient(convexUrl);
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await authorized(projectId);
  if (!convex) return Response.json({ error: "Access denied" }, { status: 403 });
  let body: { taskId?: unknown; approvedModel?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return Response.json({ error: "Invalid policy" }, { status: 400 }); }
  if (typeof body.taskId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(body.taskId) || !isSupportedModel(body.approvedModel)) return Response.json({ error: "Invalid policy" }, { status: 400 });
  await convex.mutation(api.taskPolicies.approve, { projectId, taskId: body.taskId, provider: "openai", approvedModel: body.approvedModel, now: Date.now() });
  return Response.json({ taskId: body.taskId, provider: "openai", approvedModel: body.approvedModel }, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await authorized(projectId);
  if (!convex) return Response.json({ error: "Access denied" }, { status: 403 });
  let body: { taskId?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return Response.json({ error: "Invalid policy" }, { status: 400 }); }
  if (typeof body.taskId !== "string") return Response.json({ error: "Invalid policy" }, { status: 400 });
  await convex.mutation(api.taskPolicies.remove, { projectId, taskId: body.taskId, now: Date.now() });
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
