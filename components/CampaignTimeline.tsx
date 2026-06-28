"use client";

import { useMemo } from "react";
import type { Variant, Metric } from "@/lib/types";
import VariantCard from "./VariantCard";

type BanditRow = {
  day: number;
  variantId: string;
  share: number;
  dailyBudget: number;
  status: "scale" | "explore" | "kill";
};

type RoundData = {
  round: number;
  phase: "test" | "optimize" | "winner";
  title: string;
  subtitle: string;
  variants: Variant[];
  metrics: Metric[];
  killed: Variant[];
  scaled: Variant[];
  avgCac: number;
  avgCpc: number;
  totalSpend: number;
  totalConversions: number;
  cacDelta: number | null;
  insight: string | null;
};

export default function CampaignTimeline({
  variants,
  metrics,
  allocations,
  analystText,
}: {
  variants: Variant[];
  metrics: Metric[];
  allocations?: BanditRow[];
  analystText?: string;
}) {
  // Group variants by hypothesis for round-based reveal
  const hypothesisGroups = useMemo(() => {
    const groups = new Map<string, Variant[]>();
    for (const v of variants) {
      const key = v.hypothesis;
      const arr = groups.get(key) ?? [];
      arr.push(v);
      groups.set(key, arr);
    }
    return Array.from(groups.entries());
  }, [variants]);

  const rounds = useMemo((): RoundData[] => {
    const dayNums = Array.from(new Set(metrics.map((m) => m.day))).sort();
    if (dayNums.length === 0 && variants.length === 0) return [];

    const result: RoundData[] = [];
    let prevCac = 0;

    dayNums.forEach((day, di) => {
      const dayMetrics = metrics.filter((m) => m.day === day);
      const dayAllocs = allocations?.filter((a) => a.day === day) ?? [];

      const killedIds = new Set(
        dayAllocs.filter((a) => a.status === "kill").map((a) => a.variantId as string),
      );
      const scaledIds = new Set(
        dayAllocs.filter((a) => a.status === "scale").map((a) => a.variantId as string),
      );
      if (dayAllocs.length === 0) {
        for (const m of dayMetrics) {
          if (m.impressions === 0) killedIds.add(m.variantId as string);
        }
      }

      const alive = variants.filter((v) => !killedIds.has(v._id as string));
      const killed = variants.filter((v) => killedIds.has(v._id as string));
      const scaled = variants.filter((v) => scaledIds.has(v._id as string));

      const active = dayMetrics.filter((m) => m.impressions > 0);
      const totalSpend = active.reduce((s, m) => s + m.spend, 0);
      const totalConversions = active.reduce((s, m) => s + m.conversions, 0);
      const avgCac = totalConversions > 0 ? totalSpend / totalConversions : 0;
      const totalClicks = active.reduce((s, m) => s + m.clicks, 0);
      const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
      const cacDelta = prevCac > 0 && avgCac > 0 ? ((avgCac - prevCac) / prevCac * 100) : null;

      const isFirst = di === 0;
      const isLast = di === dayNums.length - 1;

      let insight: string | null = null;
      if (killed.length > 0 && !isFirst) {
        const killedHooks = killed.map((v) => v.hookType).join(", ");
        const survivorHooks = alive.slice(0, 2).map((v) => `${v.hookType}/${v.voice}`).join(", ");
        insight = `The ${killedHooks} approach isn't working — CVR too low. Reallocating budget to ${survivorHooks} which show stronger purchase intent.`;
      }
      if (scaled.length > 0 && isLast) {
        const winner = scaled[0];
        insight = `Found the winner: ${winner.hookType}/${winner.voice} is driving the lowest CAC at $${avgCac.toFixed(2)}. This reel style should be the template for the next campaign.`;
      }

      result.push({
        round: di + 1,
        phase: isFirst ? "test" : isLast ? "winner" : "optimize",
        title: isFirst
          ? `Week ${day} — Launch & Test`
          : isLast
            ? `Week ${day} — Winner Found`
            : `Week ${day} — Optimize & Iterate`,
        subtitle: isFirst
          ? `${alive.length} reels deployed across ${hypothesisGroups.length} hypotheses · Collecting engagement data`
          : isLast
            ? `${alive.length} high-performers from ${variants.length} tested · Lowest CPC identified`
            : `Cut ${killed.length} underperformers · Reallocating $${Math.round(totalSpend)} to top ${alive.length} reels`,
        variants: alive,
        metrics: dayMetrics,
        killed,
        scaled,
        avgCac,
        avgCpc,
        totalSpend,
        totalConversions,
        cacDelta,
        insight,
      });

      prevCac = avgCac;
    });

    return result;
  }, [variants, metrics, allocations, hypothesisGroups.length]);

  // Pre-data: show variants appearing one by one
  if (variants.length > 0 && rounds.length === 0) {
    return (
      <div className="space-y-6">
        <StepHeader
          step={1}
          title="Generating Reels"
          subtitle="AI is creating ad variants from your hypotheses"
          phase="test"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {variants.map((v, i) => (
            <VariantCard
              key={v._id}
              variant={v}
              metrics={[]}
              revealDelay={i * 500}
              compact
            />
          ))}
        </div>
        <WaitingPulse text="Waiting for campaign data..." />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {rounds.map((r, ri) => (
        <div key={r.round}>
          {/* Step header */}
          <StepHeader step={r.round} title={r.title} subtitle={r.subtitle} phase={r.phase} />

          {/* Reel grid — staggered */}
          <div className="ml-5 pl-7 border-l-2 border-primary/10 pb-2">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              {r.variants.map((v, i) => {
                const allVm = metrics.filter(
                  (m) => (m.variantId as string) === (v._id as string) && m.day <= r.round,
                );
                return (
                  <VariantCard
                    key={v._id}
                    variant={v}
                    metrics={allVm}
                    revealDelay={i * 300}
                    compact
                  />
                );
              })}
            </div>

            {/* Data reaction bar */}
            <div className="bg-card rounded-[16px] p-4 mb-3 animate-fadeIn" style={{ animationDelay: `${r.variants.length * 300 + 200}ms`, animationFillMode: "backwards" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/30">Data Reaction</span>
                {r.cacDelta !== null && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    r.cacDelta < 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
                  }`}>
                    CAC {r.cacDelta > 0 ? "+" : ""}{r.cacDelta.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-6 text-[12px]">
                <Stat label="CPC" value={`$${r.avgCpc.toFixed(2)}`} />
                <Stat label="CAC" value={`$${r.avgCac.toFixed(2)}`} good={r.avgCac > 0 && r.avgCac < 4.5} />
                <Stat label="Spend" value={`$${r.totalSpend.toFixed(0)}`} />
                <Stat label="Conv." value={`${r.totalConversions}`} />
                <Stat label="Active" value={`${r.variants.length}/${variants.length}`} />
              </div>
            </div>

            {/* Killed callout */}
            {r.killed.length > 0 && (
              <div className="bg-red-50 rounded-[14px] p-3 text-[12px] text-red-600 mb-3 animate-fadeIn" style={{ animationDelay: `${r.variants.length * 300 + 400}ms`, animationFillMode: "backwards" }}>
                <span className="font-semibold">Killed {r.killed.length} reel{r.killed.length > 1 ? "s" : ""}:</span>{" "}
                {r.killed.map((v) => `${v.hookType}/${v.voice}`).join(", ")}
              </div>
            )}

            {/* Scaling callout */}
            {r.scaled.length > 0 && (
              <div className="bg-green-50 rounded-[14px] p-3 text-[12px] text-green-600 mb-3 animate-fadeIn" style={{ animationDelay: `${r.variants.length * 300 + 500}ms`, animationFillMode: "backwards" }}>
                <span className="font-semibold">Scaling:</span>{" "}
                {r.scaled.map((v) => `${v.hookType}/${v.voice}`).join(", ")}
                {" — getting more budget"}
              </div>
            )}

            {/* System insight / hypothesis revision */}
            {r.insight && (
              <div className="bg-primary/5 rounded-[14px] p-4 mb-3 animate-fadeIn" style={{ animationDelay: `${r.variants.length * 300 + 600}ms`, animationFillMode: "backwards" }}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary/60 mb-1">
                  {r.phase === "winner" ? "Conclusion" : "Hypothesis Revision"}
                </p>
                <p className="text-[13px] text-foreground/70 leading-relaxed">{r.insight}</p>
              </div>
            )}
          </div>

          {/* Connector between rounds */}
          {ri < rounds.length - 1 && (
            <div className="flex items-center gap-3 py-4 ml-5 pl-7">
              <div className="flex items-center gap-3 text-[11px] text-foreground/30 bg-background rounded-full px-4 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                <span>~3-5 days later</span>
                <span className="text-foreground/15">|</span>
                <span className="italic">Analyzing results, generating new hypothesis, creating improved reels</span>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Final analyst summary */}
      {analystText && rounds.length > 0 && (
        <div className="mt-6 animate-fadeIn" style={{ animationDelay: "800ms", animationFillMode: "backwards" }}>
          <StepHeader
            step={rounds.length + 1}
            title="Campaign Complete"
            subtitle="Full analysis of what worked and why"
            phase="winner"
          />
          <div className="ml-5 pl-7 border-l-2 border-green-400/30">
            <div className="bg-card rounded-[16px] p-5 text-[13px] text-foreground/60 whitespace-pre-wrap leading-relaxed">
              {analystText}
            </div>
          </div>
        </div>
      )}

      {/* No data yet */}
      {variants.length === 0 && rounds.length === 0 && (
        <WaitingPulse text="Waiting for reels to be generated..." />
      )}
    </div>
  );
}

function StepHeader({
  step,
  title,
  subtitle,
  phase,
}: {
  step: number;
  title: string;
  subtitle: string;
  phase: "test" | "optimize" | "winner";
}) {
  const colors = {
    test: "bg-primary text-white",
    optimize: "bg-amber-500 text-white",
    winner: "bg-green-500 text-white",
  };
  return (
    <div className="flex items-center gap-3 mb-4 animate-fadeIn">
      <div className={`flex items-center justify-center w-9 h-9 rounded-full text-[13px] font-bold ${colors[phase]}`}>
        {step}
      </div>
      <div>
        <h3 className="font-display text-[15px] font-bold text-foreground">{title}</h3>
        <p className="text-[12px] text-foreground/40">{subtitle}</p>
      </div>
    </div>
  );
}

function WaitingPulse({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-foreground/30 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-primary/10 mb-3 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-primary/30 animate-ping" />
      </div>
      <p className="text-[13px] font-medium">{text}</p>
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div>
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-foreground/30">{label}</span>
      <span className={`text-[14px] font-bold ${good ? "text-green-600" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
