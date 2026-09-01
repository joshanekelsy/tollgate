import { apiKeyHeaders, safeInteger, safeObject, safeToolSummary } from "./shared";
import type { JsonObject, ProviderAdapter } from "./types";

const ORIGIN = "https://generativelanguage.googleapis.com";
const SUFFIX = ":generateContent";

function tools(parsed: JsonObject | null) {
  const names: unknown[] = [];
  const candidates = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
  for (const candidateValue of candidates) {
    const parts = safeObject(safeObject(candidateValue)?.content)?.parts;
    for (const partValue of Array.isArray(parts) ? parts : []) names.push(safeObject(safeObject(partValue)?.functionCall)?.name);
  }
  return safeToolSummary(names.filter((name) => name !== undefined));
}

export const geminiAdapter: ProviderAdapter = {
  id: "gemini",
  label: "Gemini",
  matchPath(path) {
    if (path.length !== 3 || path[0] !== "v1beta" || path[1] !== "models" || !path[2].endsWith(SUFFIX)) return null;
    const modelFromPath = path[2].slice(0, -SUFFIX.length);
    return modelFromPath ? { modelFromPath } : null;
  },
  credentialHeaders: (request) => apiKeyHeaders(request, "x-goog-api-key"),
  requestModel: (_body, matched) => matched.modelFromPath,
  isStreaming: () => false,
  prepareRequest: (body, _matched, model, headers) => ({ url: `${ORIGIN}/v1beta/models/${encodeURIComponent(model)}${SUFFIX}`, headers, body }),
  parseResponse(parsed, headers) {
    const usage = safeObject(parsed?.usageMetadata);
    const candidates = safeInteger(usage?.candidatesTokenCount);
    const thoughts = safeInteger(usage?.thoughtsTokenCount) ?? 0;
    return {
      providerRequestId: headers.get("x-request-id") ?? headers.get("x-goog-request-id") ?? undefined,
      reportedModel: typeof parsed?.modelVersion === "string" ? parsed.modelVersion : undefined,
      promptTokens: safeInteger(usage?.promptTokenCount),
      cachedPromptTokens: safeInteger(usage?.cachedContentTokenCount) ?? 0,
      completionTokens: candidates === null ? null : candidates + thoughts,
      ...tools(parsed),
    };
  },
  cost: () => ({ costStatus: "unavailable" }),
};
