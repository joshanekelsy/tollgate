import { describe, expect, it } from "vitest";
import { analyticsSurface, isProductEvent, sanitizeAnalyticsProperties } from "./analytics";
import { redactSecrets, scrubSentryEvent } from "./sentry-privacy";

describe("observability privacy", () => {
  it("removes request content and credentials from Sentry events", () => {
    const event = scrubSentryEvent({
      request: {
        url: "https://tollgate.example/p/meter/dashboard?code=recovery",
        headers: { authorization: "Bearer sk-secret" },
        cookies: "session=secret",
        data: { prompt: "private prompt" },
        query_string: "code=recovery",
      },
      user: { email: "private@example.com" },
      extra: { response: "private response" },
      message: "Failed with tgw_live_abcdefghijklmnopqrstuvwxyz",
      breadcrumbs: [{ message: "authorization: Bearer secret-value", data: { body: "private" } }],
    });

    expect(event.request).toEqual({ url: "https://tollgate.example/p/meter/dashboard", headers: undefined, cookies: undefined, data: undefined, query_string: undefined });
    expect(event.user).toBeUndefined();
    expect(event.extra).toBeUndefined();
    expect(event.message).not.toContain("tgw_live_");
    expect(event.breadcrumbs?.[0]).not.toHaveProperty("data.body");
  });

  it("redacts known secret formats", () => {
    expect(redactSecrets("rk_test_abc123 whsec_abc123 sk-project-secret")).toBe("[redacted] [redacted] [redacted]");
    expect(redactSecrets(`serviceToken=${"a".repeat(64)}`)).toBe("[redacted]");
  });

  it("allows only planned analytics names and safe properties", () => {
    expect(isProductEvent("meter_created")).toBe(true);
    expect(isProductEvent("email_captured")).toBe(false);
    expect(sanitizeAnalyticsProperties({ environment: "test", email: "private@example.com", projectId: "meter-1" })).toEqual({ environment: "test" });
    expect(analyticsSurface("/p/meter-secret/dashboard")).toBe("dashboard");
  });
});
