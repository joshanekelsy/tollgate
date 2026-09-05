import { clearDashboardSessionCookie } from "@/lib/session";
import { isTrustedDashboardMutation, noStoreJson } from "@/lib/dashboard-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedDashboardMutation(request)) return noStoreJson({ error: "Access denied" }, { status: 403 });
  return new Response(null, { status: 204, headers: {
    "set-cookie": clearDashboardSessionCookie(request.url),
    "cache-control": "no-store",
  } });
}
