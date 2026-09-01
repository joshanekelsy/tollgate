import { priceCall } from "../pricing";
import { bearerHeaders, safeInteger, safeObject, safeToolSummary } from "./shared";
import type { JsonObject, ProviderAdapter } from "./types";

const ORIGIN = "https://api.openai.com";

function tools(parsed: JsonObject | null) {
  const names: unknown[] = [];
  const choices = Array.isArray(parsed?.choices) ? parsed.choices : [];
  for (const choiceValue of choices) {
    const choice = safeObject(choiceValue);
    const message = safeObject(choice?.message);
    const calls = Array.isArray(message?.tool_calls) ? message.tool_calls : [];
    for (const callValue of calls) {
      const call = safeObject(callValue);
      names.push(safeObject(call?.function)?.name);
    }
  }
  return safeToolSummary(names);
}

export const openaiAdapter: ProviderAdapter = {
  id: "openai",
  label: "OpenAI",
  matchPath: (path) => path.join("/") === "v1/chat/completions" ? {} : null,
  credentialHeaders(request) {
    const headers = bearerHeaders(request);
    if (!headers) return null;
    for (const name of ["openai-organization", "openai-project"]) {
      const value = request.headers.get(name);
      if (value && value.length <= 200) headers.set(name, value);
    }
    return headers;
  },
  requestModel: (body) => body.model,
  isStreaming: (body) => body.stream === true,
  prepareRequest: (body, _matched, model, headers) => ({ url: `${ORIGIN}/v1/chat/completions`, headers, body: body.model === model ? body : { ...body, model } }),
  parseResponse(parsed, headers) {
    const usage = safeObject(parsed?.usage);
    const promptDetails = safeObject(usage?.prompt_tokens_details);
    return {
      providerRequestId: headers.get("x-request-id") ?? undefined,
      reportedModel: typeof parsed?.model === "string" ? parsed.model : undefined,
      promptTokens: safeInteger(usage?.prompt_tokens),
      cachedPromptTokens: safeInteger(promptDetails?.cached_tokens) ?? 0,
      completionTokens: safeInteger(usage?.completion_tokens),
      ...tools(parsed),
    };
  },
  cost(body, model, metadata) {
    if (metadata.promptTokens === null || metadata.completionTokens === null) return { costStatus: "unavailable" };
    const exceptionalPricing = "tools" in body || "modalities" in body ||
      ("service_tier" in body && body.service_tier !== "default" && body.service_tier !== "auto");
    return priceCall({
      promptTokens: metadata.promptTokens,
      cachedPromptTokens: metadata.cachedPromptTokens,
      completionTokens: metadata.completionTokens,
      exceptionalPricing,
    }, model);
  },
};
