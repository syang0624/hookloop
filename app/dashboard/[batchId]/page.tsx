"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Hypothesis, Variant, Metric } from "@/lib/types";
import HypothesisList from "@/components/HypothesisList";
import VariantCard from "@/components/VariantCard";
import MetricsChart from "@/components/MetricsChart";
import AgentReasoningPanel from "@/components/AgentReasoningPanel";
import DNAHeatmap from "@/components/DNAHeatmap";
import BudgetAllocator from "@/components/BudgetAllocator";

const PHASE_LABELS: Record<string, string> = {
  strategizing: "Strategizing...",
  generating: "Generating variants...",
  simulating: "Simulating campaign...",
  analyzing: "Analyzing results...",
  complete: "Complete",
};

export default function DashboardPage({
  params,
}: {
  params: { batchId: string };
}) {
  const { batchId } = params;

  const hypotheses = useQuery(api.hypotheses.listByBatch, { batchId }) as Hypothesis[] | undefined;
  const variants = useQuery(api.variants.listByBatch, { batchId }) as Variant[] | undefined;
  const metrics = useQuery(api.metrics.liveMetrics, { batchId }) as Metric[] | undefined;
  const status = useQuery(api.experiments.getStatus, { batchId });
  const reasoning = useQuery(api.agents.reasoningByBatch, { batchId });

  const strategistText = reasoning?.find((r) => r.agent === "strategist")?.content;
  const analystText = reasoning?.find((r) => r.agent === "analyst")?.content;
  const analystData = reasoning?.find((r) => r.agent === "analyst")?.data;

  const phase = status?.phase ?? (status?.status === "complete" ? "complete" : undefined);
  const phaseLabel = phase ? PHASE_LABELS[phase] ?? phase : undefined;

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
                    status.status === "running"
                      ? "bg-green-500/10 text-green-600"
                      : "bg-foreground/5 text-foreground/50"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      status.status === "running" ? "bg-green-500 animate-pulse" : "bg-foreground/30"
                    }`}
                  />
                  {phaseLabel ?? (status.status === "running" ? "Running" : "Complete")}
                </span>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* Bento grid dashboard */}
      <div className="grid grid-cols-12 gap-4 lg:gap-5 p-4 lg:p-6">
        {/* Left rail — hypotheses + budget */}
        <aside className="col-span-12 md:col-span-6 lg:col-span-3 space-y-4 lg:space-y-5">
          <BentoCard title="Hypotheses">
            {hypotheses === undefined ? (
              <Skeleton lines={4} />
            ) : (
              <HypothesisList hypotheses={hypotheses} />
            )}
          </BentoCard>

          <BentoCard title="Budget Allocation">
            {variants === undefined || metrics === undefined ? (
              <Skeleton lines={3} />
            ) : (
              <BudgetAllocator variants={variants} metrics={metrics} />
            )}
          </BentoCard>
        </aside>

        {/* Main column — heatmap + chart + variants */}
        <main className="col-span-12 md:col-span-6 lg:col-span-6 space-y-4 lg:space-y-5">
          <BentoCard title="Creative DNA Heatmap" accent>
            {variants === undefined || metrics === undefined ? (
              <Skeleton lines={4} />
            ) : (
              <DNAHeatmap variants={variants} metrics={metrics} analystData={analystData} />
            )}
          </BentoCard>

          <BentoCard title="Performance Metrics">
            {metrics === undefined || variants === undefined ? (
              <Skeleton lines={5} />
            ) : (
              <MetricsChart metrics={metrics} variants={variants} />
            )}
          </BentoCard>

          <BentoCard title="Ad Variants">
            {variants === undefined || metrics === undefined ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-[16px] bg-background h-52" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {variants.map((v) => {
                  const variantMetrics = metrics.filter(
                    (m) => m.variantId === v._id
                  );
                  return (
                    <VariantCard
                      key={v._id}
                      variant={v}
                      metrics={variantMetrics}
                    />
                  );
                })}
              </div>
            )}
          </BentoCard>
        </main>

        {/* Right rail — agent reasoning */}
        <aside className="col-span-12 md:col-span-12 lg:col-span-3 space-y-4 lg:space-y-5">
          <BentoCard title="Strategist Agent">
            {strategistText ? (
              <AgentReasoningPanel title="Strategist" text={strategistText} />
            ) : (
              <p className="text-[12px] text-foreground/30 italic">Waiting for strategist...</p>
            )}
          </BentoCard>

          <BentoCard title="Analyst Agent">
            {analystText ? (
              <AgentReasoningPanel title="Analyst" text={analystText} />
            ) : (
              <p className="text-[12px] text-foreground/30 italic">Waiting for analyst...</p>
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
