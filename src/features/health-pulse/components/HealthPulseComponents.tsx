"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  Info, 
  Sparkles
} from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { HealthPulseDimensionChart } from "./HealthPulseDimensionChart";
import { HealthPulseSnapshot, HealthPulseHistoryPoint, HealthDimensionScore } from "../types";
import { 
  getHealthDimensionLabel, 
  getHealthPulseStatusLabel, 
  getHealthPulseTrendLabel, 
  getHealthDataTrustLabel, 
  getHealthDimensionTone,
  formatHealthPulseChange,
  getHealthPulseAccessibleSummary
} from "../helpers";

// 1. HealthDimensionRow
export function HealthDimensionRow({ 
  dimScore, 
  showTrust = false 
}: { 
  readonly dimScore: HealthDimensionScore; 
  readonly showTrust?: boolean;
}) {
  const tone = getHealthDimensionTone(dimScore.dimension);
  const colorMap = {
    brand: "var(--brand)",
    lime: "var(--lime)",
    sky: "var(--sky)",
    amber: "var(--amber)"
  }[tone];

  const trendIcon = {
    improving: "↑",
    stable: "→",
    recovering: "↗",
    "needs-attention": "↓"
  }[dimScore.trend];

  const verfStyle = {
    "trusted": "bg-brand-soft/20 text-brand border-brand/20",
    "partially-verified": "bg-sky/10 text-sky border-sky/20",
    "self-reported": "bg-secondary text-muted-foreground border-line",
    "simulated": "bg-secondary text-muted-foreground border-line border-dashed",
    "missing": "bg-destructive/10 text-destructive border-destructive/20"
  }[dimScore.trust] || "";

  return (
    <div className="space-y-1.5 p-3 rounded-2xl border border-line/45 bg-card/60">
      <div className="flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground">{getHealthDimensionLabel(dimScore.dimension)}</span>
          {showTrust && (
            <span className={`pill text-[9px] font-bold py-0 px-1.5 scale-90 ${verfStyle}`}>
              {getHealthDataTrustLabel(dimScore.trust)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-foreground">
          <span className="text-[10px] text-muted-foreground font-normal">{trendIcon}</span>
          <span className="stat-num">{dimScore.score}%</span>
          <span className={`text-[10px] ${dimScore.change >= 0 ? "text-brand" : "text-amber"}`}>
            ({dimScore.change >= 0 ? "+" : ""}{dimScore.change})
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div 
          className="h-full rounded-full transition-all duration-500" 
          style={{ width: `${dimScore.score}%`, backgroundColor: colorMap }} 
        />
      </div>

      <p className="text-[10px] text-muted-foreground leading-normal mt-1 italic">
        {dimScore.summary} (Completeness: {dimScore.completeness}%)
      </p>
    </div>
  );
}

// 2. HealthPulseReasonList
export function HealthPulseReasonList({ 
  reasons, 
  maxReasons = 3 
}: { 
  readonly reasons: readonly string[]; 
  readonly maxReasons?: number;
}) {
  const visibleReasons = reasons.slice(0, maxReasons);

  return (
    <div className="space-y-2">
      <h4 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Faktor Pendorong Utama</h4>
      <ul className="space-y-1.5">
        {visibleReasons.map((reason, idx) => (
          <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-normal">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 3. HealthPulseCard
interface HealthPulseCardProps {
  readonly snapshot: HealthPulseSnapshot;
  readonly variant?: "compact" | "detailed";
  readonly className?: string;
  readonly showReasons?: boolean;
  readonly showDataCompleteness?: boolean;
  readonly showTrustIndicators?: boolean;
  readonly maxReasons?: number;
}

export function HealthPulseCard({ 
  snapshot, 
  variant = "compact", 
  className = "", 
  showReasons = true,
  showTrustIndicators = false,
  maxReasons = 1
}: HealthPulseCardProps) {
  const isCompact = variant === "compact";

  if (isCompact) {
    return (
      <div className={`card card-pad flex flex-col justify-between space-y-4 ${className}`}>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Health Pulse</h3>
            <span className="pill bg-brand-soft text-brand font-semibold capitalize">
              {getHealthPulseStatusLabel(snapshot.status)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Tren kebiasaan Anda {getHealthPulseTrendLabel(snapshot.trend).toLowerCase()}</p>
        </div>

        <div className="flex items-center justify-between py-1 bg-secondary/30 rounded-xl px-3 border border-line/20">
          <span className="text-xs text-muted-foreground font-medium">Skor Pulse</span>
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5 tabular-nums">
            <span className="text-muted-foreground font-normal line-through">{snapshot.previousScore.toFixed(1)}</span>
            <ArrowRight className="h-3 w-3 text-brand" />
            <span className="text-brand text-sm font-extrabold">{snapshot.score.toFixed(1)}</span>
            <span className="text-[10px] text-brand">({formatHealthPulseChange(snapshot.change)})</span>
          </span>
        </div>

        {/* Vertical Grouped Bars Visualization for 5 Dimensions */}
        <HealthPulseDimensionChart 
          current={snapshot.dimensions} 
          compact={true} 
          showLegend={false} 
        />

        {/* Reasons */}
        {showReasons && snapshot.reasons.length > 0 && (
          <div className="border-l-2 border-brand/35 pl-3.5 italic text-xs text-[#586b60] dark:text-[#96aa9e] leading-relaxed">
            &ldquo;{snapshot.reasons[0]}&rdquo;
          </div>
        )}

        <div className="pt-2 border-t border-line/45 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Kelengkapan: {snapshot.dataCompleteness}%</span>
          <Link href="/health-pulse" className="btn btn-outline btn-sm inline-flex items-center gap-1 text-xs font-bold">
            Lihat Detail <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // Detailed Variant for /health-pulse
  return (
    <div className={`card card-pad flex flex-col justify-between space-y-6 ${className}`}>
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Health Pulse Hari Ini</h3>
          <span className="pill bg-brand-soft text-brand font-bold capitalize">
            {getHealthPulseStatusLabel(snapshot.status)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Refleksi koordinat kebiasaan harian Anda</p>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around sm:gap-4 py-2">
        <div className="relative grid place-items-center w-[130px] h-[130px] shrink-0">
          <ProgressRing 
            value={snapshot.score} 
            size={130} 
            stroke={10} 
            gradientId="hp-score-detailed"
            from="var(--brand-bright)"
            to="var(--lime)"
            showText={false}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Skor Pulse</p>
            <p className="text-2xl font-extrabold text-foreground tabular-nums leading-none mt-0.5">{snapshot.score.toFixed(1)}</p>
            <p className="text-[10px] text-brand font-bold tabular-nums mt-0.5">+{snapshot.change.toFixed(1)}</p>
          </div>
        </div>

        <div className="w-full sm:w-1/2 space-y-3">
          <div className="rounded-xl border border-line bg-card/65 p-3 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-semibold">Area Terkuat</span>
            <span className="pill bg-brand-soft text-brand font-bold capitalize">
              {getHealthDimensionLabel(snapshot.strongestDimension)}
            </span>
          </div>

          <div className="rounded-xl border border-line bg-card/65 p-3 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-semibold">Fokus Pemulihan</span>
            <span className="pill bg-amber/10 text-amber font-bold capitalize">
              {getHealthDimensionLabel(snapshot.focusDimension)}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Dimensions Grid */}
      <div className="space-y-3">
        <h4 className="font-display text-sm font-bold text-foreground">Lima Dimensi Utama</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {snapshot.dimensions
            .filter((dim) => dim.dimension !== "consistency")
            .map((dim) => (
              <HealthDimensionRow key={dim.dimension} dimScore={dim} showTrust={showTrustIndicators} />
            ))}
        </div>
      </div>

      {/* Consistency Indicator - Moved outside five dimensions */}
      {(() => {
        const consistency = snapshot.dimensions.find((dim) => dim.dimension === "consistency");
        if (!consistency) return null;
        return (
          <div className="card border border-line bg-secondary/35 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-brand" /> {getHealthDimensionLabel(consistency.dimension)}
              </span>
              <span className="stat-num text-brand text-xs tabular-nums">Skor: {consistency.score}%</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              {consistency.summary}
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber to-brand transition-all duration-1000 ease-out" 
                style={{ width: `${consistency.score}%` }} 
              />
            </div>
          </div>
        );
      })()}

      {/* Drivers List */}
      {showReasons && (
        <div className="border-t border-line/50 pt-4">
          <HealthPulseReasonList reasons={snapshot.reasons} maxReasons={maxReasons} />
        </div>
      )}

      {/* Next Action Box */}
      <div className="rounded-2xl border border-brand/20 bg-brand-soft/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-brand font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> REKOMENDASI TINDAKAN SELANJUTNYA
          </p>
          <p className="text-sm text-foreground font-semibold mt-1">
            {snapshot.recommendedNextAction}
          </p>
        </div>
        <Link href="/aktivitas" className="btn btn-primary text-xs shrink-0 self-start sm:self-center">
          Lanjutkan Journey
        </Link>
      </div>
    </div>
  );
}

// 4. HealthPulseHistoryChart
interface HealthPulseHistoryChartProps {
  readonly history: readonly HealthPulseHistoryPoint[];
}

export function HealthPulseHistoryChart({ history }: HealthPulseHistoryChartProps) {
  // SVG dimensions
  const width = 600;
  const height = 240;
  const pad = 40;

  // Chart min/max scores
  const minScore = 70;
  const maxScore = 80;
  
  // Dynamic coordinates
  const pointsCoords = history.map((pt, idx) => {
    const x = pad + (idx * (width - 2 * pad)) / (history.length - 1);
    const y = height - pad - ((pt.score - minScore) * (height - 2 * pad)) / (maxScore - minScore);
    return { x, y, score: pt.score, date: pt.date };
  });

  const polylinePointsStr = pointsCoords.map((pt) => `${pt.x},${pt.y}`).join(" ");

  // Subtle grid values (every 2 units on score: 70, 72, 74, 76, 78, 80)
  const gridLevels = [70, 72, 74, 76, 78, 80];

  return (
    <div className="card card-pad space-y-4">
      <div>
        <h3 className="font-display text-base font-bold text-foreground">Tren Riwayat 14 Hari</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Catatan indeks perkembangan pulse Anda</p>
      </div>

      <div className="relative w-full overflow-hidden bg-secondary/15 rounded-2xl border border-line/45 p-4">
        {/* SVG Drawing */}
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto text-muted-foreground"
          aria-label={getHealthPulseAccessibleSummary({
            id: "health-pulse-current",
            travelerId: "Fathan",
            score: 78.0,
            previousScore: 76.8,
            change: 1.2,
            status: "flourishing",
            trend: "improving",
            strongestDimension: "activity",
            focusDimension: "sleep",
            dataCompleteness: 86,
            generatedAt: "2026-07-20T12:00:00Z",
            dimensions: [],
            reasons: [],
            recommendedNextAction: ""
          })}
        >
          {/* Horizontal Grid lines */}
          {gridLevels.map((lvl) => {
            const gy = height - pad - ((lvl - minScore) * (height - 2 * pad)) / (maxScore - minScore);
            return (
              <g key={lvl} className="opacity-45 dark:opacity-25">
                <line 
                  x1={pad} 
                  y1={gy} 
                  x2={width - pad} 
                  y2={gy} 
                  stroke="rgba(255, 255, 255, 0.1)" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={pad - 10} 
                  y={gy + 4} 
                  textAnchor="end" 
                  className="fill-current text-[10px] font-semibold"
                >
                  {lvl}
                </text>
              </g>
            );
          })}

          {/* Connectors Line */}
          <polyline
            fill="none"
            stroke="var(--brand)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePointsStr}
          />

          {/* Highlight visual gradient fill under the line */}
          <path
            d={`M ${pointsCoords[0].x} ${height - pad} 
               L ${polylinePointsStr.replace(/,/g, " ")} 
               L ${pointsCoords[pointsCoords.length - 1].x} ${height - pad} Z`}
            fill="url(#chart-grad)"
            className="opacity-15 dark:opacity-10"
          />

          {/* Definitions */}
          <defs>
            <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Dots on points */}
          {pointsCoords.map((pt, idx) => {
            const isLatest = idx === pointsCoords.length - 1;
            return (
              <g key={idx} className="group">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isLatest ? "6.5" : "4.5"}
                  className={`${
                    isLatest 
                      ? "fill-brand stroke-background stroke-2 shadow-sm animate-pulse" 
                      : "fill-secondary stroke-line hover:fill-brand hover:stroke-background transition"
                  }`}
                />
                {isLatest && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="12"
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth="1.5"
                    className="opacity-40 animate-ping"
                  />
                )}
              </g>
            );
          })}

          {/* X axis dates (First, middle, last) */}
          <text x={pad} y={height - 12} textAnchor="start" className="fill-current text-[10px] font-semibold">
            {history[0].date.split("-").slice(1).join("/")}
          </text>
          <text x={width / 2} y={height - 12} textAnchor="middle" className="fill-current text-[10px] font-semibold">
            {history[Math.floor(history.length / 2)].date.split("-").slice(1).join("/")}
          </text>
          <text x={width - pad} y={height - 12} textAnchor="end" className="fill-current text-[10px] font-semibold">
            {history[history.length - 1].date.split("-").slice(1).join("/")}
          </text>
        </svg>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-secondary/60 p-3 text-[11px] text-muted-foreground border border-line/30">
        <Info className="h-4 w-4 shrink-0" />
        <p>Accessible Chart Summary: Scores show steady progress starting at 73.2, dipping slightly to 75.0, then gradually recovering up to 78.0 today.</p>
      </div>
    </div>
  );
}
