import { bearerHeaders, safeCost, safeInteger, safeObject, safeToolSummary } from "./shared";
import type { JsonObject, ProviderAdapter } from "./types";

const ORIGIN = "https://openrouter.ai";

function tools(parsed: JsonObject | null) {
  const names: unknown[] = [];
  const choices = Array.isArray(parsed?.choices) ? parsed.choices : [];
  for (const choiceValue of choices) {
    const message = safeObject(safeObject(choiceValue)?.message);
    const calls = Array.isArray(message?.tool_calls) ? message.tool_calls : [];
    for (const callValue of calls) names.push(safeObject(safeObject(callValue)?.function)?.name);
  }
  return safeToolSummary(names);
}

export const openrouterAdapter: ProviderAdapter = {
  id: "openrouter",
  label: "OpenRouter",
  matchPath: (path) => path.join("/") === "api/v1/chat/completions" ? {} : null,
  credentialHeaders: bearerHeaders,
  requestModel: (body) => body.model,
  isStreaming: (body) => body.stream === true,
  prepareRequest: (body, _matched, model, headers) => ({ url: `${ORIGIN}/api/v1/chat/completions`, headers, body: body.model === model ? body : { ...body, model } }),
  parseResponse(parsed, headers) {
    const usage = safeObject(parsed?.usage);
    const promptDetails = safeObject(usage?.prompt_tokens_details);
    return {
      providerRequestId: headers.get("x-request-id") ?? undefined,
      reportedModel: typeof parsed?.model === "string" ? parsed.model : undefined,
      promptTokens: safeInteger(usage?.prompt_tokens),
      cachedPromptTokens: safeInteger(promptDetails?.cached_tokens) ?? 0,
      completionTokens: safeInteger(usage?.completion_tokens),
      reportedCostUsd: safeCost(usage?.cost),
      ...tools(parsed),
    };
  },
  cost(_body, _model, metadata) {
    return metadata.reportedCostUsd === undefined
      ? { costStatus: "unavailable" }
      : { costStatus: "reported", providerCostUsd: metadata.reportedCostUsd };
  },
};
