import { describe, expect, it } from "vitest";
import { isTrustedDashboardMutation } from "./dashboard-auth";

function mutationRequest(origin?: string, site?: string) {
  const headers = new Headers();
  if (origin !== undefined) headers.set("origin", origin);
  if (site !== undefined) headers.set("sec-fetch-site", site);
  return new Request("https://tollgate.test/p/meter-a/dashboard/customers", { method: "POST", headers });
}

describe("dashboard mutation origin", () => {
  it("accepts only the exact application origin", () => {
    expect(isTrustedDashboardMutation(mutationRequest("https://tollgate.test", "same-origin"))).toBe(true);
    expect(isTrustedDashboardMutation(mutationRequest("https://evil.test", "cross-site"))).toBe(false);
    expect(isTrustedDashboardMutation(mutationRequest("https://tollgate.test.evil.test", "cross-site"))).toBe(false);
  });

  it("rejects missing or malformed origins", () => {
    expect(isTrustedDashboardMutation(mutationRequest())).toBe(false);
    expect(isTrustedDashboardMutation(mutationRequest("not a URL"))).toBe(false);
  });

  it("rejects a browser-declared cross-site request even when the origin text matches", () => {
    expect(isTrustedDashboardMutation(mutationRequest("https://tollgate.test", "cross-site"))).toBe(false);
  });
});
