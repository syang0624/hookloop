import type { Variant, Metric } from "@/lib/types";

export default function VariantCard({
  variant,
  metrics,
}: {
  variant: Variant;
  metrics: Metric[];
}) {
  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const isDead = latest !== null && latest.impressions === 0;

  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        isDead ? "opacity-50 border-red-200 bg-red-50" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium">
          {variant.hookType}
        </span>
        {isDead ? (
          <span className="text-xs text-red-600 font-medium">Killed</span>
        ) : latest && latest.cac > 0 && latest.cac < 80 ? (
          <span className="text-xs text-green-600 font-medium">Winning</span>
        ) : (
          <span className="text-xs text-gray-400">Running</span>
        )}
      </div>

      <p className="text-gray-700 line-clamp-2 mb-2">{variant.script}</p>

      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
        <div>
          <span className="block text-gray-400">Voice</span>
          {variant.voice}
        </div>
        <div>
          <span className="block text-gray-400">Pacing</span>
          {variant.pacing}
        </div>
        <div>
          <span className="block text-gray-400">CTA</span>
          {variant.cta}
        </div>
      </div>

      {latest && latest.impressions > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t text-xs">
          <div>
            <span className="block text-gray-400">CPC</span>
            <span className="font-medium">${latest.cpc.toFixed(2)}</span>
          </div>
          <div>
            <span className="block text-gray-400">CAC</span>
            <span className="font-medium">${latest.cac.toFixed(2)}</span>
          </div>
          <div>
            <span className="block text-gray-400">CTR</span>
            <span className="font-medium">
              {(latest.ctr * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
