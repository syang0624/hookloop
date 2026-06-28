/**
 * Loop orchestration + status.
 *
 * startBatch is the single trigger Steven calls to run the whole pipeline. It
 * does NOT spin up a fresh batch on top of the one products.create already
 * opened — it reuses the product's running experiment_run (creating one only as
 * a fallback) so the batchId the form received stays the batchId everything
 * streams into. From there it kicks off runStrategist; each agent/simulator step
 * schedules the next, so this mutation returns immediately.
 *
 * getStatus reports BOTH `status` (CLAUDE.md contract) and `phase` (NORI.md
 * contract) so neither side breaks — the two specs disagreed on the field name.
 */

import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const TOTAL_DAYS = 3;

type Phase = "strategizing" | "generating" | "simulating" | "analyzing" | "complete";

export const startBatch = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    // Reuse the running run opened by products.create; fall back to creating one.
    const existing = await ctx.db
      .query("experiment_runs")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .filter((q) => q.eq(q.field("status"), "running"))
      .order("desc")
      .first();

    let batchId = existing?.batchId;
    if (!batchId) {
      batchId = `batch_${crypto.randomUUID()}`;
      await ctx.db.insert("experiment_runs", {
        productId: args.productId,
        batchId,
        status: "running",
        startedAt: Date.now(),
      });
    }

    // Fire the loop. Strategist → Generator → Simulator → Analyst self-chain.
    await ctx.scheduler.runAfter(0, internal.agents.runStrategist, {
      productId: args.productId,
      batchId,
    });

    return batchId;
  },
});

export const getStatus = query({
  args: { batchId: v.string() },
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query("experiment_runs")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .first();
    if (!run) return null;

    // Derive the phase from what the pipeline has produced so far.
    const hypotheses = await ctx.db
      .query("hypotheses")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .collect();
    const variants = await ctx.db
      .query("ad_variants")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .collect();
    const metrics = await ctx.db
      .query("campaign_metrics")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .collect();
    const analystDone = await ctx.db
      .query("agent_reasoning")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .filter((q) => q.eq(q.field("agent"), "analyst"))
      .first();

    const daysInserted = new Set(metrics.map((m) => m.day)).size;

    let phase: Phase;
    let progress: number;
    if (run.status === "complete") {
      phase = analystDone ? "complete" : "analyzing";
      progress = analystDone ? 1 : 0.9;
    } else if (metrics.length > 0) {
      phase = "simulating";
      progress = 0.3 + 0.5 * (daysInserted / TOTAL_DAYS);
    } else if (variants.length > 0) {
      phase = "generating";
      progress = 0.3;
    } else if (hypotheses.length > 0) {
      phase = "generating";
      progress = 0.2;
    } else {
      phase = "strategizing";
      progress = 0.1;
    }

    return { status: run.status, phase, progress };
  },
});
