import type { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { dashboardMutationClient, noStoreJson } from "@/lib/dashboard-auth";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardMutationClient(request, projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  let body: { callId?: unknown; score?: unknown };
  try { body = (await request.json()) as typeof body; }
  catch { return noStoreJson({ error: "Invalid feedback" }, { status: 400 }); }
  if (typeof body.callId !== "string" || (body.score !== "helpful" && body.score !== "not_helpful")) {
    return noStoreJson({ error: "Invalid feedback" }, { status: 400 });
  }
  try {
    await convex.mutation(api.calls.recordQuality, { projectId, callId: body.callId as Id<"calls">, score: body.score, recordedAt: Date.now() });
  } catch {
    return noStoreJson({ error: "Call not found" }, { status: 404 });
  }
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
