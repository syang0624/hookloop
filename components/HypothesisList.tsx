import type { Hypothesis } from "@/lib/types";

export default function HypothesisList({
  hypotheses,
}: {
  hypotheses: Hypothesis[];
}) {
  return (
    <ul className="space-y-3">
      {hypotheses.map((h, i) => (
        <li key={h._id} className="text-sm">
          <p className="font-medium">
            {i + 1}. {h.text}
          </p>
          <p className="text-gray-500 text-xs mt-1">{h.reasoning}</p>
        </li>
      ))}
    </ul>
  );
}
