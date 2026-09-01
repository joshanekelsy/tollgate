import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return Response.json({
    ok: false,
    checkedAt: Date.now(),
    services: [{ name: "Web application", status: "operational" }, { name: "Metering datastore", status: "degraded" }],
  }, { status: 503, headers: { "cache-control": "no-store" } });
  try {
    const result = await new ConvexHttpClient(convexUrl).query(api.health.check, {});
    return Response.json({
      ok: result.ok,
      checkedAt: result.checkedAt,
      services: [{ name: "Web application", status: "operational" }, { name: "Metering datastore", status: "operational" }],
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({
      ok: false,
      checkedAt: Date.now(),
      services: [{ name: "Web application", status: "operational" }, { name: "Metering datastore", status: "degraded" }],
    }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
