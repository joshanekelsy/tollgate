import { describe, expect, it } from "vitest";
import { createDashboardSession, dashboardSessionCookie, verifyDashboardSession } from "./session";

const secret = "a-secure-dashboard-session-secret-32-bytes";

describe("dashboard sessions", () => {
  it("accepts only the matching unexpired project", () => {
    const token = createDashboardSession("project-a", 1_000, secret);
    expect(verifyDashboardSession(token, "project-a", 2_000, secret)).toBe(true);
    expect(verifyDashboardSession(token, "project-b", 2_000, secret)).toBe(false);
    expect(verifyDashboardSession(token, "project-a", 43_202_000, secret)).toBe(false);
  });
  it("rejects modified and malformed tokens", () => {
    const token = createDashboardSession("project-a", 1_000, secret);
    expect(verifyDashboardSession(`${token}x`, "project-a", 2_000, secret)).toBe(false);
    expect(verifyDashboardSession("broken", "project-a", 2_000, secret)).toBe(false);
  });
  it("uses secure cookies in production without breaking localhost", () => {
    expect(dashboardSessionCookie("token", "https://tollgate.test")).toContain("; Secure;");
    expect(dashboardSessionCookie("token", "http://localhost:3000")).not.toContain("Secure");
    expect(dashboardSessionCookie("token", "http://localhost:3000")).toContain("HttpOnly");
  });
});
