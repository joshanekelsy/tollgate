import { clearDashboardSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return new Response(null, { status: 204, headers: {
    "set-cookie": clearDashboardSessionCookie(request.url),
    "cache-control": "no-store",
  } });
}
