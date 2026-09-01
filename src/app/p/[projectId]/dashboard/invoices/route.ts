import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { verifyDashboardSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const token = (await cookies()).get("tollgate_dashboard_session")?.value;
  if (!secret || !convexUrl || !token || !verifyDashboardSession(token, projectId, Date.now(), secret)) return Response.json({ error: "Access denied" }, { status: 403 });
  const now = new Date();
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const nextMonthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  const convex = new ConvexHttpClient(convexUrl);
  const invoice = await convex.query(api.billing.currentMonth, { projectId, monthStart, nextMonthStart });
  return Response.json({ ...invoice, monthStart }, { headers: { "cache-control": "no-store" } });
}
