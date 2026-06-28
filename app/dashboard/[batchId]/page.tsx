"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  MOCK_HYPOTHESES,
  MOCK_VARIANTS,
  MOCK_METRICS,
  MOCK_EXPERIMENT,
  MOCK_AGENT_REASONING,
} from "@/lib/mockData";
import type { Hypothesis, Variant, Metric } from "@/lib/types";
import HypothesisList from "@/components/HypothesisList";
import VariantCard from "@/components/VariantCard";
import MetricsChart from "@/components/MetricsChart";
import AgentReasoningPanel from "@/components/AgentReasoningPanel";
import DNAHeatmap from "@/components/DNAHeatmap";
import BudgetAllocator from "@/components/BudgetAllocator";

export default function DashboardPage({
  params,
}: {
  params: { batchId: string };
}) {
  const { batchId } = params;

  // Convex queries — fall back to mocks while backend isn't ready
  const liveHypotheses = useQuery(api.hypotheses.listByBatch, { batchId });
  const liveVariants = useQuery(api.variants.listByBatch, { batchId });
  const liveMetrics = useQuery(api.metrics.liveMetrics, { batchId });
  const liveStatus = useQuery(api.experiments.getStatus, { batchId });

  // Use live data if non-empty, otherwise fall back to mocks
  const hypotheses: Hypothesis[] | undefined =
    liveHypotheses === undefined
      ? undefined
      : liveHypotheses.length > 0
        ? (liveHypotheses as Hypothesis[])
        : MOCK_HYPOTHESES;

  const variants: Variant[] | undefined =
    liveVariants === undefined
      ? undefined
      : liveVariants.length > 0
        ? (liveVariants as Variant[])
        : MOCK_VARIANTS;

  const metrics: Metric[] | undefined =
    liveMetrics === undefined
      ? undefined
      : liveMetrics.length > 0
        ? (liveMetrics as Metric[])
        : MOCK_METRICS;

  const status = liveStatus === undefined
    ? undefined
    : liveStatus ?? { status: MOCK_EXPERIMENT.status, progress: 100 };

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
            {status === undefined ? (
              <span className="text-[13px] text-foreground/30">Loading...</span>
            ) : (
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
                {status.status === "running" ? "Running" : "Complete"}
              </span>
            )}
          </div>
        </header>
      </div>

      {/* Bento grid dashboard */}
      <div className="grid grid-cols-12 gap-4 lg:gap-5 p-4 lg:p-6">
        {/* Left rail — hypotheses + budget */}
        <aside className="col-span-12 lg:col-span-3 space-y-4 lg:space-y-5">
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
        <main className="col-span-12 lg:col-span-6 space-y-4 lg:space-y-5">
          <BentoCard title="Creative DNA Heatmap" accent>
            {variants === undefined || metrics === undefined ? (
              <Skeleton lines={4} />
            ) : (
              <DNAHeatmap variants={variants} metrics={metrics} />
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
        <aside className="col-span-12 lg:col-span-3 space-y-4 lg:space-y-5">
          <BentoCard title="Strategist Agent">
            <AgentReasoningPanel
              title="Strategist"
              text={MOCK_AGENT_REASONING.strategist}
            />
          </BentoCard>

          <BentoCard title="Analyst Agent">
            <AgentReasoningPanel
              title="Analyst"
              text={MOCK_AGENT_REASONING.analyst}
            />
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
