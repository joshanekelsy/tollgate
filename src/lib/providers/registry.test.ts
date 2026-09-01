import { describe, expect, it } from "vitest";
import { getProviderAdapter } from "./registry";
import { isSafeModelId } from "./shared";

function request(headers: Record<string, string>) {
  return new Request("https://tollgate.test", { headers });
}

describe("provider adapter registry", () => {
  it("accepts safe provider model IDs without treating the price list as an allowlist", () => {
    expect(isSafeModelId("anthropic/claude-sonnet-4.5:beta")).toBe(true);
    expect(isSafeModelId("models with spaces")).toBe(false);
    expect(isSafeModelId("model?key=secret")).toBe(false);
  });

  it("keeps every adapter on its fixed provider path", () => {
    expect(getProviderAdapter("openai")?.matchPath(["v1", "chat", "completions"])).toEqual({});
    expect(getProviderAdapter("openai")?.matchPath(["v1", "files"])).toBeNull();
    expect(getProviderAdapter("openrouter")?.matchPath(["api", "v1", "chat", "completions"])).toEqual({});
    expect(getProviderAdapter("anthropic")?.matchPath(["v1", "messages"])).toEqual({});
    expect(getProviderAdapter("gemini")?.matchPath(["v1beta", "models", "gemini-2.5-flash:generateContent"])).toEqual({ modelFromPath: "gemini-2.5-flash" });
    expect(getProviderAdapter("gemini")?.matchPath(["v1beta", "models", "gemini-2.5-flash:streamGenerateContent"])).toBeNull();
    expect(getProviderAdapter("unknown")).toBeNull();
  });

  it("translates only the required authentication headers", () => {
    const openai = getProviderAdapter("openai")?.credentialHeaders(request({ authorization: "Bearer openai-secret", "x-private": "do-not-forward" }));
    expect(Object.fromEntries(openai?.entries() ?? [])).toEqual({ authorization: "Bearer openai-secret", "content-type": "application/json" });

    const anthropic = getProviderAdapter("anthropic")?.credentialHeaders(request({ "x-api-key": "anthropic-secret" }));
    expect(Object.fromEntries(anthropic?.entries() ?? [])).toEqual({ "anthropic-version": "2023-06-01", "content-type": "application/json", "x-api-key": "anthropic-secret" });

    const gemini = getProviderAdapter("gemini")?.credentialHeaders(request({ "x-goog-api-key": "gemini-secret" }));
    expect(Object.fromEntries(gemini?.entries() ?? [])).toEqual({ "content-type": "application/json", "x-goog-api-key": "gemini-secret" });
  });

  it("parses OpenRouter usage, tool names, and provider-reported cost", () => {
    const adapter = getProviderAdapter("openrouter")!;
    const metadata = adapter.parseResponse({
      model: "anthropic/claude-sonnet-4.5",
      choices: [{ message: { tool_calls: [{ function: { name: "lookup", arguments: "private" } }] } }],
      usage: { prompt_tokens: 100, completion_tokens: 20, prompt_tokens_details: { cached_tokens: 30 }, cost: 0.0042 },
    }, new Headers({ "x-request-id": "or-123" }));
    expect(metadata).toEqual({
      providerRequestId: "or-123",
      reportedModel: "anthropic/claude-sonnet-4.5",
      promptTokens: 100,
      cachedPromptTokens: 30,
      completionTokens: 20,
      reportedCostUsd: 0.0042,
      toolNames: ["lookup"],
      toolCallCount: 1,
    });
    expect(adapter.cost({}, "anthropic/claude-sonnet-4.5", metadata)).toEqual({ costStatus: "reported", providerCostUsd: 0.0042 });
    expect(JSON.stringify(metadata)).not.toContain("private");
  });

  it("normalizes Anthropic cached input and tool use", () => {
    const adapter = getProviderAdapter("anthropic")!;
    expect(adapter.parseResponse({
      model: "claude-sonnet-4-5",
      content: [{ type: "tool_use", name: "find_order", input: { private: true } }],
      usage: { input_tokens: 70, cache_creation_input_tokens: 20, cache_read_input_tokens: 10, output_tokens: 25 },
    }, new Headers({ "request-id": "ant-123" }))).toEqual({
      providerRequestId: "ant-123",
      reportedModel: "claude-sonnet-4-5",
      promptTokens: 100,
      cachedPromptTokens: 10,
      completionTokens: 25,
      toolNames: ["find_order"],
      toolCallCount: 1,
    });
  });

  it("normalizes Gemini thoughts, cached input, and function calls", () => {
    const adapter = getProviderAdapter("gemini")!;
    expect(adapter.parseResponse({
      modelVersion: "gemini-2.5-flash-001",
      candidates: [{ content: { parts: [{ functionCall: { name: "get_weather", args: { private: true } } }] } }],
      usageMetadata: { promptTokenCount: 80, cachedContentTokenCount: 20, candidatesTokenCount: 30, thoughtsTokenCount: 5 },
    }, new Headers({ "x-goog-request-id": "gem-123" }))).toEqual({
      providerRequestId: "gem-123",
      reportedModel: "gemini-2.5-flash-001",
      promptTokens: 80,
      cachedPromptTokens: 20,
      completionTokens: 35,
      toolNames: ["get_weather"],
      toolCallCount: 1,
    });
  });
});
