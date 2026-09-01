import { ConvexHttpClient } from "convex/browser";
import { cookies } from "next/headers";
import { verifyDashboardSession } from "./session";

export async function dashboardClient(projectId: string) {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!secret || !convexUrl) return null;
  const token = (await cookies()).get("tollgate_dashboard_session")?.value;
  if (!token || !verifyDashboardSession(token, projectId, Date.now(), secret)) return null;
  return new ConvexHttpClient(convexUrl);
}

export function noStoreJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("cache-control", "no-store");
  return Response.json(body, { ...init, headers });
}
