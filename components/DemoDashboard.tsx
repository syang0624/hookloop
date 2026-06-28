"use client";

import { useState } from "react";
import type { DemoWeek, DemoReel } from "@/lib/demoReels";
import ReelPreview from "./ReelPreview";

type Overall = {
  totalWeeks: number;
  totalReelsTested: number;
  startingCpc: number;
  finalCpc: number;
  cpcReduction: string;
  startingCac: number;
  finalCac: number;
  cacReduction: string;
  totalSpend: number;
  totalConversions: number;
  winningFormula: string;
  winningReel: string;
};

type Phase =
  | { type: "overview" }
  | { type: "week"; weekIndex: number; reelsRevealed: number; showData: boolean; showInsight: boolean };

export default function DemoDashboard({
  weeks,
  overall,
}: {
  weeks: DemoWeek[];
  overall: Overall;
}) {
  const [phase, setPhase] = useState<Phase>({ type: "overview" });
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);

  function startWeek(weekIndex: number) {
    setPhase({ type: "week", weekIndex, reelsRevealed: 0, showData: false, showInsight: false });
  }

  function advance() {
    if (phase.type !== "week") return;
    const week = weeks[phase.weekIndex];

    if (phase.reelsRevealed < week.reels.length) {
      // Reveal next reel
      setPhase({ ...phase, reelsRevealed: phase.reelsRevealed + 1 });
    } else if (!phase.showData) {
      // Show data reaction
      setPhase({ ...phase, showData: true });
    } else if (!phase.showInsight) {
      // Show insight + mark complete
      setPhase({ ...phase, showInsight: true });
      if (!completedWeeks.includes(phase.weekIndex)) {
        setCompletedWeeks([...completedWeeks, phase.weekIndex]);
      }
    } else if (phase.weekIndex < weeks.length - 1) {
      // Next week
      startWeek(phase.weekIndex + 1);
    } else {
      // Back to overview
      setPhase({ type: "overview" });
    }
  }

  const buttonLabel = (() => {
    if (phase.type === "overview") return null;
    const week = weeks[phase.weekIndex];
    if (phase.reelsRevealed < week.reels.length) return `Show Reel ${phase.reelsRevealed + 1}`;
    if (!phase.showData) return "Run Experiment (3-5 days)";
    if (!phase.showInsight) return "Show Analysis";
    if (phase.weekIndex < weeks.length - 1) return `Start Week ${phase.weekIndex + 2}`;
    return "View Results";
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 lg:p-6 pb-0">
        <header className="bg-card rounded-bento shadow-bento px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
                Hook<span className="text-primary">Loop</span>
              </h1>
              <span className="text-[13px] text-foreground/40 font-medium">Coca-Cola Campaign</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Week tabs */}
              <button
                onClick={() => setPhase({ type: "overview" })}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  phase.type === "overview" ? "bg-primary text-white" : "bg-background text-foreground/40 hover:text-foreground/60"
                }`}
              >
                Overview
              </button>
              {weeks.map((w, i) => (
                <button
                  key={w.week}
                  onClick={() => startWeek(i)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    phase.type === "week" && phase.weekIndex === i
                      ? "bg-primary text-white"
                      : completedWeeks.includes(i)
                        ? "bg-green-500/10 text-green-600"
                        : "bg-background text-foreground/40 hover:text-foreground/60"
                  }`}
                >
                  Week {w.week}
                  {completedWeeks.includes(i) && " ✓"}
                </button>
              ))}
            </div>
          </div>
        </header>
      </div>

      <div className="p-4 lg:p-6">
        {phase.type === "overview" ? (
          <OverviewView weeks={weeks} overall={overall} completedWeeks={completedWeeks} onStartWeek={() => startWeek(0)} />
        ) : (
          <WeekView
            week={weeks[phase.weekIndex]}
            reelsRevealed={phase.reelsRevealed}
            showData={phase.showData}
            showInsight={phase.showInsight}
            prevWeek={phase.weekIndex > 0 ? weeks[phase.weekIndex - 1] : undefined}
          />
        )}
      </div>

      {/* Advance button — fixed bottom */}
      {buttonLabel && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-xl mx-auto">
            <button
              onClick={advance}
              className="w-full rounded-[16px] bg-primary text-white py-4 text-[15px] font-semibold hover:bg-primary/90 transition-all shadow-bento active:scale-[0.98]"
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewView({
  weeks,
  overall,
  completedWeeks,
  onStartWeek,
}: {
  weeks: DemoWeek[];
  overall: Overall;
  completedWeeks: number[];
  onStartWeek: () => void;
}) {
  const allDone = completedWeeks.length === weeks.length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Hero stats */}
      <div className="bg-card rounded-bento shadow-bento p-8">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6">
          {allDone ? "Campaign Results" : "Coca-Cola Ad Experiment"}
        </h2>
        {allDone ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <BigStat label="Starting CPC" value={`$${overall.startingCpc}`} />
            <BigStat label="Final CPC" value={`$${overall.finalCpc}`} accent />
            <BigStat label="CPC Reduction" value={overall.cpcReduction} accent />
            <BigStat label="Reels Tested" value={`${overall.totalReelsTested}`} />
            <BigStat label="Starting CAC" value={`$${overall.startingCac}`} />
            <BigStat label="Final CAC" value={`$${overall.finalCac}`} accent />
            <BigStat label="Total Spend" value={`$${overall.totalSpend.toLocaleString()}`} />
            <BigStat label="Conversions" value={overall.totalConversions.toLocaleString()} />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[15px] text-foreground/60 mb-6">
              Watch HookLoop iterate through 3 weeks of ad creative testing,
              finding the lowest CPC automatically.
            </p>
            <button
              onClick={onStartWeek}
              className="rounded-[14px] bg-primary text-white px-8 py-3.5 text-[15px] font-semibold hover:bg-primary/90 transition-all shadow-bento"
            >
              Start Week 1
            </button>
          </div>
        )}
      </div>

      {/* Week-by-week CPC progression */}
      {allDone && (
        <>
          <div className="bg-card rounded-bento shadow-bento p-6">
            <h3 className="text-[12px] font-semibold uppercase tracking-widest text-primary mb-5">CPC Over Time</h3>
            <div className="flex items-end gap-4 h-40">
              {weeks.map((w) => {
                const maxCpc = Math.max(...weeks.map((wk) => wk.metrics.avgCpc));
                const height = (w.metrics.avgCpc / maxCpc) * 100;
                return (
                  <div key={w.week} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[13px] font-bold text-foreground">${w.metrics.avgCpc.toFixed(2)}</span>
                    <div
                      className={`w-full rounded-t-[12px] transition-all duration-700 ${
                        w.week === weeks.length ? "bg-green-500" : "bg-primary/30"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[11px] text-foreground/40 font-medium">Week {w.week}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-bento shadow-bento p-6">
            <h3 className="text-[12px] font-semibold uppercase tracking-widest text-foreground/35 mb-4">Winning Formula</h3>
            <p className="text-[15px] font-semibold text-foreground">{overall.winningFormula}</p>
            <p className="text-[13px] text-foreground/50 mt-2">Best reel: {overall.winningReel}</p>
          </div>
        </>
      )}

      {/* Week cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {weeks.map((w, i) => (
          <div
            key={w.week}
            className={`bg-card rounded-bento shadow-bento p-5 cursor-pointer hover:shadow-lg transition-all ${
              completedWeeks.includes(i) ? "ring-2 ring-green-400/30" : ""
            }`}
            onClick={() => {
              if (completedWeeks.includes(i)) {
                // Re-view completed week fully revealed
              }
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-bold uppercase tracking-wider text-foreground/35">Week {w.week}</span>
              {completedWeeks.includes(i) && (
                <span className="text-[10px] font-semibold text-green-600 bg-green-500/10 rounded-full px-2 py-0.5">Done</span>
              )}
            </div>
            <p className="text-[14px] font-semibold text-foreground mb-2">{w.label.split(" — ")[1]}</p>
            <p className="text-[12px] text-foreground/40 line-clamp-2">{w.hypothesis}</p>
            {completedWeeks.includes(i) && (
              <div className="flex gap-4 mt-3 pt-3 border-t border-background">
                <SmallStat label="CPC" value={`$${w.metrics.avgCpc.toFixed(2)}`} />
                <SmallStat label="CAC" value={`$${w.metrics.avgCac.toFixed(2)}`} />
                <SmallStat label="Reels" value={`${w.reels.length}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({
  week,
  reelsRevealed,
  showData,
  showInsight,
  prevWeek,
}: {
  week: DemoWeek;
  reelsRevealed: number;
  showData: boolean;
  showInsight: boolean;
  prevWeek?: DemoWeek;
}) {
  const cpcDelta = prevWeek
    ? ((week.metrics.avgCpc - prevWeek.metrics.avgCpc) / prevWeek.metrics.avgCpc * 100)
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-24">
      {/* Week header */}
      <div className="bg-card rounded-bento shadow-bento p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-[14px] font-bold">
            {week.week}
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">{week.label}</h2>
            <p className="text-[12px] text-foreground/40">{week.reels.length} new reels to test</p>
          </div>
        </div>
        <div className="bg-background rounded-[14px] p-4 text-[13px] text-foreground/60 leading-relaxed">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary/60 block mb-1">Hypothesis</span>
          {week.hypothesis}
        </div>
      </div>

      {/* Reels — revealed one by one */}
      {reelsRevealed > 0 && (
        <div className="bg-card rounded-bento shadow-bento p-6">
          <h3 className="text-[12px] font-semibold uppercase tracking-widest text-foreground/35 mb-4">
            Generated Reels ({reelsRevealed}/{week.reels.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {week.reels.slice(0, reelsRevealed).map((reel, i) => (
              <ReelCard key={reel.id} reel={reel} index={i} showMetrics={showData} />
            ))}
          </div>
        </div>
      )}

      {/* Data reaction — after all reels shown */}
      {showData && (
        <div className="animate-fadeIn">
          <div className="bg-card rounded-bento shadow-bento p-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-[12px] font-semibold uppercase tracking-widest text-foreground/35">
                Experiment Results (3-5 days)
              </h3>
              {cpcDelta !== null && (
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  cpcDelta < 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
                }`}>
                  CPC {cpcDelta > 0 ? "+" : ""}{cpcDelta.toFixed(0)}% vs last week
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MedStat label="Avg CPC" value={`$${week.metrics.avgCpc.toFixed(2)}`} good={week.metrics.avgCpc < 0.80} />
              <MedStat label="Avg CAC" value={`$${week.metrics.avgCac.toFixed(2)}`} good={week.metrics.avgCac < 3.0} />
              <MedStat label="Spend" value={`$${week.metrics.totalSpend.toLocaleString()}`} />
              <MedStat label="Conversions" value={week.metrics.totalConversions.toLocaleString()} />
              <MedStat label="Active Reels" value={`${week.metrics.reelsActive}/${week.metrics.reelsTotal}`} />
            </div>
          </div>
        </div>
      )}

      {/* Insight */}
      {showInsight && (
        <div className="animate-fadeIn">
          <div className="bg-primary/5 rounded-bento shadow-bento p-6">
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-primary/60 mb-3">
              {week.week === 3 ? "Final Conclusion" : "Analysis & Next Steps"}
            </h3>
            <p className="text-[14px] text-foreground/70 leading-relaxed">{week.insight}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ReelCard({ reel, index, showMetrics }: { reel: DemoReel; index: number; showMetrics: boolean }) {
  const [videoError, setVideoError] = useState(false);
  const hasVideo = reel.videoPath && !videoError;

  return (
    <div
      className={`rounded-[20px] bg-background p-4 animate-fadeIn ${
        reel.status === "killed" ? "opacity-50" : reel.status === "winning" ? "ring-2 ring-green-400/30" : ""
      }`}
      style={{ animationDelay: `${index * 200}ms`, animationFillMode: "backwards" }}
    >
      {/* Reel video or preview */}
      {hasVideo ? (
        <video
          src={reel.videoPath!}
          className="w-full rounded-[14px] mb-3 aspect-[9/16] object-cover bg-foreground/5"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoError(true)}
        />
      ) : (
        <ReelPreview
          hookType={reel.hookType}
          voice={reel.voice}
          script={reel.script}
          pacing={reel.pacing}
          status={reel.status}
        />
      )}

      {/* Labels */}
      <div className="flex items-center justify-between mb-2">
        <span className="rounded-full bg-foreground text-card px-2.5 py-0.5 text-[10px] font-bold">
          {reel.hookType}
        </span>
        <span className={`text-[10px] font-bold ${
          reel.status === "winning" ? "text-green-600" : reel.status === "killed" ? "text-red-400" : "text-foreground/40"
        }`}>
          {reel.status === "winning" ? "WINNER" : reel.status === "killed" ? "KILLED" : "RUNNING"}
        </span>
      </div>

      <p className="text-[11px] text-foreground/50 mb-1">{reel.voice} voice · {reel.pacing}</p>

      {/* Metrics — only shown after data phase */}
      {showMetrics && (
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-foreground/5 text-[11px]">
          <div>
            <span className="text-foreground/30 text-[9px] uppercase font-semibold">CPC</span>
            <p className="font-bold text-foreground">${reel.cpc.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-foreground/30 text-[9px] uppercase font-semibold">CAC</span>
            <p className={`font-bold ${reel.cac < 3 ? "text-green-600" : "text-foreground"}`}>${reel.cac.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function BigStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-foreground/30">{label}</span>
      <span className={`text-2xl font-bold ${accent ? "text-green-600" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function MedStat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="bg-background rounded-[12px] p-3">
      <span className="block text-[9px] font-semibold uppercase tracking-wide text-foreground/30">{label}</span>
      <span className={`text-[16px] font-bold ${good ? "text-green-600" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[9px] font-semibold uppercase tracking-wide text-foreground/30">{label}</span>
      <span className="text-[13px] font-bold text-foreground">{value}</span>
    </div>
  );
}
