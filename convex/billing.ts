import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireServiceToken, serviceAuthArgs } from "./serviceAuth";

const mode = v.union(v.literal("percentage"), v.literal("per_thousand_tokens"));
const environment = v.union(v.literal("test"), v.literal("live"));

type PeriodArgs = {
  projectId: string;
  environment: "test" | "live";
  periodStart: number;
  periodEnd: number;
};

const money = (value: number) => Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;

export async function buildPeriodPreview(ctx: QueryCtx | MutationCtx, args: PeriodArgs) {
  const [storedRules, calls, customers, legacyRule] = await Promise.all([
    ctx.db.query("pricingRules").withIndex("by_project_environment", (q) => q.eq("projectId", args.projectId).eq("environment", args.environment)).collect(),
    ctx.db.query("calls").withIndex("by_project_createdAt", (q) => q.eq("projectId", args.projectId).gte("createdAt", args.periodStart).lt("createdAt", args.periodEnd)).collect(),
    ctx.db.query("customers").withIndex("by_project_environment", (q) => q.eq("projectId", args.projectId).eq("environment", args.environment)).collect(),
    args.environment === "live"
      ? ctx.db.query("billingSettings").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).unique()
      : Promise.resolve(null),
  ]);
  const rules = storedRules.filter((rule) => rule.active);
  const defaultStored = rules.find((rule) => rule.customerId === undefined);
  const defaultRule = defaultStored
    ? {
        mode: defaultStored.mode,
        value: defaultStored.value,
        baseAmountUsd: defaultStored.baseAmountUsd,
        includedTokens: defaultStored.includedTokens,
        version: defaultStored.version,
      }
    : legacyRule
      ? { mode: legacyRule.mode, value: legacyRule.value, baseAmountUsd: 0, includedTokens: 0, version: 0 }
      : null;
  const customerRules = new Map(rules.filter((rule) => rule.customerId).map((rule) => [rule.customerId as string, rule]));
  const customerRecords = new Map(customers.map((customer) => [customer.customerId, customer]));
  const eligibleCalls = calls.filter((call) =>
    (call.environment ?? "live") === args.environment
    && call.status === "ok"
    && (call.eventStatus ?? "accepted") === "accepted",
  );
  const blockers: Array<{ code: string; customerId: string; count: number }> = [];
  const unattributed = eligibleCalls.filter((call) => !call.customerId || call.customerId === "unattributed");
  if (unattributed.length) blockers.push({ code: "unattributed", customerId: "unattributed", count: unattributed.length });
  const grouped = new Map<string, typeof eligibleCalls>();
  for (const call of eligibleCalls) {
    const customerId = call.customerId || "unattributed";
    if (customerId === "unattributed") continue;
    const current = grouped.get(customerId) ?? [];
    current.push(call);
    grouped.set(customerId, current);
  }
  const rows = Array.from(grouped, ([customerId, customerCalls]) => {
    const customer = customerRecords.get(customerId);
    const storedRule = customerRules.get(customerId);
    const rule = storedRule
      ? {
          mode: storedRule.mode,
          value: storedRule.value,
          baseAmountUsd: storedRule.baseAmountUsd,
          includedTokens: storedRule.includedTokens,
          version: storedRule.version,
        }
      : defaultRule;
    if (!customer) blockers.push({ code: "missing_customer", customerId, count: customerCalls.length });
    else if (customer.status !== "active") blockers.push({ code: "inactive_customer", customerId, count: customerCalls.length });
    else if (!customer.billingEmail && !customer.stripeCustomerId) blockers.push({ code: "missing_billing_contact", customerId, count: customerCalls.length });
    if (!rule) blockers.push({ code: "missing_rule", customerId, count: customerCalls.length });
    let tokens = 0;
    let rawCostUsd = 0;
    let unknownCostCalls = 0;
    for (const call of customerCalls) {
      tokens += call.promptTokens + call.completionTokens;
      const rawCost = call.providerCostUsd ?? call.estimatedCostUsd;
      rawCostUsd += rawCost ?? 0;
      if (rawCost === undefined || call.costStatus === "unavailable") unknownCostCalls += 1;
    }
    const unpriced = Boolean(rule?.mode === "percentage" && unknownCostCalls);
    if (unpriced) blockers.push({ code: "unpriced", customerId, count: unknownCostCalls });
    const billedAmountUsd = !rule || unpriced
      ? null
      : rule.mode === "percentage"
        ? money(rule.baseAmountUsd + rawCostUsd * (1 + rule.value / 100))
        : money(rule.baseAmountUsd + Math.max(0, tokens - rule.includedTokens) / 1_000 * rule.value);
    return {
      customerId,
      customer: customer ? {
        name: customer.name ?? customer.customerId,
        billingEmail: customer.billingEmail,
        stripeCustomerId: customer.stripeCustomerId,
        status: customer.status,
      } : null,
      calls: customerCalls.length,
      tokens,
      rawCostUsd: money(rawCostUsd),
      unknownCostCalls,
      billedAmountUsd,
      marginUsd: billedAmountUsd === null || unknownCostCalls ? null : money(billedAmountUsd - rawCostUsd),
      rule,
      sourceCallIds: customerCalls.map((call) => call._id),
    };
  }).sort((a, b) => (b.billedAmountUsd ?? -1) - (a.billedAmountUsd ?? -1));
  return { rule: defaultRule, rows, blockers, periodStart: args.periodStart, periodEnd: args.periodEnd, environment: args.environment };
}

