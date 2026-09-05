import { createHmac } from "node:crypto";
import { getProviderAdapter } from "./providers/registry";
import { isSafeModelId, SAFE_PRIVATE_ID, safeObject } from "./providers/shared";
import { hashWriteKey, isWriteKey } from "./write-key";
import { estimateRateCardCost } from "./rate-card";
import type { JsonObject, PreparedProviderRequest } from "./providers/types";
import type { ProviderId, SafeCallRecord, TrafficType } from "./types";

export type ProxyDependencies = {
  resolveProject: (projectId: string) => Promise<{ projectId: string; trafficType?: TrafficType } | null>;
  authenticateWriteKey: (projectId: string, keyHash: string) => Promise<{ environment: "test" | "live" } | null>;
  reserveEvent: (args: {
    projectId: string;
    environment: "test" | "live";
    idempotencyKey: string;
    requestFingerprint: string;
    now: number;
  }) => Promise<{ outcome: "accepted" | "duplicate" | "conflict"; callId?: unknown }>;
  resolveRateCard: (
    projectId: string,
    environment: "test" | "live",
    provider: ProviderId,
    model: string,
  ) => Promise<{ rateCardId: string; inputUsdPerMillion: number; outputUsdPerMillion: number } | null>;
  resolveTaskPolicy: (projectId: string, taskId: string) => Promise<{ provider?: ProviderId; approvedModel: string } | null>;
  recordCall: (call: SafeCallRecord) => Promise<unknown>;
  fetchUpstream: typeof fetch;
  now: () => number;
};

const MAX_PROVIDER_RESPONSE_BYTES = 4 * 1024 * 1024;

class ProviderResponseTooLargeError extends Error {}

function error(message: string, status: number) {
  return Response.json({ error: { message, type: "tollgate_request_error" } }, { status });
}

function attribution(request: Request) {
  const fields = {
    taskId: request.headers.get("x-tollgate-task-id"),
    sessionId: request.headers.get("x-tollgate-session-id"),
    agentName: request.headers.get("x-tollgate-agent"),
  };
  for (const value of Object.values(fields)) {
    if (value !== null && !SAFE_PRIVATE_ID.test(value)) return null;
  }
  return {
    taskId: fields.taskId ?? undefined,
    sessionId: fields.sessionId ?? undefined,
    agentName: fields.agentName ?? undefined,
  };
}

function customerId(request: Request) {
  const header = request.headers.get("x-tollgate-customer");
  if (header === null) return "unattributed";
  const value = header.trim();
  return value !== "unattributed" && SAFE_PRIVATE_ID.test(value) ? value : null;
}

