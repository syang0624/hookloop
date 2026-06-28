import type { Variant, Metric } from "@/lib/types";

// TODO(steven): implement animated stacked bar — see STEVEN.md Task 9
export default function BudgetAllocator({
  variants,
  metrics,
}: {
  variants: Variant[];
  metrics: Metric[];
}) {
  // metrics will be used in Task 9 for live reallocation
  const latestDay = metrics.length > 0 ? Math.max(...metrics.map((m) => m.day)) : 0;
  const totalBudget = variants.reduce((sum, v) => sum + v.budget, 0);

  return (
    <div className="text-xs text-gray-500">
      <p className="mb-2">
        ${totalBudget} across {variants.length} variants (day {latestDay})
      </p>
      <div className="flex h-4 rounded overflow-hidden">
        {variants.map((v) => (
          <div
            key={v._id}
            className="bg-gray-300 border-r border-white last:border-0 transition-all duration-500"
            style={{ width: `${(v.budget / totalBudget) * 100}%` }}
            title={`${v.hookType}: $${v.budget}`}
          />
        ))}
      </div>
      <p className="text-gray-400 italic mt-2">Animated bar coming in Task 9</p>
    </div>
  );
}
