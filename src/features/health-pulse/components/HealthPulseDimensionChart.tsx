"use client";

import { HealthDimensionScore } from "../types";
import { getHealthDimensionLabel } from "../helpers";

export interface HealthPulseDimensionChartProps {
  readonly current: readonly HealthDimensionScore[];
  readonly previous?: readonly HealthDimensionScore[];
  readonly compact?: boolean;
  readonly showLegend?: boolean;
  readonly className?: string;
}

// Short labels for small mobile viewports
const SHORT_LABELS: Record<string, string> = {
  nutrition: "Nutrisi",
  activity: "Aktivitas",
  sleep: "Tidur",
  hydration: "Hidrasi",
  weight: "Berat",
};

export function HealthPulseDimensionChart({
  current,
  previous = [],
  compact = false,
  showLegend = true,
  className = "",
}: HealthPulseDimensionChartProps) {
  // Filter out consistency — Health Pulse weighted score uses the 5 primary dimensions
  const primaryDimensions = current.filter((d) => d.dimension !== "consistency");

  // Map previous scores by dimension ID
  const prevMap = new Map(previous.map((p) => [p.dimension, p.score]));

  return (
    <div
      className={`space-y-3 ${className}`}
      role="region"
      aria-label="Grafik Perbandingan Dimensi Health Pulse"
    >
      {/* Visual Chart Area */}
      <div className="relative rounded-2xl border border-line/45 bg-card/40 p-4 space-y-2">
        {/* Y-Axis Gridlines & Scale Indicators (0, 50, 100) */}
        {!compact && (
          <div className="absolute inset-x-4 top-4 bottom-10 flex flex-col justify-between pointer-events-none opacity-30">
            <div className="border-b border-dashed border-line flex justify-end text-[9px] text-muted-foreground font-mono pr-1">
              100
            </div>
            <div className="border-b border-dashed border-line flex justify-end text-[9px] text-muted-foreground font-mono pr-1">
              50
            </div>
            <div className="border-b border-line flex justify-end text-[9px] text-muted-foreground font-mono pr-1">
              0
            </div>
          </div>
        )}

        {/* Grouped Vertical Bars Row */}
        <div className={`grid grid-cols-5 gap-2 sm:gap-4 items-end ${compact ? "h-36 pt-2" : "h-44 pt-4"}`}>
          {primaryDimensions.map((dim) => {
            const currentScore = Math.min(100, Math.max(0, dim.score));
            const prevScore = prevMap.has(dim.dimension)
              ? Math.min(100, Math.max(0, prevMap.get(dim.dimension)!))
              : dim.previousScore;

            const change = currentScore - prevScore;
            const shortName = SHORT_LABELS[dim.dimension] || getHealthDimensionLabel(dim.dimension);
            const fullName = getHealthDimensionLabel(dim.dimension);

            return (
              <div
                key={dim.dimension}
                tabIndex={0}
                className="group flex flex-col items-center h-full justify-end relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-0.5"
                aria-label={`${fullName}: Skor saat ini ${currentScore}, sebelumnya ${prevScore} (${change >= 0 ? "+" : ""}${change})`}
              >
                {/* Floating score label on top */}
                <div className="text-[10px] sm:text-xs font-bold text-foreground tabular-nums mb-1 transition-transform group-hover:-translate-y-0.5">
                  {currentScore}
                  {change !== 0 && (
                    <span
                      className={`text-[9px] ml-0.5 font-semibold ${
                        change > 0 ? "text-brand" : "text-amber"
                      }`}
                    >
                      {change > 0 ? `+${change}` : change}
                    </span>
                  )}
                </div>

                {/* Bars track container */}
                <div className="relative w-full max-w-[36px] flex items-end justify-center h-full rounded-t-lg bg-secondary/40 overflow-hidden">
                  {/* Muted Previous Score Bar (Background) */}
                  <div
                    className="absolute bottom-0 inset-x-0 bg-muted-foreground/20 rounded-t-sm transition-all duration-700 ease-out origin-bottom"
                    style={{ height: `${prevScore}%` }}
                    title={`Skor sebelumnya: ${prevScore}`}
                  />

                  {/* Foreground Current Score Bar */}
                  <div
                    className="relative w-full bg-gradient-to-t from-brand/80 to-brand-bright rounded-t-md transition-all duration-700 ease-out shadow-sm origin-bottom group-hover:from-brand group-hover:to-brand-bright"
                    style={{ height: `${currentScore}%` }}
                  />
                </div>

                {/* Dimension label */}
                <span className="mt-2 text-[10px] sm:text-xs font-bold text-muted-foreground text-center truncate max-w-full group-hover:text-foreground transition">
                  {shortName}
                </span>

                {/* Accessible Tooltip on Hover/Focus */}
                <div className="pointer-events-none absolute -top-12 z-20 hidden group-hover:flex group-focus-visible:flex flex-col items-center rounded-lg bg-popover px-2.5 py-1 text-[10px] text-popover-foreground shadow-md border border-line whitespace-nowrap animate-scale-in">
                  <span className="font-bold">{fullName}</span>
                  <span className="text-muted-foreground">
                    Sebelumnya: {prevScore} &rarr; Sekarang: {currentScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional Legend */}
      {showLegend && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-3 w-3 rounded-sm bg-gradient-to-t from-brand to-brand-bright" />
              Skor Saat Ini
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-3 w-3 rounded-sm bg-muted-foreground/25" />
              Skor Sebelumnya
            </span>
          </div>
          <span className="text-[10px] italic">Skala standar 0-100</span>
        </div>
      )}
    </div>
  );
}
