import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const environment = v.union(v.literal("test"), v.literal("live"));
const provider = v.union(v.literal("openai"), v.literal("anthropic"), v.literal("gemini"), v.literal("openrouter"));

export const list = query({
  args: { projectId: v.string(), environment },
  handler: async (ctx, args) => {
    const rates = await ctx.db
      .query("rateCards")
      .withIndex("by_project_environment", (q) => q.eq("projectId", args.projectId).eq("environment", args.environment))
      .collect();
    return rates.filter((rate) => rate.active).sort((a, b) => `${a.provider}/${a.model}`.localeCompare(`${b.provider}/${b.model}`));
  },
});

export const resolve = query({
  args: { projectId: v.string(), environment, provider, model: v.string() },
  handler: async (ctx, args) => {
    const rate = await ctx.db
      .query("rateCards")
      .withIndex("by_project_environment_provider_model", (q) => q
        .eq("projectId", args.projectId)
        .eq("environment", args.environment)
        .eq("provider", args.provider)
        .eq("model", args.model))
      .unique();
    if (!rate?.active) return null;
    return {
      rateCardId: rate._id,
      inputUsdPerMillion: rate.inputUsdPerMillion,
      outputUsdPerMillion: rate.outputUsdPerMillion,
    };
  },
});

export const save = mutation({
  args: {
    projectId: v.string(),
    environment,
    provider,
    model: v.string(),
    inputUsdPerMillion: v.number(),
    outputUsdPerMillion: v.number(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("rateCards")
      .withIndex("by_project_environment_provider_model", (q) => q
        .eq("projectId", args.projectId)
        .eq("environment", args.environment)
        .eq("provider", args.provider)
        .eq("model", args.model))
      .unique();
    const values = {
      inputUsdPerMillion: args.inputUsdPerMillion,
      outputUsdPerMillion: args.outputUsdPerMillion,
      active: true,
      updatedAt: args.now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, values);
      return existing._id;
    }
    return ctx.db.insert("rateCards", {
      projectId: args.projectId,
      environment: args.environment,
      provider: args.provider,
      model: args.model,
      ...values,
      createdAt: args.now,
    });
  },
});

export const remove = mutation({
  args: { projectId: v.string(), environment, provider, model: v.string(), now: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("rateCards")
      .withIndex("by_project_environment_provider_model", (q) => q
        .eq("projectId", args.projectId)
        .eq("environment", args.environment)
        .eq("provider", args.provider)
        .eq("model", args.model))
      .unique();
    if (!existing) return false;
    await ctx.db.patch(existing._id, { active: false, updatedAt: args.now });
    return true;
  },
});
