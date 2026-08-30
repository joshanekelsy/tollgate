import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  testApplications: defineTable({
    createdAt: v.number(), name: v.string(), email: v.string(), provider: v.literal("openai"), pain: v.optional(v.string()),
    source: v.union(v.literal("growthx"), v.literal("linkedin"), v.literal("direct"), v.literal("other")),
  }).index("by_email", ["email"]),
});
