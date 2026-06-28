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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">HookLoop</h1>
            <p className="text-sm text-gray-500">Batch {batchId}</p>
          </div>
          {status === undefined ? (
            <span className="text-sm text-gray-400">Loading...</span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                status.status === "running"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status.status === "running" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              {status.status === "running" ? "Running" : "Complete"}
            </span>
          )}
        </div>
      </header>

      {/* 3-column grid */}
      <div className="grid grid-cols-12 gap-4 p-4 lg:p-6">
        {/* Left rail — hypotheses */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <Section title="Hypotheses">
            {hypotheses === undefined ? (
              <Skeleton lines={4} />
            ) : (
              <HypothesisList hypotheses={hypotheses} />
            )}
          </Section>

          <Section title="Budget Allocation">
            {variants === undefined || metrics === undefined ? (
              <Skeleton lines={3} />
            ) : (
              <BudgetAllocator variants={variants} metrics={metrics} />
            )}
          </Section>
        </aside>

        {/* Main column — variants + chart */}
        <main className="col-span-12 lg:col-span-6 space-y-4">
          <Section title="DNA Heatmap">
            {variants === undefined || metrics === undefined ? (
              <Skeleton lines={4} />
            ) : (
              <DNAHeatmap variants={variants} metrics={metrics} />
            )}
          </Section>

          <Section title="Metrics">
            {metrics === undefined || variants === undefined ? (
              <Skeleton lines={5} />
            ) : (
              <MetricsChart metrics={metrics} variants={variants} />
            )}
          </Section>

          <Section title="Ad Variants">
            {variants === undefined || metrics === undefined ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-lg bg-gray-200 h-48" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
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
          </Section>
        </main>

        {/* Right rail — agent reasoning */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <Section title="Strategist">
            <AgentReasoningPanel
              title="Strategist"
              text={MOCK_AGENT_REASONING.strategist}
            />
          </Section>

          <Section title="Analyst">
            <AgentReasoningPanel
              title="Analyst"
              text={MOCK_AGENT_REASONING.analyst}
            />
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Skeleton({ lines }: { lines: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded bg-gray-200 h-4"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}
