import type { Variant, Metric } from "@/lib/types";

function StatusBadge({ status }: { status: "winning" | "running" | "killed" }) {
  const styles = {
    winning: "bg-green-100 text-green-700",
    running: "bg-blue-100 text-blue-700",
    killed: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status === "running" && (
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DnaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-xs text-gray-700">{value}</span>
    </div>
  );
}

export default function VariantCard({
  variant,
  metrics,
}: {
  variant: Variant;
  metrics: Metric[];
}) {
  const sorted = metrics.slice().sort((a, b) => a.day - b.day);
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const isDead = latest !== null && latest.impressions === 0;
  const isWinning = latest !== null && !isDead && latest.cac > 0 && latest.cac < 80;
  const status = isDead ? "killed" as const : isWinning ? "winning" as const : "running" as const;

  return (
    <div
      className={`rounded-xl border p-4 text-sm transition-shadow hover:shadow-md ${
        isDead
          ? "opacity-60 border-red-200 bg-red-50/50"
          : isWinning
            ? "border-green-200 bg-green-50/30 ring-1 ring-green-200"
            : "border-gray-200 bg-white"
      }`}
    >
      {/* Header: hook type + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-gray-900 text-white px-2 py-0.5 text-xs font-medium">
            {variant.hookType}
          </span>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {variant.scriptType}
          </span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Script */}
      <p className="text-gray-700 text-xs leading-relaxed line-clamp-3 mb-3">
        {variant.script}
      </p>

      {/* Hypothesis */}
      <p className="text-[10px] text-gray-400 italic mb-3 line-clamp-1">
        Hypothesis: {variant.hypothesis}
      </p>

      {/* DNA grid */}
      <div className="grid grid-cols-5 gap-2 mb-3 pb-3 border-b border-gray-100">
        <DnaPill label="Voice" value={variant.voice} />
        <DnaPill label="Music" value={variant.music} />
        <DnaPill label="Pacing" value={variant.pacing} />
        <DnaPill label="CTA" value={variant.cta} />
        <DnaPill label="Budget" value={`$${variant.budget}`} />
      </div>

      {/* Live metrics */}
      {latest && latest.impressions > 0 ? (
        <div className="grid grid-cols-4 gap-2 text-xs mb-3">
          <MetricCell label="CPC" value={`$${latest.cpc.toFixed(2)}`} />
          <MetricCell
            label="CAC"
            value={`$${latest.cac.toFixed(2)}`}
            highlight={latest.cac < 80 ? "green" : latest.cac > 110 ? "red" : undefined}
          />
          <MetricCell label="CTR" value={`${(latest.ctr * 100).toFixed(1)}%`} />
          <MetricCell label="CVR" value={`${(latest.cvr * 100).toFixed(1)}%`} />
        </div>
      ) : isDead ? (
        <p className="text-xs text-red-400 mb-3">No impressions — variant killed</p>
      ) : null}

      {/* Kill/scale rules */}
      <div className="flex gap-3 text-[10px] text-gray-400">
        <span title={variant.killRule}>Kill: {variant.killRule}</span>
      </div>
      <div className="text-[10px] text-gray-400 mt-0.5">
        <span title={variant.scaleRule}>Scale: {variant.scaleRule}</span>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "green" | "red";
}) {
  const color =
    highlight === "green"
      ? "text-green-700 font-semibold"
      : highlight === "red"
        ? "text-red-600 font-semibold"
        : "text-gray-800 font-medium";
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}
