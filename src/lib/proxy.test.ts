import { describe, expect, it, vi } from "vitest";
import { handleChatCompletion, handleProviderRequest, readResponseBytes } from "./proxy";
import { buildInvoiceRows } from "./billing";
import type { SafeCallRecord } from "./types";

const tollgateHeaders = {
  "x-tollgate-key": `tgw_test_${"a".repeat(43)}`,
  "x-tollgate-idempotency-key": "event-provider",
};

function request(body: unknown, authorization = "Bearer test-provider-key", traceHeaders: Record<string, string> = {}) {
  return new Request("https://tollgate.test/p/demo/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization,
      "content-type": "application/json",
      "x-do-not-forward": "secret",
      "x-tollgate-key": `tgw_test_${"a".repeat(43)}`,
      "x-tollgate-idempotency-key": "event-default",
      ...traceHeaders,
    },
    body: JSON.stringify(body),
  });
}

function dependencies() {
  return {
    resolveProject: vi.fn<(projectId: string) => Promise<{ projectId: string; trafficType: "demo" } | null>>(
      async () => ({ projectId: "demo", trafficType: "demo" }),
    ),
    authenticateWriteKey: vi.fn().mockResolvedValue({ environment: "test" as const }),
    reserveEvent: vi.fn().mockResolvedValue({ outcome: "accepted" as const }),
    resolveRateCard: vi.fn().mockResolvedValue(null),
    resolveTaskPolicy: vi.fn().mockResolvedValue(null),
    recordCall: vi.fn<(call: unknown) => Promise<unknown>>().mockResolvedValue("call_safe_123"),
    fetchUpstream: vi.fn<typeof fetch>(),
    now: vi.fn().mockReturnValueOnce(900).mockReturnValueOnce(1_000).mockReturnValueOnce(1_250).mockReturnValue(1_250),
  };
}

