import { randomBytes } from "node:crypto";
import { api } from "../../../convex/_generated/api";
import { accessCodeLookup, generateAccessCode, hashAccessCode } from "@/lib/access-code";
import { createConvexServiceClient } from "@/lib/convex-service";
import { dashboardPath, dashboardUrl, proxyBaseUrl } from "@/lib/meter-links";
import { generateWriteKey, hashWriteKey, writeKeyPrefix } from "@/lib/write-key";

const sources = new Set(["growthx", "linkedin", "direct", "other"]);
const providers = new Set(["openai", "anthropic", "gemini", "openrouter", "hosted-open-model", "other"]);
const connectedProviders = new Set(["openai", "anthropic", "gemini", "openrouter"]);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid application" }, { status: 400 }); }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const source = typeof body.source === "string" && sources.has(body.source) ? body.source : "other";
  const provider = typeof body.provider === "string" && providers.has(body.provider) ? body.provider : "openai";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : email.split("@")[0];
  const pain = typeof body.pain === "string" ? body.pain.trim().slice(0, 500) : "";
  if (!email || !email.includes("@")) return Response.json({ error: "A valid email is required" }, { status: 400 });

  const convex = createConvexServiceClient();
  if (!convex) return Response.json({ error: "Applications are not configured" }, { status: 503 });
  await convex.mutation(api.applications.apply, {
    name, email, provider: provider as "openai" | "anthropic" | "gemini" | "openrouter" | "hosted-open-model" | "other", pain: pain || undefined, source: source as "growthx" | "linkedin" | "direct" | "other", createdAt: Date.now(),
  });
  if (!connectedProviders.has(provider)) return Response.json({ accepted: true, ready: false });
  const projectId = `meter-${randomBytes(5).toString("hex")}`;
  const accessCode = generateAccessCode();
  const testWriteKey = generateWriteKey("test");
  const liveWriteKey = generateWriteKey("live");
  await convex.mutation(api.projects.create, {
    projectId,
    name: `${name}'s meter`,
    dashboardCodeHash: await hashAccessCode(accessCode),
    dashboardCodeLookup: accessCodeLookup(accessCode),
    createdAt: Date.now(),
    meterKeys: [
      { environment: "test", keyHash: hashWriteKey(testWriteKey), keyPrefix: writeKeyPrefix(testWriteKey) },
      { environment: "live", keyHash: hashWriteKey(liveWriteKey), keyPrefix: writeKeyPrefix(liveWriteKey) },
    ],
  });
  let origin = new URL(request.url).origin;
  const browserOrigin = request.headers.get("origin");
  if (browserOrigin) {
    try {
      const parsed = new URL(browserOrigin);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") origin = parsed.origin;
    } catch {
      // The request URL remains the safe fallback.
    }
  }
  return Response.json({
    accepted: true, ready: true, projectId,
    baseUrl: proxyBaseUrl(origin, projectId),
    dashboardPath: dashboardPath(projectId, "setup"),
    dashboardUrl: dashboardUrl(origin, projectId, "setup"),
    accessCode,
    writeKeys: { test: testWriteKey, live: liveWriteKey },
  });
}
