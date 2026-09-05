import { describe, expect, it, vi } from "vitest";
import { dashboardJson } from "./dashboard-request";

describe("dashboardJson", () => {
  it("returns an empty object when an error response is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("gateway failure", { status: 502 })));

    await expect(dashboardJson<{ error?: string }>("/dashboard/action", { method: "POST" })).resolves.toEqual({
      ok: false,
      status: 502,
      data: {},
    });

    vi.unstubAllGlobals();
  });

  it("does not hide a network failure from the calling component", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(dashboardJson("/dashboard/action", { method: "POST" })).rejects.toThrow("offline");

    vi.unstubAllGlobals();
  });
});
