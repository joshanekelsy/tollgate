// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardBillingRuns } from "./dashboard-billing-runs";
import { DashboardCustomers } from "./dashboard-customers";
import { DashboardPricing } from "./dashboard-pricing";
import { DashboardSetup } from "./dashboard-setup";

const interrupted = /connection was interrupted/i;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("dashboard mutation failures", () => {
  it("releases the customer save button after a dropped connection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<DashboardCustomers
      projectId="meter-test"
      environment="test"
      onEnvironment={vi.fn()}
      customers={[]}
      events={[]}
      invoice={{ rule: null, rows: [], monthStart: 0 }}
      onReload={vi.fn()}
    />);

    fireEvent.change(screen.getByLabelText("Customer header ID"), { target: { value: "customer-acme" } });
    fireEvent.click(screen.getByRole("button", { name: "Save customer" }));

    expect(await screen.findByText(interrupted)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Save customer" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("releases the pricing save button after a dropped connection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<DashboardPricing
      projectId="meter-test"
      environment="test"
      onEnvironment={vi.fn()}
      customers={[]}
      rules={[]}
      defaultRule={null}
      rates={[]}
      onReload={vi.fn()}
    />);

    fireEvent.click(screen.getByRole("button", { name: "Save rule" }));

    expect(await screen.findByText(interrupted)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Save rule" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("explains an uncertain key rotation and allows another attempt", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<DashboardSetup
      projectId="meter-test"
      environment="test"
      onEnvironment={vi.fn()}
      events={[]}
      customers={[]}
      keys={[]}
      stripe={null}
      webhookUrl="https://tollgate.test/webhook"
      hasRule={false}
      onReload={vi.fn()}
    />);

    fireEvent.click(screen.getByRole("button", { name: "Rotate key" }));

    expect(await screen.findByText(/connection was interrupted.*key may have rotated/i)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Rotate key" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("releases the Stripe connection button after a dropped connection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<DashboardSetup
      projectId="meter-test"
      environment="test"
      onEnvironment={vi.fn()}
      events={[]}
      customers={[]}
      keys={[]}
      stripe={null}
      webhookUrl="https://tollgate.test/webhook"
      hasRule={false}
      onReload={vi.fn()}
    />);

    fireEvent.change(screen.getByLabelText("Restricted Stripe key"), { target: { value: "test-key-input" } });
    fireEvent.change(screen.getByLabelText("Webhook signing secret"), { target: { value: "test-webhook-input" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect Stripe" }));

    expect(await screen.findByText(interrupted)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Connect Stripe" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("releases the billing close button after a dropped connection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<DashboardBillingRuns
      projectId="meter-test"
      runs={[]}
      preview={{ periodStart: Date.UTC(2026, 0, 1), periodEnd: Date.UTC(2026, 1, 1), rows: [], blockers: [] }}
      stripeConnected={false}
      onReload={vi.fn()}
    />);

    fireEvent.click(screen.getByRole("button", { name: "Close billing run" }));

    expect(await screen.findByText(interrupted)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Close billing run" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
