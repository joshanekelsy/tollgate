import { describe, expect, it } from "vitest";
import { meterSetupText } from "./test-application-form";

describe("meterSetupText", () => {
  it("contains everything needed to resume setup without a provider key", () => {
    const text = meterSetupText({
      ready: true,
      projectId: "meter-test",
      baseUrl: "https://tollgate.test/p/meter-test/v1",
      dashboardPath: "/p/meter-test/dashboard?view=setup",
      dashboardUrl: "https://tollgate.test/p/meter-test/dashboard?view=setup",
      accessCode: "one-time-code",
      writeKeys: { test: "tgw_test_secret", live: "tgw_live_secret" },
    });
    expect(text).toContain("https://tollgate.test/p/meter-test/v1");
    expect(text).toContain("OpenAI, Anthropic, Gemini, OpenRouter");
    expect(text).toContain("OpenAI/OpenRouter Chat Completions");
    expect(text).toContain("safe model IDs accepted inside those four request formats");
    expect(text).toContain("https://tollgate.test/p/meter-test/dashboard?view=setup");
    expect(text).toContain("one-time-code");
    expect(text).toContain("tgw_test_secret");
    expect(text).toContain("tgw_live_secret");
    expect(text).toContain("x-tollgate-idempotency-key");
    expect(text).not.toContain("OPENAI_API_KEY=");
    expect(text).not.toContain("sk-proj-");
    expect(text.toLowerCase()).not.toContain("comparison");
  });
});
