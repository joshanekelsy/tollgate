import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const provider = v.union(v.literal("openai"), v.literal("anthropic"), v.literal("gemini"), v.literal("openrouter"));

export const resolve = query({
  args: { projectId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const policy = await ctx.db.query("taskPolicies").withIndex("by_project_task", (q) => q.eq("projectId", args.projectId).eq("taskId", args.taskId)).unique();
    return policy?.active ? { taskId: policy.taskId, provider: policy.provider ?? "openai", approvedModel: policy.approvedModel } : null;
  },
});

export const list = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => ctx.db.query("taskPolicies").withIndex("by_project", (q) => q.eq("projectId", projectId)).filter((q) => q.eq(q.field("active"), true)).collect(),
});

export const approve = mutation({
  args: { projectId: v.string(), taskId: v.string(), provider: v.optional(provider), approvedModel: v.string(), now: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("taskPolicies").withIndex("by_project_task", (q) => q.eq("projectId", args.projectId).eq("taskId", args.taskId)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { provider: args.provider ?? "openai", approvedModel: args.approvedModel, active: true, updatedAt: args.now });
      return existing._id;
    }
    return ctx.db.insert("taskPolicies", { projectId: args.projectId, taskId: args.taskId, provider: args.provider ?? "openai", approvedModel: args.approvedModel, active: true, createdAt: args.now, updatedAt: args.now });
  },
});

export const remove = mutation({
  args: { projectId: v.string(), taskId: v.string(), now: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("taskPolicies").withIndex("by_project_task", (q) => q.eq("projectId", args.projectId).eq("taskId", args.taskId)).unique();
    if (existing) await ctx.db.patch(existing._id, { active: false, updatedAt: args.now });
  },
});