describe("handleChatCompletion", () => {
  it("rejects a missing Tollgate write key before provider spend", async () => {
    const deps = dependencies();
    const unsafe = request({ model: "gpt-5.4-mini" });
    unsafe.headers.delete("x-tollgate-key");
    const response = await handleChatCompletion(unsafe, "demo", deps);
    expect(response.status).toBe(401);
    expect(deps.fetchUpstream).not.toHaveBeenCalled();
    expect(deps.reserveEvent).not.toHaveBeenCalled();
  });

  it("rejects an invalid Tollgate write key before provider spend", async () => {
    const deps = dependencies();
    deps.authenticateWriteKey.mockResolvedValueOnce(null);
    const response = await handleChatCompletion(request({ model: "gpt-5.4-mini" }), "demo", deps);
    expect(response.status).toBe(401);
    expect(deps.fetchUpstream).not.toHaveBeenCalled();
  });

  it("requires a safe retry ID before provider spend", async () => {
    const deps = dependencies();
    const unsafe = request({ model: "gpt-5.4-mini" });
    unsafe.headers.delete("x-tollgate-idempotency-key");
    const response = await handleChatCompletion(unsafe, "demo", deps);
    expect(response.status).toBe(400);
    expect(deps.fetchUpstream).not.toHaveBeenCalled();
  });

  it.each(["duplicate", "conflict"] as const)("blocks a %s retry before provider spend", async (outcome) => {
    const deps = dependencies();
    deps.reserveEvent.mockResolvedValueOnce({ outcome });
    const response = await handleChatCompletion(request({ model: "gpt-5.4-mini" }), "demo", deps);
    expect(response.status).toBe(409);
    expect(deps.fetchUpstream).not.toHaveBeenCalled();
  });

  it("uses the prepared request payload when identifying a retry", async () => {
    const first = dependencies();
    first.fetchUpstream.mockResolvedValueOnce(Response.json({ model: "gpt-5.4-mini", choices: [], usage: {} }));
    await handleChatCompletion(request({ model: "gpt-5.4-mini", messages: [{ role: "user", content: "first private prompt" }], temperature: 0 }), "demo", first);

    const second = dependencies();
    second.fetchUpstream.mockResolvedValueOnce(Response.json({ model: "gpt-5.4-mini", choices: [], usage: {} }));
    await handleChatCompletion(request({ model: "gpt-5.4-mini", messages: [{ role: "user", content: "second private prompt" }], temperature: 1 }), "demo", second);

    const firstFingerprint = first.reserveEvent.mock.calls[0][0].requestFingerprint;
    const secondFingerprint = second.reserveEvent.mock.calls[0][0].requestFingerprint;
    expect(firstFingerprint).not.toBe(secondFingerprint);
    expect(firstFingerprint).not.toContain("first private prompt");
    expect(secondFingerprint).not.toContain("second private prompt");
  });

  it("uses provider request headers when identifying a retry without storing them", async () => {
    const first = dependencies();
    first.fetchUpstream.mockResolvedValueOnce(Response.json({ model: "gpt-5.4-mini", choices: [], usage: {} }));
    await handleChatCompletion(request({ model: "gpt-5.4-mini", messages: [] }, "Bearer test-provider-key", { "openai-project": "project-first" }), "demo", first);

    const second = dependencies();
    second.fetchUpstream.mockResolvedValueOnce(Response.json({ model: "gpt-5.4-mini", choices: [], usage: {} }));
    await handleChatCompletion(request({ model: "gpt-5.4-mini", messages: [] }, "Bearer test-provider-key", { "openai-project": "project-second" }), "demo", second);

    const firstFingerprint = first.reserveEvent.mock.calls[0][0].requestFingerprint;
    const secondFingerprint = second.reserveEvent.mock.calls[0][0].requestFingerprint;
    expect(firstFingerprint).not.toBe(secondFingerprint);
    expect(firstFingerprint).not.toContain("project-first");
    expect(secondFingerprint).not.toContain("project-second");
    expect(firstFingerprint).not.toContain("test-provider-key");
  });

  it.each(["contains private words", "a".repeat(81), "unattributed"])("rejects the unsafe customer ID %s before provider spend", async (customerId) => {
    const deps = dependencies();
    const response = await handleChatCompletion(request(
      { model: "gpt-5.4-mini", messages: [] },
      "Bearer test-provider-key",
      { "x-tollgate-customer": customerId },
    ), "demo", deps);

    expect(response.status).toBe(400);
    expect(deps.reserveEvent).not.toHaveBeenCalled();
    expect(deps.fetchUpstream).not.toHaveBeenCalled();
  });

  it.each([
    [{ model: "gpt-5.4-mini", stream: true }, 400],
    [{ model: "model with spaces" }, 400],
  ])("rejects unsupported requests before provider spend", async (body, status) => {
    const deps = dependencies();
    const response = await handleChatCompletion(request(body), "demo", deps);
    expect(response.status).toBe(status);
    expect(deps.fetchUpstream).not.toHaveBeenCalled();
    expect(deps.recordCall).not.toHaveBeenCalled();
  });

  it("rejects an unknown project before reading provider traffic", async () => {
    const deps = dependencies();
    deps.resolveProject.mockResolvedValueOnce(null);
    const response = await handleChatCompletion(request({ model: "gpt-5.4-mini" }), "missing", deps);
    expect(response.status).toBe(404);
    expect(deps.fetchUpstream).not.toHaveBeenCalled();
  });

  it("returns the provider response and stores only safe usage metadata", async () => {
    const deps = dependencies();
    const providerBody = {
      id: "chatcmpl_123",
      model: "gpt-5.4-mini-2026-08-01",
      choices: [{ message: { content: "private answer", tool_calls: [{ function: { name: "search_catalog", arguments: "private tool input" } }] } }],
      usage: { prompt_tokens: 100, completion_tokens: 20, prompt_tokens_details: { cached_tokens: 40 } },
    };
    deps.fetchUpstream.mockResolvedValueOnce(
      Response.json(providerBody, { headers: { "x-request-id": "req_123" } }),
    );

    const response = await handleChatCompletion(
      request(
        { model: "gpt-5.4-mini", messages: [{ role: "user", content: "private prompt" }] },
        "Bearer test-provider-key",
        { "x-tollgate-task-id": "proposal-update", "x-tollgate-session-id": "session-42", "x-tollgate-agent": "cursor" },
      ),
      "demo",
      deps,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-tollgate-call-id")).toBe("call_safe_123");
    expect(response.headers.get("x-tollgate-estimated-cost-usd")).toBe("0.000138");
    expect(await response.json()).toEqual(providerBody);
    const [, init] = deps.fetchUpstream.mock.calls[0];
    expect(Object.fromEntries(new Headers(init?.headers).entries())).toEqual({ authorization: "Bearer test-provider-key", "content-type": "application/json" });
    const stored = deps.recordCall.mock.calls[0][0];
    expect(stored).toMatchObject({
      projectId: "demo",
      providerRequestId: "req_123",
      promptTokens: 100,
      cachedPromptTokens: 40,
      completionTokens: 20,
      latencyMs: 250,
      status: "ok",
      privacyMode: "private",
      taskId: "proposal-update",
      customerId: "unattributed",
      sessionId: "session-42",
      agentName: "cursor",
      toolNames: ["search_catalog"],
      toolCallCount: 1,
    });
    expect(JSON.stringify(stored)).not.toContain("private prompt");
    expect(JSON.stringify(stored)).not.toContain("private answer");
    expect(JSON.stringify(stored)).not.toContain("test-provider-key");
    expect(JSON.stringify(stored)).not.toContain("private tool input");
  });

  it("records the customer header and falls back when it is absent", async () => {
    const first = dependencies();
    first.fetchUpstream.mockResolvedValueOnce(Response.json({ model: "gpt-5.4-mini", choices: [{ message: { content: "private" } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }));
    await handleChatCompletion(request({ model: "gpt-5.4-mini", messages: [] }, "Bearer test-provider-key", { "X-Tollgate-Customer": "customer-acme" }), "demo", first);
    expect(first.recordCall.mock.calls[0][0]).toMatchObject({ customerId: "customer-acme" });

    const second = dependencies();
    second.fetchUpstream.mockResolvedValueOnce(Response.json({ model: "gpt-5.4-mini", choices: [{ message: { content: "private" } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }));
    await handleChatCompletion(request({ model: "gpt-5.4-mini", messages: [] }), "demo", second);
    expect(second.recordCall.mock.calls[0][0]).toMatchObject({ customerId: "unattributed" });
  });

  it("turns two customer-attributed proxy calls into two different invoice rows", async () => {
    const recorded: SafeCallRecord[] = [];
    const first = dependencies();
    first.recordCall.mockImplementation(async (call) => { recorded.push(call as SafeCallRecord); return "call_acme"; });
    first.fetchUpstream.mockResolvedValueOnce(Response.json({ model: "gpt-5.4-mini", choices: [{ message: { content: "private" } }], usage: { prompt_tokens: 1_500, completion_tokens: 500 } }));
    await handleChatCompletion(request({ model: "gpt-5.4-mini", messages: [] }, "Bearer test-provider-key", { "X-Tollgate-Customer": "acme" }), "demo", first);

    const second = dependencies();
    second.recordCall.mockImplementation(async (call) => { recorded.push(call as SafeCallRecord); return "call_beta"; });
    second.fetchUpstream.mockResolvedValueOnce(Response.json({ model: "gpt-5.4-mini", choices: [{ message: { content: "private" } }], usage: { prompt_tokens: 700, completion_tokens: 300 } }));
    await handleChatCompletion(request({ model: "gpt-5.4-mini", messages: [] }, "Bearer test-provider-key", { "X-Tollgate-Customer": "beta" }), "demo", second);

    const rows = buildInvoiceRows(recorded, { mode: "per_thousand_tokens", value: 2 });
    expect(rows.map((row) => [row.customerId, row.billedAmountUsd])).toEqual([["acme", 4], ["beta", 2]]);
  });

  it("passes through and prices a supported alternative model", async () => {
    const deps = dependencies();
    deps.fetchUpstream.mockResolvedValueOnce(Response.json({
      model: "gpt-5.4-nano-2026-03-17",
      choices: [{ message: { content: "private" } }],
      usage: { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 },
    }));
    const response = await handleChatCompletion(request({ model: "gpt-5.4-nano", messages: [] }), "demo", deps);
    expect(response.status).toBe(200);
    expect(deps.recordCall.mock.calls[0][0]).toMatchObject({
      requestedModel: "gpt-5.4-nano",
      estimatedCostUsd: 1.45,
    });
  });

  it("passes through an arbitrary safe OpenAI model and marks unknown cost unavailable", async () => {
    const deps = dependencies();
    deps.fetchUpstream.mockResolvedValueOnce(Response.json({
      model: "gpt-future-model-2027-01-01",
      choices: [{ message: { content: "private" } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    }));
    const response = await handleChatCompletion(request({ model: "gpt-future-model", messages: [] }), "demo", deps);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-tollgate-cost-status")).toBe("unavailable");
    expect(deps.recordCall.mock.calls[0][0]).toMatchObject({ requestedModel: "gpt-future-model", costStatus: "unavailable" });
  });

  it("uses an exact project rate card when the provider does not report cost", async () => {
    const deps = dependencies();
    deps.resolveRateCard.mockResolvedValueOnce({ rateCardId: "rate_anthropic", inputUsdPerMillion: 3, outputUsdPerMillion: 15 });
    deps.fetchUpstream.mockResolvedValueOnce(Response.json({
      id: "msg_rate",
      model: "claude-sonnet-4-5",
      content: [{ type: "text", text: "private" }],
      usage: { input_tokens: 1_000, output_tokens: 100 },
    }));
    const response = await handleProviderRequest(new Request("https://tollgate.test", {
      method: "POST",
      headers: { "x-api-key": "anthropic-secret", "content-type": "application/json", ...tollgateHeaders },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 100, messages: [] }),
    }), "demo", "anthropic", ["v1", "messages"], deps);
    expect(response.headers.get("x-tollgate-estimated-cost-usd")).toBe("0.0045");
    expect(deps.recordCall.mock.calls[0][0]).toMatchObject({
      rateCardId: "rate_anthropic",
      pricingSource: "rate_card",
      pricingStatus: "priced",
      estimatedCostUsd: 0.0045,
    });
  });

  it("routes a named task through its approved model before provider spend", async () => {
    const deps = dependencies();
    deps.resolveTaskPolicy.mockResolvedValueOnce({ approvedModel: "gpt-5.4-nano" });
    deps.fetchUpstream.mockResolvedValueOnce(Response.json({
      model: "gpt-5.4-nano",
      choices: [{ message: { content: "private" } }],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    }));
    const response = await handleChatCompletion(request(
      { model: "gpt-5.4-mini", messages: [{ role: "user", content: "private" }] },
      "Bearer test-provider-key",
      { "x-tollgate-task-id": "proposal-update" },
    ), "demo", deps);

    expect(JSON.parse(String(deps.fetchUpstream.mock.calls[0][1]?.body))).toMatchObject({ model: "gpt-5.4-nano" });
    expect(deps.recordCall.mock.calls[0][0]).toMatchObject({ requestedModel: "gpt-5.4-nano", originalRequestedModel: "gpt-5.4-mini", policyApplied: true });
    expect(response.headers.get("x-tollgate-routed-model")).toBe("gpt-5.4-nano");
    expect(response.headers.get("x-tollgate-policy-applied")).toBe("true");
  });

  it("does not enforce a policy during a controlled comparison", async () => {
    const deps = dependencies();
    deps.resolveTaskPolicy.mockResolvedValueOnce({ approvedModel: "gpt-5.4-nano" });
    deps.fetchUpstream.mockResolvedValueOnce(Response.json({ model: "gpt-5.4-mini", choices: [{ message: { content: "private" } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }));
    const comparisonRequest = request({ model: "gpt-5.4-mini", messages: [] }, "Bearer test-provider-key", { "x-tollgate-task-id": "proposal-update", "x-tollgate-policy-mode": "observe" });
    await handleChatCompletion(comparisonRequest, "demo", deps);
    expect(deps.resolveTaskPolicy).not.toHaveBeenCalled();
    expect(JSON.parse(String(deps.fetchUpstream.mock.calls[0][1]?.body))).toMatchObject({ model: "gpt-5.4-mini" });
  });

  it("rejects free-form attribution before provider spend", async () => {
    const deps = dependencies();
    const response = await handleChatCompletion(
      request({ model: "gpt-5.4-mini", messages: [] }, "Bearer test-provider-key", { "x-tollgate-task-id": "contains private words" }),
      "demo",
      deps,
    );
    expect(response.status).toBe(400);
    expect(deps.fetchUpstream).not.toHaveBeenCalled();
  });

  it("normalizes an Anthropic Messages call without storing content or credentials", async () => {
    const deps = dependencies();
    deps.fetchUpstream.mockResolvedValueOnce(Response.json({
      id: "msg_123",
      model: "claude-sonnet-4-5",
      content: [{ type: "text", text: "private answer" }, { type: "tool_use", name: "lookup", input: { secret: true } }],
      usage: { input_tokens: 70, cache_creation_input_tokens: 20, cache_read_input_tokens: 10, output_tokens: 25 },
    }, { headers: { "request-id": "ant-123" } }));
    const response = await handleProviderRequest(new Request("https://tollgate.test", {
      method: "POST",
      headers: { "x-api-key": "anthropic-secret", "content-type": "application/json", "x-tollgate-customer": "acme", ...tollgateHeaders },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 100, messages: [{ role: "user", content: "private prompt" }] }),
    }), "demo", "anthropic", ["v1", "messages"], deps);
    expect(response.status).toBe(200);
    expect(response.headers.get("request-id")).toBe("ant-123");
    expect(deps.fetchUpstream.mock.calls[0][0]).toBe("https://api.anthropic.com/v1/messages");
    expect(deps.recordCall.mock.calls[0][0]).toMatchObject({ provider: "anthropic", customerId: "acme", promptTokens: 100, cachedPromptTokens: 10, completionTokens: 25, toolNames: ["lookup"], costStatus: "unavailable" });
    const stored = JSON.stringify(deps.recordCall.mock.calls[0][0]);
    expect(stored).not.toContain("anthropic-secret");
    expect(stored).not.toContain("private prompt");
    expect(stored).not.toContain("private answer");
    expect(stored).not.toContain("secret");
  });

  it("records OpenRouter's provider-reported cost", async () => {
    const deps = dependencies();
    deps.fetchUpstream.mockResolvedValueOnce(Response.json({
      model: "anthropic/claude-sonnet-4.5",
      choices: [{ message: { content: "private" } }],
      usage: { prompt_tokens: 40, completion_tokens: 10, cost: 0.0025 },
    }));
    const response = await handleProviderRequest(new Request("https://tollgate.test", {
      method: "POST",
      headers: { authorization: "Bearer openrouter-secret", "content-type": "application/json", ...tollgateHeaders },
      body: JSON.stringify({ model: "anthropic/claude-sonnet-4.5", messages: [] }),
    }), "demo", "openrouter", ["api", "v1", "chat", "completions"], deps);
    expect(response.headers.get("x-tollgate-provider-cost-usd")).toBe("0.0025");
    expect(deps.recordCall.mock.calls[0][0]).toMatchObject({ provider: "openrouter", requestedModel: "anthropic/claude-sonnet-4.5", providerCostUsd: 0.0025, costStatus: "reported" });
  });

  it("takes Gemini's model from its fixed generateContent path", async () => {
    const deps = dependencies();
    deps.fetchUpstream.mockResolvedValueOnce(Response.json({
      modelVersion: "gemini-2.5-flash-001",
      candidates: [{ content: { parts: [{ text: "private" }] } }],
      usageMetadata: { promptTokenCount: 80, cachedContentTokenCount: 20, candidatesTokenCount: 30, thoughtsTokenCount: 5 },
    }, { headers: { "x-goog-request-id": "gem-123" } }));
    const response = await handleProviderRequest(new Request("https://tollgate.test", {
      method: "POST",
      headers: { "x-goog-api-key": "gemini-secret", "content-type": "application/json", ...tollgateHeaders },
      body: JSON.stringify({ contents: [{ parts: [{ text: "private prompt" }] }] }),
    }), "demo", "gemini", ["v1beta", "models", "gemini-2.5-flash:generateContent"], deps);
    expect(response.status).toBe(200);
    expect(deps.fetchUpstream.mock.calls[0][0]).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash%3AgenerateContent".replace("%3AgenerateContent", ":generateContent"));
    expect(deps.recordCall.mock.calls[0][0]).toMatchObject({ provider: "gemini", requestedModel: "gemini-2.5-flash", reportedModel: "gemini-2.5-flash-001", promptTokens: 80, cachedPromptTokens: 20, completionTokens: 35, costStatus: "unavailable" });
  });

  it("records a safe error when a provider cannot be reached", async () => {
    const deps = dependencies();
    deps.fetchUpstream.mockRejectedValueOnce(new Error("private network detail"));
    const response = await handleChatCompletion(request({ model: "gpt-future-model", messages: [{ content: "private" }] }), "demo", deps);
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ error: { message: "OpenAI could not be reached" } });
    expect(deps.recordCall.mock.calls[0][0]).toMatchObject({ status: "error", errorCode: "upstream_unavailable", costStatus: "unavailable" });
    const stored = JSON.stringify(deps.recordCall.mock.calls[0][0]);
    expect(stored).not.toContain("private network detail");
    expect(stored).not.toContain("content");
  });

  it("rejects an oversized provider response and records a safe failure", async () => {
    const deps = dependencies();
    deps.fetchUpstream.mockResolvedValueOnce(new Response("small body", {
      status: 200,
      headers: { "content-length": String(4 * 1024 * 1024 + 1) },
    }));

    const response = await handleChatCompletion(request({ model: "gpt-5.4-mini", messages: [] }), "demo", deps);

    expect(response.status).toBe(502);
    expect(deps.recordCall.mock.calls[0][0]).toMatchObject({
      status: "error",
      errorCode: "upstream_response_too_large",
      costStatus: "unavailable",
    });
  });
});

describe("readResponseBytes", () => {
  it("stops reading a response that exceeds the byte limit without a content-length header", async () => {
    const response = new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("123"));
        controller.enqueue(new TextEncoder().encode("456"));
        controller.close();
      },
    }));

    await expect(readResponseBytes(response, 4)).rejects.toThrow("Provider response exceeded 4 bytes");
  });
});
