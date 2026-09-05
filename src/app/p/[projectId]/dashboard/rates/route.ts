import { api } from "../../../../../../convex/_generated/api";
import { dashboardClient, dashboardMutationClient, noStoreJson } from "@/lib/dashboard-auth";
import { isSafeModelId } from "@/lib/providers/shared";
import type { ProviderId } from "@/lib/types";

export const runtime = "nodejs";

const providers = new Set<ProviderId>(["openai", "anthropic", "gemini", "openrouter"]);
const selectedEnvironment = (value: unknown) => value === "test" ? "test" as const : value === "live" ? "live" as const : null;

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardClient(projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  const environment = selectedEnvironment(new URL(request.url).searchParams.get("environment")) ?? "live";
  const rates = await convex.query(api.rateCards.list, { projectId, environment });
  return noStoreJson({ rates, environment });
}

async function bodyFor(request: Request) {
  try { return await request.json() as Record<string, unknown>; }
  catch { return null; }
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardMutationClient(request, projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  const body = await bodyFor(request);
  const environment = selectedEnvironment(body?.environment);
  const provider = typeof body?.provider === "string" && providers.has(body.provider as ProviderId) ? body.provider as ProviderId : null;
  const model = body?.model;
  const input = body?.inputUsdPerMillion;
  const output = body?.outputUsdPerMillion;
  if (!environment || !provider || !isSafeModelId(model) || typeof input !== "number" || !Number.isFinite(input) || input < 0 || typeof output !== "number" || !Number.isFinite(output) || output < 0) {
    return noStoreJson({ error: "Enter a provider, exact model ID, and non-negative input and output rates" }, { status: 400 });
  }
  await convex.mutation(api.rateCards.save, { projectId, environment, provider, model, inputUsdPerMillion: input, outputUsdPerMillion: output, now: Date.now() });
  return noStoreJson({ saved: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const convex = await dashboardMutationClient(request, projectId);
  if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
  const body = await bodyFor(request);
  const environment = selectedEnvironment(body?.environment);
  const provider = typeof body?.provider === "string" && providers.has(body.provider as ProviderId) ? body.provider as ProviderId : null;
  const model = body?.model;
  if (!environment || !provider || !isSafeModelId(model)) return noStoreJson({ error: "Unknown rate card" }, { status: 400 });
  await convex.mutation(api.rateCards.remove, { projectId, environment, provider, model, now: Date.now() });
  return noStoreJson({ removed: true });
}
