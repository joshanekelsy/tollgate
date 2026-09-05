import { api } from "../../../../../../convex/_generated/api";
import { dashboardMutationClient, noStoreJson } from "@/lib/dashboard-auth";
import { isSupportedModel } from "@/lib/pricing";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardMutationClient(request, projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  let body: { taskId?: unknown; approvedModel?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return noStoreJson({ error: "Invalid policy" }, { status: 400 }); }
  if (typeof body.taskId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(body.taskId) || !isSupportedModel(body.approvedModel)) return noStoreJson({ error: "Invalid policy" }, { status: 400 });
  await convex.mutation(api.taskPolicies.approve, { projectId, taskId: body.taskId, provider: "openai", approvedModel: body.approvedModel, now: Date.now() });
  return noStoreJson({ taskId: body.taskId, provider: "openai", approvedModel: body.approvedModel });
}

export async function DELETE(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardMutationClient(request, projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  let body: { taskId?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return noStoreJson({ error: "Invalid policy" }, { status: 400 }); }
  if (typeof body.taskId !== "string") return noStoreJson({ error: "Invalid policy" }, { status: 400 });
  await convex.mutation(api.taskPolicies.remove, { projectId, taskId: body.taskId, now: Date.now() });
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
