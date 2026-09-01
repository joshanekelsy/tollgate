import { rawCallCostUsd } from "./billing";
import type { SafeCallRecord } from "./types";

export type ModelRun = {
  model: string;
  calls: number;
  estimatedCostUsd: number;
  averageLatencyMs: number;
  helpful: number;
  notHelpful: number;
};

export type TaskInsight = {
  taskId: string;
  calls: number;
  estimatedCostUsd: number;
  sessions: number;
  models: ModelRun[];
  state: "ready_to_test" | "needs_quality" | "comparison_ready";
};

export function deriveTaskInsights(calls: SafeCallRecord[]) {
  const groups = new Map<string, SafeCallRecord[]>();
  let attributedCalls = 0;
  for (const call of calls) {
    if (!call.taskId) continue;
    attributedCalls += 1;
    const group = groups.get(call.taskId) ?? [];
    group.push(call);
    groups.set(call.taskId, group);
  }

  const tasks: TaskInsight[] = Array.from(groups, ([taskId, taskCalls]) => {
    const modelGroups = new Map<string, SafeCallRecord[]>();
    for (const call of taskCalls) {
      const modelCalls = modelGroups.get(call.requestedModel) ?? [];
      modelCalls.push(call);
      modelGroups.set(call.requestedModel, modelCalls);
    }
    const models = Array.from(modelGroups, ([model, modelCalls]) => ({
      model,
      calls: modelCalls.length,
      estimatedCostUsd: modelCalls.reduce((sum, call) => sum + (rawCallCostUsd(call) ?? 0), 0),
      averageLatencyMs: Math.round(modelCalls.reduce((sum, call) => sum + call.latencyMs, 0) / modelCalls.length),
      helpful: modelCalls.filter((call) => call.qualityScore === "helpful").length,
      notHelpful: modelCalls.filter((call) => call.qualityScore === "not_helpful").length,
    })).sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd);
    const qualityVotes = models.reduce((sum, model) => sum + model.helpful + model.notHelpful, 0);
    const state: TaskInsight["state"] = models.length < 2 ? "ready_to_test" : qualityVotes < models.length ? "needs_quality" : "comparison_ready";
    return {
      taskId,
      calls: taskCalls.length,
      estimatedCostUsd: taskCalls.reduce((sum, call) => sum + (rawCallCostUsd(call) ?? 0), 0),
      sessions: new Set(taskCalls.map((call) => call.sessionId).filter(Boolean)).size,
      models,
      state,
    };
  }).sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd || b.calls - a.calls);

  return { tasks, attributedCalls, totalCalls: calls.length };
}