export const saveRule = mutation({
  args: {
    ...serviceAuthArgs,
    projectId: v.string(),
    environment: v.optional(environment),
    customerId: v.optional(v.string()),
    mode,
    value: v.number(),
    baseAmountUsd: v.optional(v.number()),
    includedTokens: v.optional(v.number()),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const selectedEnvironment = args.environment ?? "live";
    const existing = await ctx.db
      .query("pricingRules")
      .withIndex("by_project_environment_customer", (q) => q
        .eq("projectId", args.projectId)
        .eq("environment", selectedEnvironment)
        .eq("customerId", args.customerId))
      .collect();
    const active = existing.find((rule) => rule.active);
    if (active) await ctx.db.patch(active._id, { active: false, updatedAt: args.now });
    return ctx.db.insert("pricingRules", {
      projectId: args.projectId,
      environment: selectedEnvironment,
      customerId: args.customerId,
      mode: args.mode,
      value: args.value,
      baseAmountUsd: args.baseAmountUsd ?? 0,
      includedTokens: args.includedTokens ?? 0,
      version: (active?.version ?? 0) + 1,
      active: true,
      createdAt: args.now,
      updatedAt: args.now,
    });
  },
});

export const getRule = query({
  args: { ...serviceAuthArgs, projectId: v.string(), environment: v.optional(environment), customerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const selectedEnvironment = args.environment ?? "live";
    const rules = await ctx.db
      .query("pricingRules")
      .withIndex("by_project_environment_customer", (q) => q
        .eq("projectId", args.projectId)
        .eq("environment", selectedEnvironment)
        .eq("customerId", args.customerId))
      .collect();
    const active = rules.find((rule) => rule.active);
    if (active) return {
      mode: active.mode,
      value: active.value,
      baseAmountUsd: active.baseAmountUsd,
      includedTokens: active.includedTokens,
      version: active.version,
      updatedAt: active.updatedAt,
    };
    if (selectedEnvironment !== "live" || args.customerId) return null;
    const legacy = await ctx.db.query("billingSettings").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).unique();
    return legacy ? { mode: legacy.mode, value: legacy.value, baseAmountUsd: 0, includedTokens: 0, version: 0, updatedAt: legacy.updatedAt } : null;
  },
});

export const listRules = query({
  args: { ...serviceAuthArgs, projectId: v.string(), environment },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const rules = await ctx.db.query("pricingRules").withIndex("by_project_environment", (q) => q.eq("projectId", args.projectId).eq("environment", args.environment)).collect();
    return rules.filter((rule) => rule.active);
  },
});

export const previewPeriod = query({
  args: { ...serviceAuthArgs, projectId: v.string(), environment, periodStart: v.number(), periodEnd: v.number() },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    return buildPeriodPreview(ctx, args);
  },
});

export const currentMonth = query({
  args: { ...serviceAuthArgs, projectId: v.string(), monthStart: v.number(), nextMonthStart: v.number() },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    return buildPeriodPreview(ctx, {
      projectId: args.projectId,
      environment: "live",
      periodStart: args.monthStart,
      periodEnd: args.nextMonthStart,
    });
  },
});
