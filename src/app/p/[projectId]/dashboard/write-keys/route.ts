import { api } from "../../../../../../convex/_generated/api";
import { dashboardClient, noStoreJson } from "@/lib/dashboard-auth";
import { generateWriteKey, hashWriteKey, writeKeyPrefix } from "@/lib/write-key";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardClient(projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  const keys = await convex.query(api.projects.listKeyMetadata, { projectId });
  return noStoreJson({ keys });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardClient(projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  let environment: "test" | "live" | null = null;
  try {
    const body = await request.json() as { environment?: unknown };
    environment = body.environment === "test" ? "test" : body.environment === "live" ? "live" : null;
  } catch {
    return noStoreJson({ error: "Choose test or live" }, { status: 400 });
  }
  if (!environment) return noStoreJson({ error: "Choose test or live" }, { status: 400 });
  const key = generateWriteKey(environment);
  await convex.mutation(api.projects.rotateWriteKey, {
    projectId,
    environment,
    keyHash: hashWriteKey(key),
    keyPrefix: writeKeyPrefix(key),
    now: Date.now(),
  });
  return noStoreJson({ environment, key, keyPrefix: writeKeyPrefix(key) });
}
