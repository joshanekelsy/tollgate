import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createStripeDraft, createStripeLineItem, stripeRetryKey, verifyStripeSignature } from "./stripe";

describe("Stripe output", () => {
  it("creates a stable retry key from the fixed run and item", () => {
    expect(stripeRetryKey("invoice", "run_1", "item_1")).toBe(stripeRetryKey("invoice", "run_1", "item_1"));
    expect(stripeRetryKey("line", "run_1", "item_1")).not.toBe(stripeRetryKey("invoice", "run_1", "item_1"));
  });

  it("creates a reviewed send-invoice draft", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ id: "in_123", status: "draft" }));
    await expect(createStripeDraft({
      secretKey: "rk_test_secret",
      customerId: "cus_12345678",
      projectId: "meter-1",
      runId: "run_1",
      itemId: "item_1",
      fetcher,
    })).resolves.toMatchObject({ id: "in_123", status: "draft" });
    const [, init] = fetcher.mock.calls[0];
    expect(init?.headers).toMatchObject({ Authorization: "Bearer rk_test_secret", "Idempotency-Key": stripeRetryKey("invoice", "run_1", "item_1") });
    const form = new URLSearchParams(String(init?.body));
    expect(Object.fromEntries(form)).toMatchObject({ customer: "cus_12345678", collection_method: "send_invoice", days_until_due: "30", auto_advance: "false" });
  });

  it("attaches integer cents to the existing draft", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ id: "ii_123" }));
    await createStripeLineItem({
      secretKey: "rk_test_secret",
      customerId: "cus_12345678",
      invoiceId: "in_123",
      projectId: "meter-1",
      runId: "run_1",
      itemId: "item_1",
      amountCents: 1250,
      periodStart: Date.UTC(2026, 7, 1),
      periodEnd: Date.UTC(2026, 8, 1),
      fetcher,
    });
    const form = new URLSearchParams(String(fetcher.mock.calls[0][1]?.body));
    expect(Object.fromEntries(form)).toMatchObject({ customer: "cus_12345678", invoice: "in_123", amount: "1250", currency: "usd" });
  });

  it("verifies the raw webhook body and rejects old timestamps", () => {
    const payload = JSON.stringify({ id: "evt_123" });
    const secret = "whsec_test";
    const now = 1_800_000_000;
    const signature = createHmac("sha256", secret).update(`${now}.${payload}`).digest("hex");
    expect(verifyStripeSignature(payload, `t=${now},v1=${signature}`, secret, now)).toBe(true);
    expect(verifyStripeSignature(payload, `t=${now - 301},v1=${signature}`, secret, now)).toBe(false);
    expect(verifyStripeSignature(`${payload} `, `t=${now},v1=${signature}`, secret, now)).toBe(false);
  });
});
