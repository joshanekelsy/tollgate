import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireServiceToken, serviceAuthArgs } from "./serviceAuth";

export const saveConnection = mutation({
  args: {
    ...serviceAuthArgs,
    projectId: v.string(),
    encryptedSecretKey: v.string(),
    encryptedWebhookSecret: v.string(),
    keyPrefix: v.string(),
    accountId: v.string(),
    accountCountry: v.string(),
    livemode: v.boolean(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const existing = await ctx.db.query("stripeConnections").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).unique();
    const values = {
      encryptedSecretKey: args.encryptedSecretKey,
      encryptedWebhookSecret: args.encryptedWebhookSecret,
      keyPrefix: args.keyPrefix,
      accountId: args.accountId,
      accountCountry: args.accountCountry,
      livemode: args.livemode,
      updatedAt: args.now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, values);
      return existing._id;
    }
    return ctx.db.insert("stripeConnections", { projectId: args.projectId, ...values, createdAt: args.now });
  },
});

export const getConnection = query({
  args: { ...serviceAuthArgs, projectId: v.string() },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    return ctx.db.query("stripeConnections").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).unique();
  },
});

export const getMetadata = query({
  args: { ...serviceAuthArgs, projectId: v.string() },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const connection = await ctx.db.query("stripeConnections").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).unique();
    if (!connection) return null;
    return {
      keyPrefix: connection.keyPrefix,
      accountId: connection.accountId,
      accountCountry: connection.accountCountry,
      livemode: connection.livemode,
      updatedAt: connection.updatedAt,
    };
  },
});

export const removeConnection = mutation({
  args: { ...serviceAuthArgs, projectId: v.string() },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const connection = await ctx.db.query("stripeConnections").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).unique();
    if (!connection) return false;
    await ctx.db.delete(connection._id);
    return true;
  },
});

export const recordWebhook = mutation({
  args: {
    ...serviceAuthArgs,
    projectId: v.string(),
    eventId: v.string(),
    eventType: v.string(),
    stripeInvoiceId: v.string(),
    stripeStatus: v.union(v.literal("draft"), v.literal("open"), v.literal("paid"), v.literal("void"), v.literal("failed")),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const previous = await ctx.db.query("stripeWebhookEvents").withIndex("by_project_event", (q) => q.eq("projectId", args.projectId).eq("eventId", args.eventId)).unique();
    if (previous) return { duplicate: true, matched: true };
    const item = await ctx.db.query("billingRunItems").withIndex("by_project_stripe_invoice", (q) => q.eq("projectId", args.projectId).eq("stripeInvoiceId", args.stripeInvoiceId)).unique();
    await ctx.db.insert("stripeWebhookEvents", {
      projectId: args.projectId,
      eventId: args.eventId,
      eventType: args.eventType,
      stripeInvoiceId: args.stripeInvoiceId,
      receivedAt: args.now,
    });
    if (!item) return { duplicate: false, matched: false };
    await ctx.db.patch(item._id, { stripeStatus: args.stripeStatus, stripeError: undefined, updatedAt: args.now });
    const runItems = await ctx.db.query("billingRunItems").withIndex("by_run", (q) => q.eq("runId", item.runId)).collect();
    const statuses = runItems.map((candidate) => candidate._id === item._id ? args.stripeStatus : candidate.stripeStatus);
    const runStatus = statuses.some((status) => status === "failed")
      ? "partial" as const
      : statuses.every((status) => status !== "not_sent")
        ? "exported" as const
        : "exporting" as const;
    await ctx.db.patch(item.runId, { status: runStatus, exportedAt: runStatus === "exported" ? args.now : undefined });
    return { duplicate: false, matched: true };
  },
});
