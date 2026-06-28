/**
 * Campaign simulator as a Convex action layer over the pure simulator.
 *
 * The demo can't wait three real days, so we fake the passage of time: day 1's
 * metrics are inserted immediately, then a self-scheduling action drops day 2
 * and day 3 two seconds apart. Because campaign_metrics is reactive, Steven's
 * dashboard lights up row-by-row with no polling — the "Best Use of Convex"
 * surface. After the final day we mark the run complete and trigger the Analyst.
 *
 * Determinism: the pure runCampaign is seeded off the batchId, so every day's
 * numbers are stable and the whole campaign is reproducible across reruns.
 */

import { internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { runCampaign as simulate } from "../lib/simulator/runCampaign";

const TOTAL_DAYS = 3;
const DAY_DELAY_MS = 2000;

/** Stable numeric seed from a batchId so each batch differs but is repeatable. */
function seedFromBatch(batchId: string): number {
  let h = 2166136261;
  for (let i = 0; i < batchId.length; i++) {
    h ^= batchId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Entry point (scheduled by the Generator). Kicks off the day-by-day stream.
 */
export const runCampaign = internalAction({
  args: { batchId: v.string() },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.simulator.streamDay, {
      batchId: args.batchId,
      day: 1,
    });
  },
});

/**
 * Insert one simulated day's metrics, then either schedule the next day or, on
 * the last day, close the run and hand off to the Analyst.
 *
 * We recompute the full (deterministic) campaign each call and slice out the
 * current day — cheaper and simpler than threading large payloads through the
 * scheduler, and guaranteed consistent because the seed is fixed.
 */
export const streamDay = internalAction({
  args: { batchId: v.string(), day: v.number() },
  handler: async (ctx, args) => {
    const variants = await ctx.runQuery(api.variants.listByBatch, { batchId: args.batchId });
    if (variants.length === 0) {
      throw new Error(`Simulator: no variants for batch ${args.batchId}`);
    }
    const productId = variants[0].productId;
    const totalBudget = variants.reduce((acc, vr) => acc + vr.budget, 0);

    const all = simulate({
      variants,
      totalBudget,
      days: TOTAL_DAYS,
      seed: seedFromBatch(args.batchId),
    });
    const todays = all.filter((m) => m.day === args.day);

    await ctx.runMutation(internal.simulator.insertDayMetrics, {
      batchId: args.batchId,
      metrics: todays,
    });

    if (args.day < TOTAL_DAYS) {
      await ctx.scheduler.runAfter(DAY_DELAY_MS, internal.simulator.streamDay, {
        batchId: args.batchId,
        day: args.day + 1,
      });
    } else {
      await ctx.runMutation(internal.simulator.markComplete, { batchId: args.batchId });
      await ctx.scheduler.runAfter(0, internal.agents.runAnalyst, {
        productId,
        batchId: args.batchId,
      });
    }
  },
});

export const insertDayMetrics = internalMutation({
  args: {
    batchId: v.string(),
    metrics: v.array(
      v.object({
        variantId: v.id("ad_variants"),
        day: v.number(),
        impressions: v.number(),
        clicks: v.number(),
        conversions: v.number(),
        spend: v.number(),
        cpc: v.number(),
        ctr: v.number(),
        cac: v.number(),
        cvr: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const m of args.metrics) {
      await ctx.db.insert("campaign_metrics", { batchId: args.batchId, ...m });
    }
  },
});

export const markComplete = internalMutation({
  args: { batchId: v.string() },
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query("experiment_runs")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .first();
    if (run) await ctx.db.patch(run._id, { status: "complete" });
  },
});
