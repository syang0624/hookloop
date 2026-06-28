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

type DayData = {
  day: number;
  metrics: Metric[];
  alive: Variant[];
  killed: Variant[];
  scaled: Variant[];
  avgCac: number;
  avgCpc: number;
  totalSpend: number;
  totalConversions: number;
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
  const days = useMemo((): DayData[] => {
    const dayNums = Array.from(new Set(metrics.map((m) => m.day))).sort();
    return dayNums.map((day) => {
      const dayMetrics = metrics.filter((m) => m.day === day);
      const dayAllocs = allocations?.filter((a) => a.day === day) ?? [];

      const killedIds = new Set(
        dayAllocs.filter((a) => a.status === "kill").map((a) => a.variantId as string),
      );
      const scaledIds = new Set(
        dayAllocs.filter((a) => a.status === "scale").map((a) => a.variantId as string),
      );

      // If no bandit data, derive from metrics (0 impressions = killed)
      if (dayAllocs.length === 0) {
        for (const m of dayMetrics) {
          if (m.impressions === 0) killedIds.add(m.variantId as string);
        }
      }

      const alive = variants.filter((v) => !killedIds.has(v._id as string));
      const killed = variants.filter((v) => killedIds.has(v._id as string));
      const scaled = variants.filter((v) => scaledIds.has(v._id as string));

      const activeMetrics = dayMetrics.filter((m) => m.impressions > 0);
      const totalSpend = activeMetrics.reduce((s, m) => s + m.spend, 0);
      const totalConversions = activeMetrics.reduce((s, m) => s + m.conversions, 0);
      const avgCac = totalConversions > 0 ? totalSpend / totalConversions : 0;
      const totalClicks = activeMetrics.reduce((s, m) => s + m.clicks, 0);
      const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

      return { day, metrics: dayMetrics, alive, killed, scaled, avgCac, avgCpc, totalSpend, totalConversions };
    });
  }, [variants, metrics, allocations]);

  const totalDays = days.length;

  return (
    <div className="space-y-6">
      {/* Show variants first — staggered reveal */}
      {variants.length > 0 && days.length === 0 && (
        <TimelineSection
          label="Reels Generated"
          description={`${variants.length} ad variants created from hypotheses`}
          accent
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {variants.map((v, i) => (
              <VariantCard
                key={v._id}
                variant={v}
                metrics={[]}
                revealDelay={i * 400}
              />
            ))}
          </div>
        </TimelineSection>
      )}

      {/* Day-by-day sections */}
      {days.map((d, di) => {
        const prevDay = di > 0 ? days[di - 1] : null;
        const cacDelta = prevDay && prevDay.avgCac > 0 && d.avgCac > 0
          ? ((d.avgCac - prevDay.avgCac) / prevDay.avgCac * 100)
          : null;

        return (
          <div key={d.day} className="animate-fadeIn" style={{ animationDelay: `${di * 200}ms`, animationFillMode: "backwards" }}>
            {/* Day header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white text-[14px] font-bold">
                {d.day}
              </div>
              <div>
                <h3 className="font-display text-[15px] font-bold text-foreground">
                  Week {d.day}
                  {d.day === 1 && " — Initial Campaign"}
                  {d.day === 2 && " — Bandit Optimizing"}
                  {d.day === totalDays && d.day > 1 && " — Final Results"}
                </h3>
                <p className="text-[12px] text-foreground/40">
                  {d.alive.length} active reels
                  {d.killed.length > 0 && ` · ${d.killed.length} killed`}
                  {d.scaled.length > 0 && ` · ${d.scaled.length} scaling`}
                </p>
              </div>
              {cacDelta !== null && (
                <span className={`ml-auto rounded-full px-3 py-1 text-[11px] font-semibold ${
                  cacDelta < 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
                }`}>
                  CAC {cacDelta > 0 ? "+" : ""}{cacDelta.toFixed(0)}%
                </span>
              )}
            </div>

            {/* Active reels for this day */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              {d.alive.map((v, i) => {
                const allVm = metrics.filter((m) => (m.variantId as string) === (v._id as string) && m.day <= d.day);
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

            {/* Day stats bar */}
            <div className="bg-card rounded-[16px] p-4 flex flex-wrap gap-6 text-[12px] mb-2">
              <Stat label="Avg CAC" value={`$${d.avgCac.toFixed(2)}`} good={d.avgCac < 4.5} />
              <Stat label="Avg CPC" value={`$${d.avgCpc.toFixed(2)}`} />
              <Stat label="Spend" value={`$${d.totalSpend.toFixed(0)}`} />
              <Stat label="Conversions" value={`${d.totalConversions}`} />
              <Stat label="Active" value={`${d.alive.length}/${variants.length}`} />
            </div>

            {/* Killed variants callout */}
            {d.killed.length > 0 && (
              <div className="bg-red-50 rounded-[14px] p-3 text-[12px] text-red-600 mb-2">
                <span className="font-semibold">Killed:</span>{" "}
                {d.killed.map((v) => `${v.hookType}/${v.voice}`).join(", ")}
                {" — underperforming CVR floor"}
              </div>
            )}

            {/* Scaled variant callout */}
            {d.scaled.length > 0 && (
              <div className="bg-green-50 rounded-[14px] p-3 text-[12px] text-green-600 mb-2">
                <span className="font-semibold">Scaling:</span>{" "}
                {d.scaled.map((v) => `${v.hookType}/${v.voice}`).join(", ")}
                {" — top performer, getting more budget"}
              </div>
            )}

            {/* Connecting line to next day */}
            {di < totalDays - 1 && (
              <div className="flex items-center gap-2 py-3 pl-5">
                <div className="w-0.5 h-8 bg-primary/20 rounded-full" />
                <span className="text-[11px] text-foreground/30 italic">
                  System learning... reallocating budget based on performance
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Analyst insight after all days */}
      {analystText && days.length > 0 && (
        <TimelineSection
          label="Analyst Insight"
          description="What the system learned from this batch"
        >
          <div className="text-[13px] text-foreground/60 whitespace-pre-wrap leading-relaxed">
            {analystText}
          </div>
        </TimelineSection>
      )}
    </div>
  );
}

function TimelineSection({
  label,
  description,
  accent,
  children,
}: {
  label: string;
  description: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fadeIn">
      <div className="mb-3">
        <h3 className={`text-[13px] font-bold uppercase tracking-wider ${accent ? "text-primary" : "text-foreground/40"}`}>
          {label}
        </h3>
        <p className="text-[12px] text-foreground/30">{description}</p>
      </div>
      {children}
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
