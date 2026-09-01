import { describe, expect, it } from "vitest";
import { PROVIDER_SETUP_OPTIONS, providerSetup } from "./provider-setup";

describe("provider setup", () => {
  it.each(PROVIDER_SETUP_OPTIONS)("builds a complete $label example", ({ id }) => {
    const setup = providerSetup("https://tollgate.test", "meter-test", id);
    expect(setup.endpoint).toContain(`/p/meter-test/providers/${id}/`);
    expect(setup.snippets.javascript).toContain(setup.endpoint.includes("chat/completions") ? setup.baseUrl : setup.endpoint);
    expect(setup.snippets.python).toContain(setup.endpoint.includes("chat/completions") ? setup.baseUrl : setup.endpoint);
    expect(setup.snippets.curl).toContain(setup.endpoint);
    expect(setup.snippets.curl).toContain("X-Tollgate-Customer");
    expect(setup.snippets.curl).toContain("X-Tollgate-Key");
    expect(setup.snippets.curl).toContain("X-Tollgate-Idempotency-Key");
    expect(setup.snippets.curl).not.toContain("+  -H");
  });

  it("uses each provider's required key header", () => {
    expect(providerSetup("https://tollgate.test", "meter", "openai").snippets.curl).toContain("Authorization: Bearer $OPENAI_API_KEY");
    expect(providerSetup("https://tollgate.test", "meter", "openrouter").snippets.curl).toContain("Authorization: Bearer $OPENROUTER_API_KEY");
    expect(providerSetup("https://tollgate.test", "meter", "anthropic").snippets.curl).toContain("x-api-key: $ANTHROPIC_API_KEY");
    expect(providerSetup("https://tollgate.test", "meter", "gemini").snippets.curl).toContain("x-goog-api-key: $GEMINI_API_KEY");
  });
});
