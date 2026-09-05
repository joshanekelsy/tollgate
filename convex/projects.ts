import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireServiceToken, serviceAuthArgs } from "./serviceAuth";

export const create = mutation({
  args: {
    ...serviceAuthArgs,
    projectId: v.string(),
    name: v.string(),
    dashboardCodeHash: v.string(),
    dashboardCodeLookup: v.string(),
    createdAt: v.number(),
    meterKeys: v.array(v.object({
      environment: v.union(v.literal("test"), v.literal("live")),
      keyHash: v.string(),
      keyPrefix: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const { serviceToken, meterKeys, ...project } = args;
    requireServiceToken({ serviceToken });
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .unique();

    if (existing) throw new Error("Project ID already exists");
    const projectDocId = await ctx.db.insert("projects", { ...project, active: true });
    for (const key of meterKeys) {
      await ctx.db.insert("meterKeys", { ...key, projectId: args.projectId, active: true, createdAt: args.createdAt });
    }
    return projectDocId;
  },
});

export const authenticateWriteKey = query({
  args: { ...serviceAuthArgs, projectId: v.string(), keyHash: v.string() },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const key = await ctx.db
      .query("meterKeys")
      .withIndex("by_project_hash", (q) => q.eq("projectId", args.projectId).eq("keyHash", args.keyHash))
      .unique();
    if (!key?.active) return null;
    return { environment: key.environment };
  },
});

export const rotateWriteKey = mutation({
  args: {
    ...serviceAuthArgs,
    projectId: v.string(),
    environment: v.union(v.literal("test"), v.literal("live")),
    keyHash: v.string(),
    keyPrefix: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const existing = await ctx.db
      .query("meterKeys")
      .withIndex("by_project_environment", (q) => q.eq("projectId", args.projectId).eq("environment", args.environment))
      .collect();
    for (const key of existing) {
      if (key.active) await ctx.db.patch(key._id, { active: false, rotatedAt: args.now });
    }
    return ctx.db.insert("meterKeys", {
      projectId: args.projectId,
      environment: args.environment,
      keyHash: args.keyHash,
      keyPrefix: args.keyPrefix,
      active: true,
      createdAt: args.now,
    });
  },
});

export const listKeyMetadata = query({
  args: { ...serviceAuthArgs, projectId: v.string() },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const keys = await ctx.db.query("meterKeys").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).collect();
    return keys.filter((key) => key.active).map((key) => ({
      environment: key.environment,
      keyPrefix: key.keyPrefix,
      createdAt: key.createdAt,
    }));
  },
});

export const findByCodeLookup = query({
  args: { ...serviceAuthArgs, dashboardCodeLookup: v.string() },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const project = await ctx.db
      .query("projects")
      .withIndex("by_dashboardCodeLookup", (q) => q.eq("dashboardCodeLookup", args.dashboardCodeLookup))
      .unique();
    if (!project?.active) return null;
    return { projectId: project.projectId, name: project.name, dashboardCodeHash: project.dashboardCodeHash };
  },
});

export const resolveActive = query({
  args: { ...serviceAuthArgs, projectId: v.string() },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const project = await ctx.db
      .query("projects")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .unique();

    return project?.active ? { projectId: project.projectId } : null;
  },
});

export const getAccessRecord = query({
  args: { ...serviceAuthArgs, projectId: v.string() },
  handler: async (ctx, args) => {
    requireServiceToken(args);
    const project = await ctx.db
      .query("projects")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .unique();

    if (!project?.active) return null;
    return {
      projectId: project.projectId,
      dashboardCodeHash: project.dashboardCodeHash,
    };
  },
});
