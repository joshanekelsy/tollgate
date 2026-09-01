import { describe, expect, it } from "vitest";
import { deriveTaskInsights } from "./task-insights";
import type { SafeCallRecord, SupportedModel } from "./types";

function call(taskId: string | undefined, model: SupportedModel, cost: number, qualityScore?: "helpful" | "not_helpful"): SafeCallRecord {
  return { projectId: "demo", environment: "test", idempotencyKey: `event-${taskId ?? "none"}-${model}-${cost}`, eventStatus: "accepted", pricingStatus: "priced", customerId: "unattributed", createdAt: 1, provider: "openai", requestedModel: model, promptTokens: 10, cachedPromptTokens: 0, completionTokens: 5, estimatedCostUsd: cost, costStatus: "estimated", latencyMs: 100, status: "ok", trafficType: "demo", taskId, sessionId: "s1", qualityScore };
}

describe("deriveTaskInsights", () => {
  it("ranks attributed tasks by measured spend and keeps coverage honest", () => {
    const result = deriveTaskInsights([
      call("weekly-report", "gpt-5.4-mini", 0.03),
      call("weekly-report", "gpt-5.4-nano", 0.01),
      call("proposal", "gpt-5.4-mini", 0.08),
      call(undefined, "gpt-5.4-mini", 0.5),
    ]);
    expect(result.attributedCalls).toBe(3);
    expect(result.totalCalls).toBe(4);
    expect(result.tasks.map((task) => task.taskId)).toEqual(["proposal", "weekly-report"]);
    expect(result.tasks[1].models).toHaveLength(2);
    expect(result.tasks[1].state).toBe("needs_quality");
  });

  it("marks a multi-model task ready only after each run has a quality vote", () => {
    const [task] = deriveTaskInsights([
      call("deck-update", "gpt-5.4-mini", 0.03, "helpful"),
      call("deck-update", "gpt-5-nano", 0.002, "not_helpful"),
    ]).tasks;
    expect(task.state).toBe("comparison_ready");
    expect(task.models[1].notHelpful).toBe(1);
  });
});