function retryId(request: Request) {
  const value = request.headers.get("x-tollgate-idempotency-key")?.trim();
  return value && SAFE_PRIVATE_ID.test(value) ? value : null;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(",")}}`;
}

function fingerprint(writeKey: string, customer: string, prepared: PreparedProviderRequest) {
  const headers = Object.fromEntries([...prepared.headers.entries()].sort(([left], [right]) => left.localeCompare(right)));
  return createHmac("sha256", writeKey).update(canonicalJson({ url: prepared.url, headers, customer, body: prepared.body })).digest("hex");
}

async function requestBody(request: Request) {
  try {
    return safeObject(await request.json());
  } catch {
    return null;
  }
}

function responseHeaders(upstream: Response, provider: ProviderId, providerRequestId: string | undefined) {
  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (providerRequestId) {
    headers.set("x-request-id", providerRequestId);
    if (provider === "anthropic") headers.set("request-id", providerRequestId);
    if (provider === "gemini") headers.set("x-goog-request-id", providerRequestId);
  }
  return headers;
}

export async function readResponseBytes(response: Response, maximumBytes: number): Promise<ArrayBuffer> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw new ProviderResponseTooLargeError(`Provider response exceeded ${maximumBytes} bytes`);
  }
  if (!response.body) return new ArrayBuffer(0);

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel();
        throw new ProviderResponseTooLargeError(`Provider response exceeded ${maximumBytes} bytes`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
}

export async function handleProviderRequest(
  request: Request,
  projectId: string,
  provider: string,
  path: string[],
  deps: ProxyDependencies,
) {
  const project = await deps.resolveProject(projectId);
  if (!project) return error("Unknown or inactive Tollgate project", 404);

  const rawWriteKey = request.headers.get("x-tollgate-key")?.trim();
  if (!isWriteKey(rawWriteKey)) return error("A valid Tollgate write key is required", 401);
  const meterKey = await deps.authenticateWriteKey(projectId, hashWriteKey(rawWriteKey));
  if (!meterKey) return error("The Tollgate write key is invalid or has been rotated", 401);

  const adapter = getProviderAdapter(provider);
  if (!adapter) return error("Unsupported provider", 404);
  const matchedPath = adapter.matchPath(path);
  if (!matchedPath) return error(`Unsupported ${adapter.label} endpoint`, 404);

  const credentialHeaders = adapter.credentialHeaders(request);
  if (!credentialHeaders) return error(`A ${adapter.label} API key is required`, 401);

  const body = await requestBody(request);
  if (!body) return error("Request body must be a JSON object", 400);
  if (adapter.isStreaming(body)) return error("Streaming is not supported yet", 400);

  const requestModel = adapter.requestModel(body, matchedPath);
  if (!isSafeModelId(requestModel)) return error("A valid provider model ID is required", 400);

  const idempotencyKey = retryId(request);
  if (!idempotencyKey) return error("X-Tollgate-Idempotency-Key must be a safe retry ID", 400);

  const trace = attribution(request);
  if (!trace) return error("Tollgate trace IDs may contain only letters, numbers, dot, underscore, colon, and dash", 400);

  const bypassPolicy = request.headers.get("x-tollgate-policy-mode") === "observe";
  const policy = adapter.id === "openai" && trace.taskId && !bypassPolicy
    ? await deps.resolveTaskPolicy(projectId, trace.taskId)
    : null;
  const approvedModel = policy && (!policy.provider || policy.provider === "openai") && isSafeModelId(policy.approvedModel)
    ? policy.approvedModel
    : null;
  const routedModel = approvedModel ?? requestModel;
  const policyApplied = routedModel !== requestModel;
  const resolvedCustomerId = customerId(request);
  if (!resolvedCustomerId) return error("X-Tollgate-Customer must be a safe ID of 1 to 80 characters", 400);
  const prepared = adapter.prepareRequest(body, matchedPath, routedModel, credentialHeaders);
  const reservation = await deps.reserveEvent({
    projectId,
    environment: meterKey.environment,
    idempotencyKey,
    requestFingerprint: fingerprint(rawWriteKey, resolvedCustomerId, prepared),
    now: deps.now(),
  });
  if (reservation.outcome === "duplicate") return error("This retry ID was already received and will not be counted twice", 409);
  if (reservation.outcome === "conflict") return error("This retry ID was already used for a different request", 409);
  const rateCard = await deps.resolveRateCard(projectId, meterKey.environment, adapter.id, routedModel);
  const startedAt = deps.now();

  const recordFailure = async (finishedAt: number, errorCode: string) => deps.recordCall({
    projectId,
    environment: meterKey.environment,
    idempotencyKey,
    eventStatus: "failed",
    pricingStatus: "not_billable",
    pricingSource: "none",
    customerId: resolvedCustomerId,
    createdAt: finishedAt,
    provider: adapter.id,
    requestedModel: routedModel,
    originalRequestedModel: policyApplied ? requestModel : undefined,
    policyApplied,
    promptTokens: 0,
    cachedPromptTokens: 0,
    completionTokens: 0,
    costStatus: "unavailable",
    latencyMs: finishedAt - startedAt,
    status: "error",
    errorCode,
    trafficType: project.trafficType ?? "external",
    privacyMode: "private",
    ...trace,
    toolCallCount: 0,
  });

  let upstream: Response;
  try {
    upstream = await deps.fetchUpstream(prepared.url, {
      method: "POST",
      headers: prepared.headers,
      body: JSON.stringify(prepared.body),
    });
  } catch {
    const finishedAt = deps.now();
    await recordFailure(finishedAt, "upstream_unavailable");
    return error(`${adapter.label} could not be reached`, 502);
  }

  let responseBytes: ArrayBuffer;
  try {
    responseBytes = await readResponseBytes(upstream, MAX_PROVIDER_RESPONSE_BYTES);
  } catch (readError) {
    const finishedAt = deps.now();
    const tooLarge = readError instanceof ProviderResponseTooLargeError;
    await recordFailure(finishedAt, tooLarge ? "upstream_response_too_large" : "upstream_response_unavailable");
    return error(tooLarge ? `${adapter.label} returned a response larger than 4 MiB` : `${adapter.label} response could not be read`, 502);
  }
  const finishedAt = deps.now();
  let parsed: JsonObject | null = null;
  try {
    parsed = safeObject(JSON.parse(new TextDecoder().decode(responseBytes)));
  } catch {
    parsed = null;
  }

  const metadata = adapter.parseResponse(parsed, upstream.headers);
  const adapterCost = adapter.cost(body, routedModel, metadata);
  const cost = adapterCost.costStatus !== "reported" && rateCard
    ? {
        costStatus: "estimated" as const,
        estimatedCostUsd: estimateRateCardCost({
          promptTokens: metadata.promptTokens ?? 0,
          completionTokens: metadata.completionTokens ?? 0,
        }, rateCard),
      }
    : adapterCost;
  const pricingSource = adapterCost.costStatus === "reported"
    ? "provider" as const
    : rateCard
      ? "rate_card" as const
      : adapterCost.costStatus === "estimated"
        ? "built_in" as const
        : "none" as const;
  const callId = await deps.recordCall({
    projectId,
    environment: meterKey.environment,
    idempotencyKey,
    eventStatus: upstream.ok ? "accepted" : "failed",
    pricingStatus: upstream.ok ? cost.costStatus === "unavailable" ? "unpriced" : "priced" : "not_billable",
    pricingSource,
    rateCardId: rateCard?.rateCardId,
    customerId: resolvedCustomerId,
    createdAt: finishedAt,
    provider: adapter.id,
    providerRequestId: metadata.providerRequestId,
    requestedModel: routedModel,
    originalRequestedModel: policyApplied ? requestModel : undefined,
    policyApplied,
    reportedModel: metadata.reportedModel,
    promptTokens: metadata.promptTokens ?? 0,
    cachedPromptTokens: metadata.cachedPromptTokens,
    completionTokens: metadata.completionTokens ?? 0,
    ...cost,
    latencyMs: finishedAt - startedAt,
    status: upstream.ok ? "ok" : "error",
    errorCode: upstream.ok ? undefined : String(upstream.status),
    trafficType: project.trafficType ?? "external",
    privacyMode: "private",
    ...trace,
    toolNames: metadata.toolNames,
    toolCallCount: metadata.toolCallCount,
  });

  const headers = responseHeaders(upstream, adapter.id, metadata.providerRequestId);
  if (typeof callId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(callId)) headers.set("x-tollgate-call-id", callId);
  if (cost.costStatus === "reported") headers.set("x-tollgate-provider-cost-usd", String(cost.providerCostUsd));
  if (cost.costStatus === "estimated") headers.set("x-tollgate-estimated-cost-usd", String(cost.estimatedCostUsd));
  headers.set("x-tollgate-cost-status", cost.costStatus);
  headers.set("x-tollgate-provider", adapter.id);
  headers.set("x-tollgate-routed-model", routedModel);
  headers.set("x-tollgate-policy-applied", policyApplied ? "true" : "false");
  return new Response(responseBytes, { status: upstream.status, statusText: upstream.statusText, headers });
}

export function handleChatCompletion(request: Request, projectId: string, deps: ProxyDependencies) {
  return handleProviderRequest(request, projectId, "openai", ["v1", "chat", "completions"], deps);
}
