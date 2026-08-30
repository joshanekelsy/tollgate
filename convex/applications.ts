import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const apply = mutation({
  args: {
    createdAt: v.number(), name: v.string(), email: v.string(), provider: v.literal("openai"), pain: v.optional(v.string()),
    source: v.union(v.literal("growthx"), v.literal("linkedin"), v.literal("direct"), v.literal("other")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("testApplications").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    return existing?._id ?? ctx.db.insert("testApplications", args);
  },
});
