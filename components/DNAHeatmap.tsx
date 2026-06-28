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
    if (cac === 0) return "#F2F2F7"; // empty cell — matches bg
    const t = maxCac > minCac ? (cac - minCac) / (maxCac - minCac) : 0;
    // Green (low CAC) -> Yellow -> Red (high CAC) — iOS-inspired palette
    if (t < 0.5) {
      const s = t * 2;
      return `rgb(${Math.round(52 + s * 203)}, ${Math.round(199 - s * 50)}, ${Math.round(89 - s * 39)})`;
    }
    const s = (t - 0.5) * 2;
    return `rgb(${Math.round(255 - s * 0)}, ${Math.round(149 - s * 90)}, ${Math.round(50 - s * 2)})`;
  }

  const hoveredCell =
    hovered !== null
      ? grid.get(`${hookTypes[hovered.row]}::${voiceTypes[hovered.col]}`)
      : null;

  // Grid columns: 1 label col + N voice cols
  const gridCols = `80px repeat(${voiceTypes.length}, 1fr)`;

  return (
    <div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: gridCols }}
      >
        {/* Top-left empty cell */}
        <div />

        {/* Column headers */}
        {voiceTypes.map((v) => (
          <div
            key={v}
            className="text-center text-[11px] font-semibold text-foreground/40 pb-1"
          >
            {v}
          </div>
        ))}

        {/* Rows */}
        {hookTypes.map((hook, ri) => (
          <>
            {/* Row label */}
            <div
              key={`label-${hook}`}
              className="flex items-center justify-end pr-2 text-[11px] font-semibold text-foreground/40"
            >
              {hook}
            </div>

            {/* Cells */}
            {voiceTypes.map((voice, ci) => {
              const cell = grid.get(`${hook}::${voice}`);
              const cac = cell?.avgCac ?? 0;
              const isHovered = hovered?.row === ri && hovered?.col === ci;

              return (
                <div
                  key={`${hook}-${voice}`}
                  onMouseEnter={() => setHovered({ row: ri, col: ci })}
                  onMouseLeave={() => setHovered(null)}
                  className={`rounded-[12px] h-12 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                    isHovered ? "ring-2 ring-foreground scale-105" : ""
                  }`}
                  style={{ backgroundColor: cacToColor(cac) }}
                >
                  {cac > 0 && (
                    <span className="text-[12px] font-bold text-foreground/80">
                      ${cac.toFixed(0)}
                    </span>
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* Hover tooltip */}
      {hovered !== null && hoveredCell && (
        <div className="mt-3 text-[12px] text-foreground/60 bg-background rounded-[14px] p-3.5">
          <span className="font-semibold text-foreground">{hookTypes[hovered.row]}</span>
          {" x "}
          <span className="font-semibold text-foreground">{voiceTypes[hovered.col]}</span>
          <div className="flex gap-4 mt-2 text-[11px]">
            <span>Avg CAC: <span className="font-bold text-foreground">${hoveredCell.avgCac.toFixed(2)}</span></span>
            <span>{hoveredCell.count} data points</span>
            <span>${hoveredCell.totalSpend.toFixed(0)} spend</span>
            <span>{hoveredCell.totalConversions} conv.</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 text-[11px] text-foreground/35 font-medium">
        <span>Low CAC</span>
        <div className="flex h-2.5 w-28 rounded-full overflow-hidden">
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
