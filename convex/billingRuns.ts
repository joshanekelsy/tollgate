import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { buildPeriodPreview } from "./billing";

export const list = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const runs = await ctx.db.query("billingRuns").withIndex("by_project", (q) => q.eq("projectId", projectId)).order("desc").take(24);
    return Promise.all(runs.map(async (run) => ({
      ...run,
      items: await ctx.db.query("billingRunItems").withIndex("by_run", (q) => q.eq("runId", run._id)).collect(),
    })));
  },
});

export const get = query({
  args: { projectId: v.string(), runId: v.id("billingRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || run.projectId !== args.projectId) return null;
    const items = await ctx.db.query("billingRunItems").withIndex("by_run", (q) => q.eq("runId", run._id)).collect();
    return { ...run, items };
  },
});

export const closePeriod = mutation({
  args: { projectId: v.string(), periodStart: v.number(), periodEnd: v.number(), now: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("billingRuns")
      .withIndex("by_project_environment_period", (q) => q
        .eq("projectId", args.projectId)
        .eq("environment", "live")
        .eq("periodStart", args.periodStart)
        .eq("periodEnd", args.periodEnd))
      .unique();
    if (existing) {
      const items = await ctx.db.query("billingRunItems").withIndex("by_run", (q) => q.eq("runId", existing._id)).collect();
      return { closed: true as const, existing: true, run: existing, items, blockers: [] };
    }
    const preview = await buildPeriodPreview(ctx, {
      projectId: args.projectId,
      environment: "live",
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
    });
    const blockers = [...preview.blockers];
    if (!preview.rows.length) blockers.push({ code: "no_usage", customerId: "", count: 0 });
    if (blockers.length) return { closed: false as const, existing: false, run: null, items: [], blockers };
    const totalAmountCents = preview.rows.reduce((sum, row) => sum + Math.round((row.billedAmountUsd ?? 0) * 100), 0);
    const totalRawCostCents = preview.rows.reduce((sum, row) => sum + Math.round(row.rawCostUsd * 100), 0);
    const runId = await ctx.db.insert("billingRuns", {
      projectId: args.projectId,
      environment: "live",
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      currency: "usd",
      status: "closed",
      customerCount: preview.rows.length,
      totalAmountCents,
      totalRawCostCents,
      createdAt: args.now,
      closedAt: args.now,
    });
    const itemIds = [];
    for (const row of preview.rows) {
      if (!row.customer || !row.rule || row.billedAmountUsd === null) throw new Error("Billing preview changed during close");
      itemIds.push(await ctx.db.insert("billingRunItems", {
        runId,
        projectId: args.projectId,
        customerId: row.customerId,
        customerName: row.customer.name,
        billingEmail: row.customer.billingEmail,
        stripeCustomerId: row.customer.stripeCustomerId,
        sourceCallIds: row.sourceCallIds,
        calls: row.calls,
        tokens: row.tokens,
        rawCostCents: Math.round(row.rawCostUsd * 100),
        unknownCostCalls: row.unknownCostCalls,
        amountCents: Math.round(row.billedAmountUsd * 100),
        marginCents: row.marginUsd === null ? undefined : Math.round(row.marginUsd * 100),
        rule: row.rule,
        stripeStatus: "not_sent",
        createdAt: args.now,
        updatedAt: args.now,
      }));
    }
    const run = await ctx.db.get(runId);
    const items = await Promise.all(itemIds.map((id) => ctx.db.get(id)));
    return { closed: true as const, existing: false, run, items: items.filter((item) => item !== null), blockers: [] };
  },
});

export const beginStripeExport = mutation({
  args: { projectId: v.string(), runId: v.id("billingRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || run.projectId !== args.projectId) return false;
    if (run.status === "closed" || run.status === "partial") await ctx.db.patch(run._id, { status: "exporting" });
    return true;
  },
});

export const recordStripeInvoice = mutation({
  args: { projectId: v.string(), itemId: v.id("billingRunItems"), stripeInvoiceId: v.string(), now: v.number() },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item || item.projectId !== args.projectId) return false;
    await ctx.db.patch(item._id, { stripeInvoiceId: args.stripeInvoiceId, stripeError: undefined, updatedAt: args.now });
    return true;
  },
});

export const recordStripeResult = mutation({
  args: {
    projectId: v.string(),
    itemId: v.id("billingRunItems"),
    stripeStatus: v.union(v.literal("draft"), v.literal("failed")),
    error: v.optional(v.string()),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item || item.projectId !== args.projectId) return false;
    await ctx.db.patch(item._id, { stripeStatus: args.stripeStatus, stripeError: args.error, updatedAt: args.now });
    const items = await ctx.db.query("billingRunItems").withIndex("by_run", (q) => q.eq("runId", item.runId)).collect();
    const statuses = items.map((candidate) => candidate._id === item._id ? args.stripeStatus : candidate.stripeStatus);
    const runStatus = statuses.some((status) => status === "failed")
      ? "partial" as const
      : statuses.every((status) => status !== "not_sent")
        ? "exported" as const
        : "exporting" as const;
    await ctx.db.patch(item.runId, { status: runStatus, exportedAt: runStatus === "exported" ? args.now : undefined });
    return true;
  },
});
