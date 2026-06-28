/**
 * Pure campaign simulator (Mode A — heuristic, no live ad APIs).
 *
 * Given variants + budget + a number of days, produces per-variant, per-day
 * metrics that are internally consistent (CPC = spend/clicks, CAC =
 * spend/conversions) and REPRODUCIBLE: all randomness flows through a seeded
 * PRNG, so the same inputs always yield the same demo (NORI.md correctness
 * check: "no randomness without a seed").
 *
 * Pipeline per variant per day:
 *   1. effective ctr/cvr = baseline × Π(DNA multipliers)   [dnaWeights]
 *   2. impressions = dailySpend / (cpm / 1000)
 *   3. clicks      ~ Binomial(impressions, ctr)  (normal approx + noise)
 *   4. conversions ~ Binomial(clicks, cvr)        (normal approx + noise)
 *   5. derive cpc, ctr, cac, cvr from the sampled counts
 *
 * Note the lever: because CAC = spend / conversions, only cvr lowers CAC. A
 * high-ctr / low-cvr variant (curiosity hook, learn-more CTA) gets cheap clicks
 * and a low CPC, yet its CAC stays high — which is the whole point.
 */

import type { Variant } from "../types";
import { baseline, effectiveRates } from "./dnaWeights";

export type SimulatedMetric = {
  variantId: Variant["_id"];
  day: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  cpc: number;
  ctr: number;
  cac: number; // spend / conversions; 0 is the sentinel for "no conversions yet"
  cvr: number;
};

/** mulberry32 — tiny, fast, deterministic PRNG. Same seed ⇒ same stream. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic string → 32-bit seed so each variant+day has its own stream. */
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Standard normal via Box–Muller, drawn from the seeded uniform. */
function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Binomial(n, p) via normal approximation: mean np, sd sqrt(np(1-p)).
 * Cheap, smooth, and good enough at the impression/click counts we deal with.
 * Clamped to [0, n] and rounded to whole events.
 */
function sampleBinomial(n: number, p: number, rng: () => number): number {
  if (n <= 0 || p <= 0) return 0;
  const mean = n * p;
  const sd = Math.sqrt(n * p * (1 - p));
  const draw = Math.round(mean + sd * gaussian(rng));
  return Math.max(0, Math.min(n, draw));
}

export type RunCampaignInput = {
  variants: Variant[];
  totalBudget: number;
  days: number;
  /** Campaign-level seed; vary it to get a different (still reproducible) run. */
  seed?: number;
};

/**
 * Simulate the whole campaign and return a flat list of per-variant, per-day
 * metric rows (day is 1-indexed). The Convex action (Task 6) inserts these one
 * simulated day at a time on a scheduler so the dashboard streams.
 */
export function runCampaign(input: RunCampaignInput): SimulatedMetric[] {
  const { variants, totalBudget, days } = input;
  const campaignSeed = input.seed ?? 1337;
  const out: SimulatedMetric[] = [];

  // Even split as the fallback when a variant carries no explicit budget.
  const evenShare = variants.length > 0 ? totalBudget / variants.length : 0;

  for (const variant of variants) {
    const { ctr: effCtr, cvr: effCvr } = effectiveRates(variant);
    const variantTotal = variant.budget > 0 ? variant.budget : evenShare;
    const dailySpend = days > 0 ? variantTotal / days : 0;
    const impressions = Math.round((dailySpend / baseline.cpm) * 1000);

    for (let day = 1; day <= days; day++) {
      // Per (campaign, variant, day) stream → reproducible and independent.
      const rng = mulberry32(hashSeed(`${campaignSeed}:${variant._id}:${day}`));

      const clicks = sampleBinomial(impressions, effCtr, rng);
      const conversions = sampleBinomial(clicks, effCvr, rng);
      const spend = round2(dailySpend);

      out.push({
        variantId: variant._id,
        day,
        impressions,
        clicks,
        conversions,
        spend,
        cpc: clicks > 0 ? round2(spend / clicks) : 0,
        ctr: impressions > 0 ? round4(clicks / impressions) : 0,
        cac: conversions > 0 ? round2(spend / conversions) : 0,
        cvr: clicks > 0 ? round4(conversions / clicks) : 0,
      });
    }
  }

  return out;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round4 = (n: number): number => Math.round(n * 10000) / 10000;
