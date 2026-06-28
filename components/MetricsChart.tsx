import type { Metric, Variant } from "@/lib/types";

// TODO(steven): implement Recharts line chart — see STEVEN.md Task 6
export default function MetricsChart({
  metrics,
  variants,
}: {
  metrics: Metric[];
  variants: Variant[];
}) {
  const days = Array.from(new Set(metrics.map((m) => m.day))).sort();

  return (
    <div className="text-xs text-gray-500">
      <p className="mb-2">
        {metrics.length} data points across {days.length} days for{" "}
        {variants.length} variants
      </p>
      <p className="text-gray-400 italic">Recharts visualization coming in Task 6</p>
    </div>
  );
}
