import { api } from "../../../../../../convex/_generated/api";
import { dashboardClient, noStoreJson } from "@/lib/dashboard-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardClient(projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  const environment = new URL(request.url).searchParams.get("environment") === "test" ? "test" : "live";
  const events = await convex.query(api.calls.events, { projectId, environment, limit: 200 });
  return noStoreJson({ events, environment });
}
