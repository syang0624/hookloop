"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Hypothesis, Variant, Metric } from "@/lib/types";
import CampaignTimeline from "@/components/CampaignTimeline";
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
                {isComplete && productId && (
                  <button
                    onClick={handleNextBatch}
                    disabled={launchingNext}
                    className="rounded-full bg-primary text-white px-4 py-1.5 text-[12px] font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                  >
                    {launchingNext ? "Starting..." : "Run Next Batch"}
                  </button>
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

          {/* Hypotheses */}
          {hypotheses !== undefined && hypotheses.length > 0 && (
            <BentoCard title="Hypotheses Being Tested">
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
          <BentoCard title="Budget Reallocation">
            {variants === undefined || metrics === undefined ? (
              <Skeleton lines={3} />
            ) : (
              <BudgetAllocator variants={variants} metrics={metrics} banditAllocations={allocations} />
            )}
          </BentoCard>

          <BentoCard title="Creative DNA Heatmap">
            {variants === undefined || metrics === undefined ? (
              <Skeleton lines={4} />
            ) : (
              <DNAHeatmap variants={variants} metrics={metrics} analystData={analystData} />
            )}
          </BentoCard>

          <BentoCard title="Performance Trends">
            {metrics === undefined || variants === undefined ? (
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
