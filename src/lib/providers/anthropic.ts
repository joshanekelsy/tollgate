import { apiKeyHeaders, safeInteger, safeObject, safeToolSummary } from "./shared";
import type { JsonObject, ProviderAdapter } from "./types";

const ORIGIN = "https://api.anthropic.com";

function tools(parsed: JsonObject | null) {
  const content = Array.isArray(parsed?.content) ? parsed.content : [];
  const names = content.map((value) => {
    const block = safeObject(value);
    return block?.type === "tool_use" ? block.name : undefined;
  }).filter((value) => value !== undefined);
  return safeToolSummary(names);
}

export const anthropicAdapter: ProviderAdapter = {
  id: "anthropic",
  label: "Anthropic",
  matchPath: (path) => path.join("/") === "v1/messages" ? {} : null,
  credentialHeaders(request) {
    const headers = apiKeyHeaders(request, "x-api-key");
    if (!headers) return null;
    const version = request.headers.get("anthropic-version");
    headers.set("anthropic-version", version && /^\d{4}-\d{2}-\d{2}$/.test(version) ? version : "2023-06-01");
    const beta = request.headers.get("anthropic-beta");
    if (beta && /^[A-Za-z0-9,._ -]{1,300}$/.test(beta)) headers.set("anthropic-beta", beta);
    return headers;
  },
  requestModel: (body) => body.model,
  isStreaming: (body) => body.stream === true,
  prepareRequest: (body, _matched, model, headers) => ({ url: `${ORIGIN}/v1/messages`, headers, body: body.model === model ? body : { ...body, model } }),
  parseResponse(parsed, headers) {
    const usage = safeObject(parsed?.usage);
    const input = safeInteger(usage?.input_tokens);
    const cacheCreation = safeInteger(usage?.cache_creation_input_tokens) ?? 0;
    const cacheRead = safeInteger(usage?.cache_read_input_tokens) ?? 0;
    return {
      providerRequestId: headers.get("request-id") ?? headers.get("x-request-id") ?? undefined,
      reportedModel: typeof parsed?.model === "string" ? parsed.model : undefined,
      promptTokens: input === null ? null : input + cacheCreation + cacheRead,
      cachedPromptTokens: cacheRead,
      completionTokens: safeInteger(usage?.output_tokens),
      ...tools(parsed),
    };
  },
  cost: () => ({ costStatus: "unavailable" }),
};
