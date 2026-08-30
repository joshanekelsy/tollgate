import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const sources = new Set(["growthx", "linkedin", "direct", "other"]);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid application" }, { status: 400 }); }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const pain = typeof body.pain === "string" ? body.pain.trim().slice(0, 500) : "";
  const source = typeof body.source === "string" && sources.has(body.source) ? body.source : "other";
  if (!name || !email || !email.includes("@")) return Response.json({ error: "Name and valid email are required" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return Response.json({ error: "Applications are not configured" }, { status: 503 });
  const convex = new ConvexHttpClient(url);
  await convex.mutation(api.applications.apply, {
    name, email, provider: "openai", pain: pain || undefined, source: source as "growthx" | "linkedin" | "direct" | "other", createdAt: Date.now(),
  });
  return Response.json({ accepted: true });
}
