"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, HelpCircle, Calendar, MessageSquareHeart } from "lucide-react";
import { CompanionInsight, CompanionWeeklyLetter } from "../types";
import { getCompanionSourceLabels, getCompanionPriorityLabel } from "../helpers";
import { useCompanionName } from "@/hooks/useCompanionName";
import { useAuthSession } from "@/hooks/useAuthSession";

// 1. CompanionPresence (Abstract Circular Mark)
export function CompanionPresence({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "h-8 w-8 rounded-xl",
    md: "h-11 w-11 rounded-2xl",
    lg: "h-14 w-14 rounded-3xl"
  }[size];

  const iconSize = {
    sm: "h-4.5 w-4.5",
    md: "h-5.5 w-5.5",
    lg: "h-7 w-7"
  }[size];

  return (
    <div className={`grid shrink-0 place-items-center bg-gradient-to-br from-brand to-lime text-white shadow-md shadow-brand/10 select-none animate-pulse duration-3000 ${sizeClass}`}>
      <Sparkles className={iconSize} />
    </div>
  );
}

// 2. CompanionSafetyNote
export function CompanionSafetyNote() {
  const { displayName } = useCompanionName();
  return (
    <div className="card card-pad border-amber/25 bg-amber/5 flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber/15 text-amber">
        <ShieldCheck className="h-4.5 w-4.5" />
      </span>
      <div className="text-xs text-[#665235] dark:text-[#ccbda8] leading-relaxed">
        <p className="font-bold">Batas Panduan Kesehatan</p>
        <p className="mt-0.5">
          {displayName} membantu kebiasaan sehat sehari-hari, bukan mendiagnosis penyakit. Hentikan aktivitas dan cari bantuan profesional jika mengalami nyeri, pusing, atau kelelahan ekstrem.
        </p>
      </div>
    </div>
  );
}

// 3. CompanionCard
interface CompanionCardProps {
  readonly insight: CompanionInsight;
  readonly variant?: "hero" | "compact" | "reflection";
  readonly companionName?: string;
  readonly travelerName?: string;
  readonly className?: string;
  readonly showExplanation?: boolean;
  readonly showSourceLabels?: boolean;
  readonly showPriority?: boolean;
  readonly actionLabel?: string;
  readonly actionPath?: string;
}

