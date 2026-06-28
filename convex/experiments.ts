import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getStatus = query({
  args: { batchId: v.string() },
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query("experiment_runs")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .first();
    if (!run) return null;
    return { status: run.status, progress: 0 };
  },
});

export const startBatch = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const batchId = crypto.randomUUID();
    await ctx.db.insert("experiment_runs", {
      productId: args.productId,
      batchId,
      status: "running",
      startedAt: Date.now(),
    });
    // TODO(nori): trigger agents.runStrategist action here
    return batchId;
  },
});
