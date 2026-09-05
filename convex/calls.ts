import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireServiceToken, serviceAuthArgs } from "./serviceAuth";

const callFields = {
  projectId: v.string(),
  environment: v.union(v.literal("test"), v.literal("live")),
  idempotencyKey: v.string(),
  eventStatus: v.union(v.literal("accepted"), v.literal("failed")),
  pricingStatus: v.union(v.literal("priced"), v.literal("unpriced"), v.literal("not_billable")),
  pricingSource: v.optional(v.union(v.literal("provider"), v.literal("built_in"), v.literal("rate_card"), v.literal("none"))),
  rateCardId: v.optional(v.string()),
  customerId: v.string(),
  createdAt: v.number(),
  provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("gemini"), v.literal("openrouter")),
  providerRequestId: v.optional(v.string()),
  requestedModel: v.string(),
  originalRequestedModel: v.optional(v.string()),
  policyApplied: v.optional(v.boolean()),
  reportedModel: v.optional(v.string()),
  promptTokens: v.number(),
  cachedPromptTokens: v.number(),
  completionTokens: v.number(),
  providerCostUsd: v.optional(v.number()),
  estimatedCostUsd: v.optional(v.number()),
  sameTokenEstimateUsd: v.optional(v.number()),
  costStatus: v.union(v.literal("reported"), v.literal("estimated"), v.literal("unavailable")),
  latencyMs: v.number(),
  status: v.union(v.literal("ok"), v.literal("error")),
  errorCode: v.optional(v.string()),
  trafficType: v.union(v.literal("internal"), v.literal("demo"), v.literal("external")),
  privacyMode: v.optional(v.literal("private")),
  taskId: v.optional(v.string()),
  sessionId: v.optional(v.string()),
  agentName: v.optional(v.string()),
  toolNames: v.optional(v.array(v.string())),
  toolCallCount: v.optional(v.number()),
  qualityScore: v.optional(v.union(v.literal("helpful"), v.literal("not_helpful"))),
  qualityRecordedAt: v.optional(v.number()),
};

export const record = mutation({
  args: { ...serviceAuthArgs, ...callFields },
  handler: async (ctx, args) => {
    const { serviceToken, ...call } = args;
    requireServiceToken({ serviceToken });
    const callId = await ctx.db.insert("calls", call);
    if (call.customerId !== "unattributed") {
      const customer = await ctx.db
        .query("customers")
        .withIndex("by_project_environment_customer", (q) => q
          .eq("projectId", call.projectId)
          .eq("environment", call.environment)
          .eq("customerId", call.customerId))
        .unique();
      if (!customer) {
        await ctx.db.insert("customers", {
          projectId: call.projectId,
          environment: call.environment,
          customerId: call.customerId,
          status: "active",
          createdAt: call.createdAt,
          updatedAt: call.createdAt,
        });
      }
    }
    const receipt = await ctx.db
      .query("eventReceipts")
      .withIndex("by_project_environment_key", (q) => q
        .eq("projectId", call.projectId)
        .eq("environment", call.environment)
        .eq("idempotencyKey", call.idempotencyKey))
      .unique();
    if (receipt) await ctx.db.patch(receipt._id, { state: "recorded", callId, lastSeenAt: call.createdAt });
    return callId;
  },
});

export const events = query({
  args: {
    ...serviceAuthArgs,
    projectId: v.string(),
    environment: v.union(v.literal("test"), v.literal("live")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 100), 200));
    const recent = await ctx.db
      .query("calls")
      .withIndex("by_project_createdAt", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(limit * 2);
    const calls = recent.filter((call) => (call.environment ?? "live") === args.environment).slice(0, limit);
    const receipts = await ctx.db
      .query("eventReceipts")
      .withIndex("by_project_environment_createdAt", (q) => q
        .eq("projectId", args.projectId)
        .eq("environment", args.environment))
      .order("desc")
      .take(limit * 2);
    const attempts = new Map(receipts.map((receipt) => [receipt.idempotencyKey, receipt.attempts]));
    return calls.map((call) => ({
      ...call,
      environment: call.environment ?? "live",
      eventStatus: call.eventStatus ?? (call.status === "ok" ? "accepted" : "failed"),
      pricingStatus: call.pricingStatus ?? (call.status !== "ok" ? "not_billable" : call.costStatus === "unavailable" ? "unpriced" : "priced"),
      idempotencyKey: call.idempotencyKey ?? `legacy-${call._id}`,
      duplicateAttempts: Math.max(0, (attempts.get(call.idempotencyKey ?? "") ?? 1) - 1),
    }));
  },
});

export const reserve = mutation({
  args: {
    ...serviceAuthArgs,
    projectId: v.string(),
    environment: v.union(v.literal("test"), v.literal("live")),
    idempotencyKey: v.string(),
    requestFingerprint: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const receipt = await ctx.db
      .query("eventReceipts")
      .withIndex("by_project_environment_key", (q) => q
        .eq("projectId", args.projectId)
        .eq("environment", args.environment)
        .eq("idempotencyKey", args.idempotencyKey))
      .unique();
    if (receipt) {
      await ctx.db.patch(receipt._id, { attempts: receipt.attempts + 1, lastSeenAt: args.now });
      return {
        outcome: receipt.requestFingerprint === args.requestFingerprint ? "duplicate" as const : "conflict" as const,
        callId: receipt.callId,
      };
    }
    await ctx.db.insert("eventReceipts", {
      projectId: args.projectId,
      environment: args.environment,
      idempotencyKey: args.idempotencyKey,
      requestFingerprint: args.requestFingerprint,
      state: "processing",
      attempts: 1,
      createdAt: args.now,
      lastSeenAt: args.now,
    });
    return { outcome: "accepted" as const };
  },
});

export const summary = query({
  args: { ...serviceAuthArgs, projectId: v.string(), now: v.number() },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_project_createdAt", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(50);
    const todayStart = new Date(args.now).setUTCHours(0, 0, 0, 0);
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;
    const total = (start: number) =>
      calls.reduce((sum, call) => sum + (call.createdAt >= start ? call.providerCostUsd ?? call.estimatedCostUsd ?? 0 : 0), 0);
    return { todayUsd: total(todayStart), weekUsd: total(weekStart), calls };
  },
});

export const recordQuality = mutation({
  args: {
    ...serviceAuthArgs,
    projectId: v.string(),
    callId: v.id("calls"),
    score: v.union(v.literal("helpful"), v.literal("not_helpful")),
    recordedAt: v.number(),
  },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const call = await ctx.db.get(args.callId);
    if (!call || call.projectId !== args.projectId) throw new Error("Call not found");
    await ctx.db.patch(args.callId, { qualityScore: args.score, qualityRecordedAt: args.recordedAt });
  },
});
