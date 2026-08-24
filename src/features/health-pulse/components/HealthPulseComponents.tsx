"use client";

import { useState, useEffect, useMemo } from "react";
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
  formatHealthPulseChange
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
      <div className="flex flex-col gap-2 text-xs font-semibold min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="break-words text-foreground">{getHealthDimensionLabel(dimScore.dimension)}</span>
          {showTrust && (
            <span className={`pill text-[9px] font-bold py-0 px-1.5 scale-90 ${verfStyle}`}>
              {getHealthDataTrustLabel(dimScore.trust)}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-foreground">
          <span className="text-[10px] text-muted-foreground font-normal">{trendIcon}</span>
          <span className="stat-num">{dimScore.score}%</span>
          <span className={`text-[10px] ${dimScore.change >= 0 ? "text-brand" : "text-amber"}`}>
            ({dimScore.change >= 0 ? "+" : ""}{dimScore.change})
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="chart-progress h-2 overflow-hidden rounded-full">
        <div 
          className="h-full rounded-full transition-all duration-500" 
          style={{ width: `${dimScore.score}%`, backgroundColor: colorMap }} 
        />
      </div>

      <p className="text-[10px] text-muted-foreground leading-normal mt-1 italic">
        {dimScore.summary} (Kelengkapan: {dimScore.completeness}%)
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
  const displayScore = snapshot.score ?? 0;
  const displayPreviousScore = snapshot.previousScore ?? displayScore;
  const [animatedScore, setAnimatedScore] = useState(displayPreviousScore);

  useEffect(() => {
    const start = displayPreviousScore;
    const target = displayScore;
    const duration = 1000; // 1s
    const startTime = performance.now();

    function updateScore(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;
      setAnimatedScore(Number(current.toFixed(1)));
      if (progress < 1) {
        requestAnimationFrame(updateScore);
      }
    }

    const animationFrame = requestAnimationFrame(updateScore);
    return () => cancelAnimationFrame(animationFrame);
  }, [displayScore, displayPreviousScore]);

  if (!snapshot.isPublished) {
    return (
      <div className={`card card-pad space-y-4 ${className}`}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
            <Sparkles className="h-5 w-5 animate-breathe" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">Health Pulse</h3>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Fase {snapshot.phase}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-brand/20 bg-brand-soft/10 p-4">
          <p className="text-sm font-semibold leading-relaxed text-foreground">
            {snapshot.learningMessage}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Belum ada angka yang ditampilkan. Health Pulse membaca pola jangka panjang dan bukan diagnosis medis.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-line bg-secondary/30 p-3">
            <p className="text-muted-foreground">Coverage 7 hari</p>
            <p className="mt-1 font-bold text-foreground">{snapshot.dataCoverage7}%</p>
          </div>
          <div className="rounded-xl border border-line bg-secondary/30 p-3">
            <p className="text-muted-foreground">Coverage 28 hari</p>
            <p className="mt-1 font-bold text-foreground">{snapshot.dataCoverage28}%</p>
          </div>
        </div>
        {isCompact && (
          <Link href="/health-pulse" className="btn btn-outline btn-sm self-start text-xs font-bold">
            Lihat Detail <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className={`card card-pad flex flex-col justify-between space-y-4 transition-all duration-300 hover:shadow-soft ${className}`}>
        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-soft text-brand">
                <Sparkles className="h-4.5 w-4.5 animate-breathe" />
              </span>
              <h3 className="font-display text-lg font-bold text-foreground">Health Pulse</h3>
            </div>
            <span className="pill bg-brand-soft text-brand font-semibold capitalize shadow-sm">
              {getHealthPulseStatusLabel(snapshot.status)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Tren kebiasaan Anda {getHealthPulseTrendLabel(snapshot.trend).toLowerCase()}</p>
        </div>

        <div className="flex items-center justify-between py-2 bg-gradient-to-r from-secondary/40 via-card to-brand-soft/20 rounded-2xl px-4 border border-line/40 shadow-sm">
          <span className="text-xs text-muted-foreground font-semibold">Skor Pulse Score</span>
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5 tabular-nums">
            <span className="text-muted-foreground font-normal line-through text-[11px]">{displayPreviousScore.toFixed(1)}</span>
            <ArrowRight className="h-3.5 w-3.5 text-brand" />
            <span className="text-brand text-lg font-extrabold animate-scale-in">{animatedScore.toFixed(1)}</span>
            <span className="pill bg-brand-soft text-brand text-[10px] font-bold py-0.5 px-1.5">
              ({formatHealthPulseChange(snapshot.change)})
            </span>
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
          <div className="border-l-2 border-brand/40 pl-3.5 italic text-xs text-muted-foreground leading-relaxed">
            &ldquo;{snapshot.reasons[0]}&rdquo;
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-line/45 pt-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground">Kelengkapan Data: {snapshot.dataCompleteness}%</span>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-lg font-bold">Health Pulse Jangka Panjang</h3>
          <span className="pill bg-brand-soft text-brand font-bold capitalize">
            {getHealthPulseStatusLabel(snapshot.status)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Fase {snapshot.phase} · batas skor {snapshot.phaseCap}</p>
      </div>

      <div className="chart-surface chart-surface-brand flex flex-col items-center gap-6 rounded-2xl border border-brand/15 px-4 py-5 sm:flex-row sm:justify-around sm:gap-4">
        <div className="relative grid place-items-center w-[130px] h-[130px] shrink-0">
          <ProgressRing 
            value={displayScore}
            size={130} 
            stroke={10} 
            gradientId="hp-score-detailed"
            from="var(--brand-bright)"
            to="var(--lime)"
            showText={false}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Skor Pulse</p>
            <p className="text-2xl font-extrabold text-foreground tabular-nums leading-none mt-0.5">{displayScore.toFixed(1)}</p>
            <p className="text-[10px] text-brand font-bold tabular-nums mt-0.5">{formatHealthPulseChange(snapshot.change)}</p>
          </div>
        </div>

        <div className="w-full sm:w-1/2 space-y-3">
          <div className="flex flex-col items-start gap-2 rounded-xl border border-line bg-card/65 p-3 text-xs min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
            <span className="text-muted-foreground font-semibold">Area Terkuat</span>
            <span className="pill bg-brand-soft text-brand font-bold capitalize">
              {getHealthDimensionLabel(snapshot.strongestDimension)}
            </span>
          </div>

          <div className="flex flex-col items-start gap-2 rounded-xl border border-line bg-card/65 p-3 text-xs min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
            <span className="text-muted-foreground font-semibold">Fokus Pemulihan</span>
            <span className="pill bg-amber/10 text-amber font-bold capitalize">
              {getHealthDimensionLabel(snapshot.focusDimension)}
            </span>
          </div>
        </div>
      </div>

      {/* Four primary Routine Score dimensions */}
      <div className="space-y-3">
        <h4 className="font-display text-sm font-bold text-foreground">Empat Dimensi Utama</h4>
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
          <div className="chart-surface chart-surface-amber rounded-2xl border border-line p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
              <span className="flex min-w-0 items-center gap-1.5 text-foreground">
                <Sparkles className="h-4 w-4 text-brand" /> {getHealthDimensionLabel(consistency.dimension)}
              </span>
              <span className="stat-num text-brand text-xs tabular-nums">Skor: {consistency.score}%</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              {consistency.summary}
            </p>
            <div className="chart-progress h-1.5 overflow-hidden rounded-full">
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
          <p className="flex min-w-0 items-start gap-1.5 break-words text-xs font-bold uppercase tracking-wider text-brand">
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
  const safeHistory =
    history.length >= 2
      ? history.slice(-14)
      : [
          ...(history.length ? history : [{ date: "", score: 0 }]),
          ...(history.length ? history : [{ date: "", score: 0 }]),
        ];
  // SVG dimensions
  const width = 600;
  const height = 240;
  const pad = 40;

  // Chart min/max scores
  const scores = safeHistory.map((point) => point.score);
  const rawMinimum = Math.min(...scores);
  const rawMaximum = Math.max(...scores);
  const minScore = Math.max(0, Math.floor(rawMinimum / 10) * 10 - 5);
  const maxScore = Math.min(100, Math.max(minScore + 10, Math.ceil(rawMaximum / 10) * 10 + 5));
  
  // Dynamic coordinates
  const pointsCoords = safeHistory.map((pt, idx) => {
    const x = pad + (idx * (width - 2 * pad)) / (safeHistory.length - 1);
    const y = height - pad - ((pt.score - minScore) * (height - 2 * pad)) / (maxScore - minScore);
    return { x, y, score: pt.score, date: pt.date };
  });

  const polylinePointsStr = pointsCoords.map((pt) => `${pt.x},${pt.y}`).join(" ");

  // Subtle grid values (every 2 units on score: 70, 72, 74, 76, 78, 80)
  const gridLevels = Array.from(
    { length: 6 },
    (_, index) => minScore + ((maxScore - minScore) * index) / 5,
  );

  return (
    <div className="card card-pad space-y-4">
      <div>
        <h3 className="font-display text-base font-bold text-foreground">Tren Riwayat {safeHistory.length} Hari</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Catatan indeks perkembangan pulse Anda</p>
      </div>

      <div className="chart-surface chart-surface-mixed relative w-full min-w-0 overflow-hidden rounded-2xl border border-line/45 p-2 sm:p-4">
        {/* SVG Drawing */}
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto text-muted-foreground"
          aria-label={`Grafik tren Health Pulse ${safeHistory.length} hari, dari ${safeHistory[0]?.score ?? 0} ke ${safeHistory.at(-1)?.score ?? 0}`}
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
            {safeHistory[0].date.split("-").slice(1).join("/")}
          </text>
          <text x={width / 2} y={height - 12} textAnchor="middle" className="fill-current text-[10px] font-semibold">
            {safeHistory[Math.floor(safeHistory.length / 2)].date.split("-").slice(1).join("/")}
          </text>
          <text x={width - pad} y={height - 12} textAnchor="end" className="fill-current text-[10px] font-semibold">
            {safeHistory[safeHistory.length - 1].date.split("-").slice(1).join("/")}
          </text>
        </svg>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-[11px] text-muted-foreground border border-line/30">
        <Info className="h-4 w-4 shrink-0" />
        <p>
          Ringkasan grafik: skor berubah dari {safeHistory[0].score.toFixed(1)} menjadi{" "}
          {safeHistory.at(-1)?.score.toFixed(1)} berdasarkan data yang tersimpan.
        </p>
      </div>
    </div>
  );
}

// 7. HealthPulseTrendLineChart
export function HealthPulseTrendLineChart({
  history,
}: {
  readonly history: readonly HealthPulseHistoryPoint[];
}) {
  const [filter, setFilter] = useState<"today" | "7days" | "30days">("7days");

  const trendData = useMemo(() => {
    const count = filter === "today" ? 2 : filter === "7days" ? 7 : 30;
    const selected = history.slice(-count);
    const safe =
      selected.length >= 2
        ? selected
        : [
            ...(selected.length ? selected : [{ date: "", score: 0 }]),
            ...(selected.length ? selected : [{ date: "", score: 0 }]),
          ];
    return safe.map((point) => ({
      label:
        filter === "today"
          ? point === safe.at(-1)
            ? "Hari ini"
            : "Sebelumnya"
          : point.date.split("-").slice(1).join("/"),
      score: point.score,
    }));
  }, [filter, history]);

  const scores = trendData.map((d: { label: string; score: number }) => d.score);
  const minS = Math.min(...scores) - 1;
  const maxS = Math.max(...scores) + 1;

  // Generate SVG polyline points
  const pointsStr = trendData
    .map((d: { label: string; score: number }, idx: number) => {
      const x = (idx / (trendData.length - 1)) * 300 + 20;
      const y = 110 - ((d.score - minS) / (maxS - minS)) * 80;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="card card-pad space-y-4 border-line/60 bg-gradient-to-br from-card to-secondary/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line/45 pb-3">
        <div>
          <span className="eyebrow bg-brand-soft/40 border-brand/20 text-brand text-[10px] py-0.5 px-2">
            Tren Kebiasaan Holistic
          </span>
          <h3 className="font-display text-base font-bold text-foreground mt-1">Health Score Trend Chart</h3>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-secondary p-1 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setFilter("today")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              filter === "today" ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => setFilter("7days")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              filter === "7days" ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            7 Hari
          </button>
          <button
            type="button"
            onClick={() => setFilter("30days")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              filter === "30days" ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            30 Hari
          </button>
        </div>
      </div>

      {/* Comforting Nora Explanation Note */}
      <div className="rounded-2xl border border-brand/20 bg-brand-soft/30 p-3.5 flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
        <Sparkles className="h-4 w-4 shrink-0 text-brand mt-0.5 animate-breathe" />
        <p>
          <span className="font-bold text-foreground">Prinsip Daily Pattern Nora: </span>
          &ldquo;Hari ini asupan gula sedikit meningkat. Tidak apa! Kita bisa menyeimbangkannya dengan aktivitas ringan nanti sore.&rdquo;
        </p>
      </div>

      {/* SVG Line Chart */}
      <div className="relative h-44 w-full rounded-2xl border border-line bg-card p-3 shadow-inner">
        <svg viewBox="0 0 340 130" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <polygon
            points={`20,120 ${pointsStr} 320,120`}
            fill="url(#trendGrad)"
          />

          {/* Line stroke */}
          <polyline
            fill="none"
            stroke="var(--brand)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsStr}
            className="transition-all duration-500"
          />

          {/* Data Points */}
          {trendData.map((d: { label: string; score: number }, idx: number) => {
            const x = (idx / (trendData.length - 1)) * 300 + 20;
            const y = 110 - ((d.score - minS) / (maxS - minS)) * 80;
            return (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  className="fill-brand stroke-background stroke-2 transition-transform duration-300 group-hover:scale-150"
                />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="fill-foreground text-[9px] font-extrabold opacity-0 group-hover:opacity-100 transition duration-200"
                >
                  {d.score.toFixed(1)}
                </text>
                <text
                  x={x}
                  y="125"
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px] font-semibold"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
