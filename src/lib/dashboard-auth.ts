import { cookies } from "next/headers";
import { createConvexServiceClient } from "./convex-service";
import { verifyDashboardSession } from "./session";

export async function dashboardClient(projectId: string) {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  const convex = createConvexServiceClient();
  if (!secret || !convex) return null;
  const token = (await cookies()).get("tollgate_dashboard_session")?.value;
  if (!token || !verifyDashboardSession(token, projectId, Date.now(), secret)) return null;
  return convex;
}

export function isTrustedDashboardMutation(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function dashboardMutationClient(request: Request, projectId: string) {
  if (!isTrustedDashboardMutation(request)) return null;
  return dashboardClient(projectId);
}

export function noStoreJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("cache-control", "no-store");
  return Response.json(body, { ...init, headers });
}
