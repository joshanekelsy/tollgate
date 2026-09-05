import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireServiceToken, serviceAuthArgs } from "./serviceAuth";

const environment = v.union(v.literal("test"), v.literal("live"));

export const list = query({
  args: { ...serviceAuthArgs, projectId: v.string(), environment },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_project_environment", (q) => q.eq("projectId", args.projectId).eq("environment", args.environment))
      .collect();
    return customers.sort((a, b) => (a.name ?? a.customerId).localeCompare(b.name ?? b.customerId));
  },
});

export const upsert = mutation({
  args: {
    ...serviceAuthArgs,
    projectId: v.string(),
    environment,
    customerId: v.string(),
    name: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("archived")),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_project_environment_customer", (q) => q
        .eq("projectId", args.projectId)
        .eq("environment", args.environment)
        .eq("customerId", args.customerId))
      .unique();
    const values = {
      name: args.name,
      billingEmail: args.billingEmail,
      stripeCustomerId: args.stripeCustomerId,
      status: args.status,
      updatedAt: args.now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, values);
      return existing._id;
    }
    return ctx.db.insert("customers", {
      projectId: args.projectId,
      environment: args.environment,
      customerId: args.customerId,
      ...values,
      createdAt: args.now,
    });
  },
});
