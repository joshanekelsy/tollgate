import { describe, expect, it } from "vitest";
import { dashboardPath, dashboardUrl, demoDashboardPath, providerProxyBaseUrl, providerProxyEndpoint, proxyBaseUrl } from "./meter-links";

describe("meter links", () => {
  it("opens a new meter in its protected setup view", () => {
    expect(dashboardPath("meter-test", "setup")).toBe("/p/meter-test/dashboard?view=setup");
    expect(dashboardUrl("https://tollgate.test", "meter-test", "setup")).toBe(
      "https://tollgate.test/p/meter-test/dashboard?view=setup",
    );
  });

  it("encodes project IDs in browser-facing paths", () => {
    expect(dashboardPath("meter/with spaces")).toBe("/p/meter%2Fwith%20spaces/dashboard");
    expect(proxyBaseUrl("https://tollgate.test/", "meter/with spaces")).toBe(
      "https://tollgate.test/p/meter%2Fwith%20spaces/v1",
    );
  });

  it("builds stable public sample dashboard paths", () => {
    expect(demoDashboardPath()).toBe("/demo");
    expect(demoDashboardPath("overview")).toBe("/demo?view=overview");
    expect(demoDashboardPath("pricing")).toBe("/demo?view=pricing");
  });

  it("builds fixed provider endpoints", () => {
    expect(providerProxyBaseUrl("https://tollgate.test/", "meter-test", "openai")).toBe("https://tollgate.test/p/meter-test/providers/openai/v1");
    expect(providerProxyEndpoint("https://tollgate.test", "meter-test", "anthropic")).toBe("https://tollgate.test/p/meter-test/providers/anthropic/v1/messages");
    expect(providerProxyEndpoint("https://tollgate.test", "meter-test", "openrouter")).toBe("https://tollgate.test/p/meter-test/providers/openrouter/api/v1/chat/completions");
    expect(providerProxyEndpoint("https://tollgate.test", "meter-test", "gemini", "gemini-2.5-flash")).toBe("https://tollgate.test/p/meter-test/providers/gemini/v1beta/models/gemini-2.5-flash:generateContent");
  });
});
