import { cookies } from "next/headers";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { createConvexServiceClient } from "@/lib/convex-service";
import { verifyDashboardSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  const convex = createConvexServiceClient();
  if (!secret || !convex) return Response.json({ error: "Dashboard is not configured" }, { status: 503 });
  const token = (await cookies()).get("tollgate_dashboard_session")?.value;
  if (!token) return Response.json({ error: "Locked" }, { status: 401 });
  if (!verifyDashboardSession(token, projectId, Date.now(), secret)) return Response.json({ error: "Access denied" }, { status: 403 });
  let body: { callId?: unknown; score?: unknown };
  try { body = (await request.json()) as typeof body; }
  catch { return Response.json({ error: "Invalid feedback" }, { status: 400 }); }
  if (typeof body.callId !== "string" || (body.score !== "helpful" && body.score !== "not_helpful")) {
    return Response.json({ error: "Invalid feedback" }, { status: 400 });
  }
  try {
    await convex.mutation(api.calls.recordQuality, { projectId, callId: body.callId as Id<"calls">, score: body.score, recordedAt: Date.now() });
  } catch {
    return Response.json({ error: "Call not found" }, { status: 404 });
  }
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
