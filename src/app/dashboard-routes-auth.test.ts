import { beforeEach, describe, expect, it, vi } from "vitest";

const guards = vi.hoisted(() => ({
  dashboardClient: vi.fn(),
  dashboardMutationClient: vi.fn(),
  isTrustedDashboardMutation: vi.fn(),
}));

vi.mock("@/lib/dashboard-auth", () => ({
  ...guards,
  noStoreJson(body: unknown, init?: ResponseInit) {
    return Response.json(body, init);
  },
}));

import * as billingRule from "./p/[projectId]/dashboard/billing-rule/route";
import * as billingRuns from "./p/[projectId]/dashboard/billing-runs/route";
import * as billingRunCsv from "./p/[projectId]/dashboard/billing-runs/[runId]/csv/route";
import * as billingRunStripe from "./p/[projectId]/dashboard/billing-runs/[runId]/stripe/route";
import * as customers from "./p/[projectId]/dashboard/customers/route";
import * as data from "./p/[projectId]/dashboard/data/route";
import * as events from "./p/[projectId]/dashboard/events/route";
import * as feedback from "./p/[projectId]/dashboard/feedback/route";
import * as invoices from "./p/[projectId]/dashboard/invoices/route";
import * as policy from "./p/[projectId]/dashboard/policy/route";
import * as rates from "./p/[projectId]/dashboard/rates/route";
import * as signout from "./p/[projectId]/dashboard/signout/route";
import * as stripe from "./p/[projectId]/dashboard/stripe/route";
import * as unlock from "./p/[projectId]/dashboard/unlock/route";
import * as writeKeys from "./p/[projectId]/dashboard/write-keys/route";
import * as meterSelect from "./meter/select/route";

const projectContext = () => ({ params: Promise.resolve({ projectId: "meter-a" }) });
const runContext = () => ({ params: Promise.resolve({ projectId: "meter-a", runId: "run-a" }) });
const request = (path: string, method = "GET") => new Request(`https://tollgate.test${path}`, {
  method,
  headers: method === "GET" ? undefined : { origin: "https://tollgate.test", "content-type": "application/json" },
  body: method === "GET" ? undefined : "{}",
});

beforeEach(() => {
  guards.dashboardClient.mockReset().mockResolvedValue(null);
  guards.dashboardMutationClient.mockReset().mockResolvedValue(null);
  guards.isTrustedDashboardMutation.mockReset().mockReturnValue(false);
});

describe("private dashboard read routes", () => {
  const reads = [
    ["billing rule", () => billingRule.GET(request("/p/meter-a/dashboard/billing-rule"), projectContext())],
    ["billing runs", () => billingRuns.GET(request("/p/meter-a/dashboard/billing-runs"), projectContext())],
    ["billing CSV", () => billingRunCsv.GET(request("/p/meter-a/dashboard/billing-runs/run-a/csv"), runContext())],
    ["customers", () => customers.GET(request("/p/meter-a/dashboard/customers"), projectContext())],
    ["dashboard data", () => data.GET(request("/p/meter-a/dashboard/data"), projectContext())],
    ["events", () => events.GET(request("/p/meter-a/dashboard/events"), projectContext())],
    ["invoices", () => invoices.GET(request("/p/meter-a/dashboard/invoices"), projectContext())],
    ["rates", () => rates.GET(request("/p/meter-a/dashboard/rates"), projectContext())],
    ["Stripe", () => stripe.GET(request("/p/meter-a/dashboard/stripe"), projectContext())],
    ["write keys", () => writeKeys.GET(request("/p/meter-a/dashboard/write-keys"), projectContext())],
  ] as const;

  it.each(reads)("rejects %s without a valid project session", async (_name, invoke) => {
    const response = await invoke();
    expect([401, 403]).toContain(response.status);
    expect(guards.dashboardClient).toHaveBeenCalledWith("meter-a");
  });
});

describe("private dashboard mutation routes", () => {
  const mutations = [
    ["billing rule", () => billingRule.POST(request("/p/meter-a/dashboard/billing-rule", "POST"), projectContext())],
    ["billing close", () => billingRuns.POST(request("/p/meter-a/dashboard/billing-runs", "POST"), projectContext())],
    ["Stripe drafts", () => billingRunStripe.POST(request("/p/meter-a/dashboard/billing-runs/run-a/stripe", "POST"), runContext())],
    ["customer", () => customers.POST(request("/p/meter-a/dashboard/customers", "POST"), projectContext())],
    ["feedback", () => feedback.POST(request("/p/meter-a/dashboard/feedback", "POST"), projectContext())],
    ["policy save", () => policy.POST(request("/p/meter-a/dashboard/policy", "POST"), projectContext())],
    ["policy remove", () => policy.DELETE(request("/p/meter-a/dashboard/policy", "DELETE"), projectContext())],
    ["rate save", () => rates.POST(request("/p/meter-a/dashboard/rates", "POST"), projectContext())],
    ["rate remove", () => rates.DELETE(request("/p/meter-a/dashboard/rates", "DELETE"), projectContext())],
    ["Stripe connect", () => stripe.POST(request("/p/meter-a/dashboard/stripe", "POST"), projectContext())],
    ["Stripe disconnect", () => stripe.DELETE(request("/p/meter-a/dashboard/stripe", "DELETE"), projectContext())],
    ["write-key rotation", () => writeKeys.POST(request("/p/meter-a/dashboard/write-keys", "POST"), projectContext())],
  ] as const;

  it.each(mutations)("rejects %s without both origin and project-session approval", async (_name, invoke) => {
    const response = await invoke();
    expect(response.status).toBe(403);
    expect(guards.dashboardMutationClient).toHaveBeenCalledWith(expect.any(Request), "meter-a");
  });
});

describe("recovery and session-only mutations", () => {
  it("checks the origin before a dashboard unlock", async () => {
    const response = await unlock.POST(request("/p/meter-a/dashboard/unlock", "POST"), projectContext());
    expect(response.status).toBe(403);
    expect(guards.isTrustedDashboardMutation).toHaveBeenCalled();
  });

  it("checks the origin before selecting a meter", async () => {
    const response = await meterSelect.POST(request("/meter/select", "POST"));
    expect(response.status).toBe(403);
    expect(guards.isTrustedDashboardMutation).toHaveBeenCalled();
  });

  it("checks the origin before signing out", async () => {
    const response = await signout.POST(request("/p/meter-a/dashboard/signout", "POST"));
    expect(response.status).toBe(403);
    expect(guards.isTrustedDashboardMutation).toHaveBeenCalled();
  });
});
