import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    landingUrl: v.string(),
    valueProp: v.string(),
    targetCustomer: v.string(),
    pricing: v.string(),
    painPoint: v.string(),
    dailyBudget: v.number(),
    totalBudget: v.number(),
    maxCPC: v.number(),
    targetCAC: v.number(),
    goal: v.string(),
  }),

  hypotheses: defineTable({
    productId: v.id("products"),
    batchId: v.string(),
    text: v.string(),
    reasoning: v.string(),
  }).index("by_batch", ["batchId"]),

  ad_variants: defineTable({
    productId: v.id("products"),
    batchId: v.string(),
    hookType: v.string(),
    scriptType: v.string(),
    voice: v.string(),
    music: v.string(),
    pacing: v.string(),
    cta: v.string(),
    audience: v.string(),
    script: v.string(),
    hypothesis: v.string(),
    budget: v.number(),
    killRule: v.string(),
    scaleRule: v.string(),
  }).index("by_batch", ["batchId"]),

  experiment_runs: defineTable({
    productId: v.id("products"),
    batchId: v.string(),
    status: v.union(v.literal("running"), v.literal("complete")),
    startedAt: v.number(),
  })
    .index("by_batch", ["batchId"])
    .index("by_product", ["productId"]),

  // ADDED by Nori (not in the original CLAUDE.md schema): backs the live
  // agent-reasoning panel. Stores each agent's human-readable stream plus the
  // full structured output as a JSON string. Flagged for Steven.
  agent_reasoning: defineTable({
    batchId: v.string(),
    agent: v.union(
      v.literal("strategist"),
      v.literal("generator"),
      v.literal("analyst"),
    ),
    content: v.string(),
    data: v.string(),
    createdAt: v.number(),
  }).index("by_batch", ["batchId"]),

  campaign_metrics: defineTable({
    variantId: v.id("ad_variants"),
    batchId: v.string(),
    day: v.number(),
    impressions: v.number(),
    clicks: v.number(),
    conversions: v.number(),
    spend: v.number(),
    cpc: v.number(),
    ctr: v.number(),
    cac: v.number(),
    cvr: v.number(),
  }).index("by_batch", ["batchId"])
    .index("by_variant", ["variantId"]),
});
