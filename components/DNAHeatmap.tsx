import type { Variant, Metric } from "@/lib/types";

// TODO(steven): implement SVG heatmap — see STEVEN.md Task 8
export default function DNAHeatmap({
  variants,
  metrics,
}: {
  variants: Variant[];
  metrics: Metric[];
}) {
  const hookTypes = Array.from(new Set(variants.map((v) => v.hookType)));
  const voiceTypes = Array.from(new Set(variants.map((v) => v.voice)));
  const metricCount = metrics.length;

  return (
    <div className="text-xs text-gray-500">
      <p className="mb-2">
        {hookTypes.length} hook types x {voiceTypes.length} voices ({metricCount} data points)
      </p>
      <p className="text-gray-400 italic">SVG heatmap coming in Task 8</p>
    </div>
  );
}
