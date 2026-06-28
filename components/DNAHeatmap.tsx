"use client";

import { useMemo, useState } from "react";
import type { Variant, Metric } from "@/lib/types";

type CellData = {
  avgCac: number;
  count: number;
  totalSpend: number;
  totalConversions: number;
};

export default function DNAHeatmap({
  variants,
  metrics,
}: {
  variants: Variant[];
  metrics: Metric[];
}) {
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);

  const hookTypes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.hookType))),
    [variants],
  );
  const voiceTypes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.voice))),
    [variants],
  );

  // Build a lookup: variantId -> { hookType, voice }
  const variantDna = useMemo(() => {
    const m = new Map<string, { hookType: string; voice: string }>();
    for (const v of variants) m.set(v._id as string, { hookType: v.hookType, voice: v.voice });
    return m;
  }, [variants]);

  // Aggregate metrics by (hookType, voice) -> avg CAC
  const grid = useMemo(() => {
    const cells = new Map<string, { totalCac: number; count: number; spend: number; conversions: number }>();

    for (const m of metrics) {
      if (m.impressions === 0) continue;
      const dna = variantDna.get(m.variantId as string);
      if (!dna) continue;
      const key = `${dna.hookType}::${dna.voice}`;
      const cell = cells.get(key) ?? { totalCac: 0, count: 0, spend: 0, conversions: 0 };
      cell.totalCac += m.cac;
      cell.count += 1;
      cell.spend += m.spend;
      cell.conversions += m.conversions;
      cells.set(key, cell);
    }

    const result = new Map<string, CellData>();
    cells.forEach((cell, key) => {
      result.set(key, {
        avgCac: cell.count > 0 ? cell.totalCac / cell.count : 0,
        count: cell.count,
        totalSpend: cell.spend,
        totalConversions: cell.conversions,
      });
    });
    return result;
  }, [metrics, variantDna]);

  // Find CAC range for color scaling
  const allCacs = Array.from(grid.values()).map((c) => c.avgCac).filter((c) => c > 0);
  const minCac = allCacs.length > 0 ? Math.min(...allCacs) : 0;
  const maxCac = allCacs.length > 0 ? Math.max(...allCacs) : 100;

  function cacToColor(cac: number): string {
    if (cac === 0) return "#f3f4f6"; // empty cell
    const t = maxCac > minCac ? (cac - minCac) / (maxCac - minCac) : 0;
    // Green (low CAC) -> Yellow -> Red (high CAC)
    const r = Math.round(t < 0.5 ? t * 2 * 220 : 220);
    const g = Math.round(t < 0.5 ? 180 : 180 - (t - 0.5) * 2 * 140);
    const b = Math.round(40);
    return `rgb(${r}, ${g}, ${b})`;
  }

  const cellW = 90;
  const cellH = 52;
  const labelW = 80;
  const labelH = 24;
  const svgW = labelW + voiceTypes.length * cellW;
  const svgH = labelH + hookTypes.length * cellH;

  const hoveredCell =
    hovered !== null
      ? grid.get(`${hookTypes[hovered.row]}::${voiceTypes[hovered.col]}`)
      : null;

  return (
    <div>
      <div className="overflow-x-auto">
        <svg width={svgW} height={svgH} className="text-xs">
          {/* Column headers (voices) */}
          {voiceTypes.map((v, ci) => (
            <text
              key={v}
              x={labelW + ci * cellW + cellW / 2}
              y={16}
              textAnchor="middle"
              className="fill-gray-500 text-[11px] font-medium"
            >
              {v}
            </text>
          ))}

          {/* Rows */}
          {hookTypes.map((hook, ri) => (
            <g key={hook}>
              {/* Row label */}
              <text
                x={labelW - 8}
                y={labelH + ri * cellH + cellH / 2 + 4}
                textAnchor="end"
                className="fill-gray-500 text-[11px] font-medium"
              >
                {hook}
              </text>

              {/* Cells */}
              {voiceTypes.map((voice, ci) => {
                const cell = grid.get(`${hook}::${voice}`);
                const cac = cell?.avgCac ?? 0;
                const isHovered = hovered?.row === ri && hovered?.col === ci;

                return (
                  <g
                    key={voice}
                    onMouseEnter={() => setHovered({ row: ri, col: ci })}
                    onMouseLeave={() => setHovered(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={labelW + ci * cellW + 2}
                      y={labelH + ri * cellH + 2}
                      width={cellW - 4}
                      height={cellH - 4}
                      rx={6}
                      fill={cacToColor(cac)}
                      stroke={isHovered ? "#111" : "transparent"}
                      strokeWidth={isHovered ? 2 : 0}
                      className="transition-all duration-200"
                    />
                    {cac > 0 && (
                      <text
                        x={labelW + ci * cellW + cellW / 2}
                        y={labelH + ri * cellH + cellH / 2 + 4}
                        textAnchor="middle"
                        className="fill-gray-800 text-[11px] font-semibold pointer-events-none"
                      >
                        ${cac.toFixed(0)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      {/* Hover tooltip */}
      {hovered !== null && hoveredCell && (
        <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-md p-2">
          <span className="font-medium">{hookTypes[hovered.row]}</span>
          {" x "}
          <span className="font-medium">{voiceTypes[hovered.col]}</span>
          {" — "}
          Avg CAC: <span className="font-semibold">${hoveredCell.avgCac.toFixed(2)}</span>
          {" | "}
          {hoveredCell.count} data points
          {" | "}
          ${hoveredCell.totalSpend.toFixed(0)} spend
          {" | "}
          {hoveredCell.totalConversions} conversions
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
        <span>Low CAC</span>
        <div className="flex h-2 w-24 rounded overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: cacToColor(minCac + ((maxCac - minCac) * i) / 9) }}
            />
          ))}
        </div>
        <span>High CAC</span>
      </div>
    </div>
  );
}
