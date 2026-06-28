"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Hypothesis, Variant, Metric, AnalystData } from "@/lib/types";
import CampaignTimeline from "@/components/CampaignTimeline";
import WeeklyReport from "@/components/WeeklyReport";
import AgentReasoningPanel from "@/components/AgentReasoningPanel";
import BudgetAllocator from "@/components/BudgetAllocator";
import DNAHeatmap from "@/components/DNAHeatmap";
import MetricsChart from "@/components/MetricsChart";
import HypothesisList from "@/components/HypothesisList";

const PHASE_LABELS: Record<string, string> = {
  strategizing: "Strategizing...",
  generating: "Generating variants...",
  simulating: "Simulating campaign...",
  analyzing: "Analyzing results...",
  complete: "Complete",
  failed: "Failed",
};

export default function DashboardPage({
  params,
}: {
  params: { batchId: string };
}) {
  const { batchId } = params;
  return <LiveDashboard batchId={batchId} />;
}

function LiveDashboard({ batchId }: { batchId: string }) {
  const router = useRouter();
  const hypotheses = useQuery(api.hypotheses.listByBatch, { batchId }) as Hypothesis[] | undefined;
  const variants = useQuery(api.variants.listByBatch, { batchId }) as Variant[] | undefined;
  const metrics = useQuery(api.metrics.liveMetrics, { batchId }) as Metric[] | undefined;
  const status = useQuery(api.experiments.getStatus, { batchId });
  const reasoning = useQuery(api.agents.reasoningByBatch, { batchId });
  const allocations = useQuery(api.simulator.allocationsByBatch, { batchId });
  const startNextBatch = useMutation(api.experiments.startNextBatch);
  const [launchingNext, setLaunchingNext] = useState(false);

  const strategistText = reasoning?.find((r) => r.agent === "strategist")?.content;
  const analystText = reasoning?.find((r) => r.agent === "analyst")?.content;
  const analystData = reasoning?.find((r) => r.agent === "analyst")?.data;

  const phase = status?.phase ?? (status?.status === "complete" ? "complete" : undefined);
  const phaseLabel = phase ? PHASE_LABELS[phase] ?? phase : undefined;
  const isFailed = status?.status === "failed";
  const isComplete = phase === "complete";
  const productId = variants?.[0]?.productId;

  const weeks = useQuery(
    api.experiments.weeksByProduct,
    productId ? { productId } : "skip",
  );

  const parsedAnalyst: AnalystData | null = (() => {
    if (!analystData) return null;
    try {
      return JSON.parse(analystData) as AnalystData;
    } catch {
      return null;
    }
  })();
  const thisWeek = weeks?.find((w) => w.batchId === batchId) ?? null;
  const weekNumber = thisWeek?.week ?? 1;
  const prevWeek = thisWeek ? weeks?.find((w) => w.week === thisWeek.week - 1) ?? null : null;
  const isLastWeek = weekNumber >= 3;
  const metricsStarted = (metrics?.length ?? 0) > 0;

  async function handleNextBatch() {
    if (!productId || launchingNext) return;
    setLaunchingNext(true);
    try {
      const newBatchId = await startNextBatch({ productId, priorBatchId: batchId });
      router.push(`/launch/${newBatchId}`);
    } finally {
      setLaunchingNext(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header — bento card */}
      <div className="p-4 lg:p-6 pb-0">
        <header className="bg-card rounded-bento shadow-bento px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
                Hook<span className="text-primary">Loop</span>
              </h1>
              <span className="text-[13px] text-foreground/40 font-medium">
                Batch {batchId}
              </span>
            </div>
            {status === undefined || status === null ? (
              <span className="text-[13px] text-foreground/30">Loading...</span>
            ) : (
              <div className="flex items-center gap-3">
                {status.status === "running" && status.progress != null && (
                  <div className="w-24 h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((status.progress as number) * 100)}%` }}
                    />
                  </div>
                )}
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-semibold ${
                    isFailed
                      ? "bg-red-500/10 text-red-500"
                      : status.status === "running"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-foreground/5 text-foreground/50"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isFailed
                        ? "bg-red-500"
                        : status.status === "running"
                          ? "bg-green-500 animate-pulse"
                          : "bg-foreground/30"
                    }`}
                  />
                  {phaseLabel ?? (status.status === "running" ? "Running" : "Complete")}
                </span>
                {isComplete && productId && !isLastWeek && (
                  <button
                    onClick={handleNextBatch}
                    disabled={launchingNext}
                    className="rounded-full bg-primary text-white px-4 py-1.5 text-[12px] font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                  >
                    {launchingNext ? "Starting..." : "Run Next Week ▸"}
                  </button>
                )}
                {isComplete && isLastWeek && (
                  <span className="rounded-full bg-green-500/10 text-green-600 px-4 py-1.5 text-[12px] font-semibold">
                    Campaign complete · 3 weeks
                  </span>
                )}
              </div>
            )}
          </div>
        </header>
      </div>

      {/* Error banner */}
      {isFailed && status?.error && (
        <div className="mx-4 lg:mx-6 mt-4">
          <div className="bg-red-50 rounded-bento p-5 flex items-start gap-3">
            <span className="text-red-500 text-lg flex-shrink-0">!</span>
            <div>
              <p className="text-[13px] font-semibold text-red-600">Experiment failed</p>
              <p className="text-[12px] text-red-500/70 mt-1">{status.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content — timeline + sidebar */}
      <div className="grid grid-cols-12 gap-4 lg:gap-5 p-4 lg:p-6">
        {/* Timeline — the main story */}
        <main className="col-span-12 lg:col-span-8 space-y-5">
          {/* Strategist reasoning — appears first */}
          {strategistText && (
            <BentoCard title="Strategist Hypothesis">
              <AgentReasoningPanel title="Strategist" text={strategistText} />
            </BentoCard>
          )}

          {/* This week's hypothesis — shown report-style every week */}
          {hypotheses !== undefined && hypotheses.length > 0 && (
            <BentoCard title={`Week ${weekNumber} — Hypothesis`} accent>
              <p className="text-[13px] text-foreground/50 mb-4">
                What we believe will lower CAC this week — judged in the Week {weekNumber} report below.
              </p>
              <HypothesisList hypotheses={hypotheses} />
            </BentoCard>
          )}

          {/* Campaign Timeline — the core iterative view */}
          {variants !== undefined && metrics !== undefined ? (
            <BentoCard title="Campaign Timeline" accent>
              <CampaignTimeline
                variants={variants}
                metrics={metrics}
                allocations={allocations as Array<{ day: number; variantId: string; share: number; dailyBudget: number; status: "scale" | "explore" | "kill" }>}
                analystText={analystText}
              />
            </BentoCard>
          ) : (
            <BentoCard title="Campaign Timeline" accent>
              <div className="flex flex-col items-center py-12 text-foreground/30">
                <div className="w-12 h-12 rounded-full bg-background animate-pulse mb-4" />
                <p className="text-[13px] font-medium">Generating reels...</p>
                <p className="text-[11px] mt-1">Variants will appear here one by one</p>
              </div>
            </BentoCard>
          )}
        </main>

        {/* Sidebar — analytics panels */}
        <aside className="col-span-12 lg:col-span-4 space-y-4 lg:space-y-5">
          {/* Cross-week CPC trend — visibly drops week to week */}
          {weeks && weeks.length > 0 && (
            <BentoCard title="CPC by Week">
              <div className="flex items-end gap-3 h-28">
                {weeks.map((w) => {
                  const maxCpc = Math.max(...weeks.map((x) => x.avgCpc), 0.01);
                  const height = w.avgCpc > 0 ? (w.avgCpc / maxCpc) * 100 : 4;
                  return (
                    <div key={w.batchId} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-bold text-foreground">
                        {w.avgCpc > 0 ? `$${w.avgCpc.toFixed(2)}` : "—"}
                      </span>
                      <div
                        className={`w-full rounded-t-[8px] transition-all duration-500 ${
                          w.batchId === batchId ? "bg-primary" : "bg-primary/30"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-foreground/40 font-semibold">Wk {w.week}</span>
                    </div>
                  );
                })}
              </div>
            </BentoCard>
          )}

          <BentoCard title="Budget Reallocation">
            {variants === undefined || metrics === undefined || !metricsStarted ? (
              <Skeleton lines={3} />
            ) : (
              <BudgetAllocator variants={variants} metrics={metrics} banditAllocations={allocations} />
            )}
          </BentoCard>

          <BentoCard title="Creative DNA Heatmap">
            {variants === undefined || metrics === undefined || !metricsStarted ? (
              <Skeleton lines={4} />
            ) : (
              <DNAHeatmap variants={variants} metrics={metrics} analystData={analystData} />
            )}
          </BentoCard>

          <BentoCard title="Performance Trends">
            {metrics === undefined || variants === undefined || !metricsStarted ? (
              <Skeleton lines={5} />
            ) : (
              <MetricsChart metrics={metrics} variants={variants} />
            )}
          </BentoCard>

          {/* Analyst reasoning — appears at the end */}
          <BentoCard title="Analyst Agent">
            {analystText ? (
              <AgentReasoningPanel title="Analyst" text={analystText} />
            ) : (
              <p className="text-[12px] text-foreground/30 italic">Waiting for campaign to complete...</p>
            )}
          </BentoCard>

          {isComplete && parsedAnalyst && (
            <WeeklyReport
              week={weekNumber}
              hypotheses={hypotheses ?? []}
              analystData={parsedAnalyst}
              avgCpc={thisWeek?.avgCpc ?? 0}
              avgCac={thisWeek?.avgCac ?? 0}
              prevCpc={prevWeek?.avgCpc ?? null}
              prevCac={prevWeek?.avgCac ?? null}
              variants={variants ?? []}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function BentoCard({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-bento shadow-bento p-6">
      <h2 className={`text-[12px] font-semibold uppercase tracking-widest mb-5 ${
        accent ? "text-primary" : "text-foreground/35"
      }`}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Skeleton({ lines }: { lines: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-[10px] bg-background h-4"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}