export function CompanionCard({
  insight,
  variant = "compact",
  companionName: companionNameProp,
  travelerName,
  className = "",
  showExplanation = false,
  showSourceLabels = false,
  showPriority = false,
  actionLabel,
  actionPath
}: CompanionCardProps) {
  const { displayName } = useCompanionName();
  const session = useAuthSession();
  const companionName = companionNameProp ?? displayName;
  const resolvedTravelerName = travelerName ?? session?.name.split(" ")[0] ?? "";
  const isReflection = variant === "reflection";
  const resolvedActionLabel = actionLabel ?? insight.recommendedActionLabel;
  const resolvedActionPath = actionPath ?? insight.recommendedActionPath;

  // Reflection Layout (Editorial Card inset, no chat bubbles)
  if (isReflection) {
    return (
      <div className={`card min-w-0 bg-gradient-to-br from-secondary/50 to-card border-l-4 border-brand p-4 sm:p-5 space-y-3 ${className}`}>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <CompanionPresence size="sm" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider">{companionName}</span>
              <h4 className="font-display text-sm font-bold text-foreground mt-0.5 break-words">{insight.title}</h4>
            </div>
          </div>
          {showSourceLabels && insight.sourceReference && (
            <span className="max-w-full break-all text-[10px] text-muted-foreground font-mono sm:text-right">
              {getCompanionSourceLabels(insight)}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed italic">
          &ldquo;{insight.message}&rdquo;
        </p>
        {resolvedActionPath && resolvedActionLabel && (
          <div className="pt-1 text-right">
            <Link href={resolvedActionPath} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-bright transition">
              {resolvedActionLabel} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Compact Layout
  if (variant === "compact") {
    return (
      <div className={`card card-pad border-line/60 bg-card flex items-start gap-3.5 transition-all hover:border-line hover:shadow-soft ${className}`}>
        <CompanionPresence size="sm" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-display text-sm font-bold text-foreground truncate">{insight.title}</h4>
            {showPriority && insight.priority === "safety" && (
              <span className="pill bg-amber/10 text-amber text-[9px] font-bold uppercase py-0 scale-90">Keamanan</span>
            )}
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {insight.shortMessage}
          </p>
          {resolvedActionPath && resolvedActionLabel && (
            <div className="pt-1">
              <Link href={resolvedActionPath} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-bright transition">
                {resolvedActionLabel} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Hero Layout
  return (
    <div className={`card relative min-w-0 overflow-hidden border-brand/20 bg-gradient-to-br from-brand/5 to-lime/5 p-4 shadow-soft sm:p-6 ${className}`}>
      <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/10 blur-2xl" />
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <CompanionPresence size="md" />
        <div className="min-w-0 flex-1 space-y-3.5">
          <div>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-brand">
                Pendamping {companionName}
              </span>
              {showPriority && (
                <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold">
                  {getCompanionPriorityLabel(insight.priority)}
                </span>
              )}
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mt-1">
              {insight.title}
            </h3>
          </div>
          
          <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
            {resolvedTravelerName ? `Halo ${resolvedTravelerName}, ` : ""}{insight.message}
          </p>

          <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between border-t border-brand/10 pt-3.5 mt-1">
            {resolvedActionPath && resolvedActionLabel ? (
              <Link href={resolvedActionPath} className="btn btn-primary text-xs inline-flex items-center gap-2 self-start sm:self-center">
                {resolvedActionLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div />
            )}

            {showExplanation && (
              <span className="inline-flex max-w-full items-start gap-1 text-[10px] text-muted-foreground">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /> Saran simulasi berdasarkan catatan hari ke-148
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. CompanionWeeklyLetterPreview
export function CompanionWeeklyLetterPreview({ letter }: { readonly letter: CompanionWeeklyLetter }) {
  // Format period dates
  const startStr = letter.periodStart.split("T")[0];
  const endStr = letter.periodEnd.split("T")[0];

  return (
    <div className="card card-pad bg-gradient-to-br from-card to-secondary/35 border-line/60 space-y-4">
      <div className="flex flex-col gap-2 border-b border-line/45 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <span className="pill bg-brand-soft text-brand text-[9px] font-bold uppercase tracking-wider">Surat Mingguan</span>
          <h3 className="font-display text-base font-bold text-foreground mt-1">{letter.title}</h3>
        </div>
        <span className="pill self-start bg-secondary text-muted-foreground font-semibold text-[10px] flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {startStr} - {endStr}
        </span>
      </div>

      <div className="space-y-3.5">
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          &ldquo;{letter.opening}&rdquo;
        </p>
        
        <div className="rounded-xl border border-line p-3 bg-brand-soft/5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1">
            <MessageSquareHeart className="h-4 w-4 text-brand" /> Status Surat
          </span>
          <span className="pill bg-brand-soft text-brand font-bold">Siap Dibaca</span>
        </div>
      </div>

      <div className="pt-1">
        <Link href="/companion/weekly-letter" className="btn btn-outline w-full text-center text-sm font-semibold justify-center">
          Baca Surat Mingguan
        </Link>
      </div>
    </div>
  );
}

// 5. CompanionInsightFilters
interface CompanionInsightFiltersProps {
  readonly activeFilter: string;
  readonly onFilterChange: (filter: string) => void;
}

export function CompanionInsightFilters({ activeFilter, onFilterChange }: CompanionInsightFiltersProps) {
  const filters = [
    { id: "all", label: "Semua Insight" },
    { id: "morning-brief", label: "Ringkasan Pagi" },
    { id: "reflection", label: "Refleksi" },
    { id: "nutrition-insight", label: "Nutrisi" },
    { id: "recovery-insight", label: "Pemulihan" },
    { id: "health-pulse-interpretation", label: "Health Pulse" },
    { id: "challenge-guidance", label: "Tantangan" },
    { id: "safety-reminder", label: "Keamanan" }
  ];

  return (
    <div className="flex min-w-0 flex-wrap gap-2 border-b border-line/20 py-1 pb-4">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          aria-pressed={activeFilter === f.id}
          className={`rounded-full px-4.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
            activeFilter === f.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
