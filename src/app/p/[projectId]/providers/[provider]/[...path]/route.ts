import { api } from "../../../../../../../convex/_generated/api";
import { createConvexServiceClient } from "@/lib/convex-service";
import { handleProviderRequest } from "@/lib/proxy";
import type { SafeCallRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string; provider: string; path: string[] }> },
) {
  const { projectId, provider, path } = await context.params;
  const convex = createConvexServiceClient();
  if (!convex) return Response.json({ error: { message: "Tollgate is not configured" } }, { status: 503 });

  return handleProviderRequest(request, projectId, provider, path, {
    resolveProject: async (id) => convex.query(api.projects.resolveActive, { projectId: id }),
    authenticateWriteKey: async (id, keyHash) => convex.query(api.projects.authenticateWriteKey, { projectId: id, keyHash }),
    reserveEvent: async (args) => convex.mutation(api.calls.reserve, args),
    resolveRateCard: async (id, environment, providerId, model) => convex.query(api.rateCards.resolve, {
      projectId: id,
      environment,
      provider: providerId,
      model,
    }),
    resolveTaskPolicy: async (id, taskId) => convex.query(api.taskPolicies.resolve, { projectId: id, taskId }),
    recordCall: async (call: SafeCallRecord) => convex.mutation(api.calls.record, call),
    fetchUpstream: fetch,
    now: Date.now,
  });
}
