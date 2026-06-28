"use client";

import { useMemo } from "react";
import type { Variant, Metric } from "@/lib/types";

const COLORS = [
  "#16a34a", "#2563eb", "#9333ea", "#ea580c",
  "#0891b2", "#4f46e5", "#c026d3", "#65a30d",
];

type Allocation = {
  variantId: string;
  hookType: string;
  voice: string;
  share: number;
  amount: number;
  cac: number;
  killed: boolean;
};

export default function BudgetAllocator({
  variants,
  metrics,
}: {
  variants: Variant[];
  metrics: Metric[];
}) {
  const totalBudget = variants.reduce((sum, v) => sum + v.budget, 0);

  // Compute allocations from latest-day metrics (simulating bandit reallocation)
  const allocations = useMemo((): Allocation[] => {
    if (metrics.length === 0) {
      return variants.map((v) => ({
        variantId: v._id as string,
        hookType: v.hookType,
        voice: v.voice,
        share: v.budget / totalBudget,
        amount: v.budget,
        cac: 0,
        killed: false,
      }));
    }

    const lastDay = Math.max(...metrics.map((m) => m.day));
    const latestMetrics = metrics.filter((m) => m.day === lastDay);

    // Score inversely proportional to CAC (lower CAC = higher score)
    // Killed variants (0 impressions) get 0 budget
    const scores: { id: string; score: number; cac: number; killed: boolean }[] = [];
    for (const v of variants) {
      const m = latestMetrics.find((m) => (m.variantId as string) === (v._id as string));
      if (!m || m.impressions === 0) {
        scores.push({ id: v._id as string, score: 0, cac: 0, killed: true });
      } else {
        const score = m.cac > 0 ? 1 / m.cac : 0;
        scores.push({ id: v._id as string, score, cac: m.cac, killed: false });
      }
    }

    const totalScore = scores.reduce((s, x) => s + x.score, 0);

    return variants.map((v, i) => {
      const s = scores[i];
      const share = totalScore > 0 ? s.score / totalScore : 0;
      return {
        variantId: v._id as string,
        hookType: v.hookType,
        voice: v.voice,
        share,
        amount: Math.round(share * totalBudget),
        cac: s.cac,
        killed: s.killed,
      };
    });
  }, [variants, metrics, totalBudget]);

  const activeAllocations = allocations.filter((a) => !a.killed);
  const killedCount = allocations.filter((a) => a.killed).length;

  return (
    <div>
      {/* Stacked bar */}
      <div className="flex h-8 rounded-lg overflow-hidden mb-3">
        {allocations.map((a, i) =>
          a.killed ? null : (
            <div
              key={a.variantId}
              className="relative transition-all duration-700 ease-in-out flex items-center justify-center"
              style={{
                width: `${a.share * 100}%`,
                backgroundColor: COLORS[i % COLORS.length],
                minWidth: a.share > 0 ? "2px" : "0px",
              }}
              title={`${a.hookType}/${a.voice}: $${a.amount} (CAC $${a.cac.toFixed(0)})`}
            >
              {a.share > 0.08 && (
                <span className="text-[10px] text-white font-medium truncate px-1">
                  ${a.amount}
                </span>
              )}
            </div>
          ),
        )}
      </div>

      {/* Legend */}
      <div className="space-y-1.5">
        {activeAllocations.map((a) => {
          const origIndex = allocations.indexOf(a);
          return (
            <div key={a.variantId} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[origIndex % COLORS.length] }}
              />
              <span className="text-gray-600 truncate">
                {a.hookType}/{a.voice}
              </span>
              <span className="ml-auto font-medium text-gray-800">
                ${a.amount}
              </span>
              <span className="text-gray-400 w-16 text-right">
                {(a.share * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
        {killedCount > 0 && (
          <p className="text-[10px] text-red-400 mt-1">
            {killedCount} variant{killedCount > 1 ? "s" : ""} killed (budget reallocated)
          </p>
        )}
      </div>
    </div>
  );
}
