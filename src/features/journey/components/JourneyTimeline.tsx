"use client";

import Link from "next/link";
import { 
  Lock, 
  Users2, 
  Globe2, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { JourneyRecord } from "../types";
import { 
  getJourneyCategoryLabel, 
  getJourneyTrustLabel, 
  getJourneyVisibilityLabel, 
  getJourneyCategoryTone 
} from "../helpers";

interface JourneyTimelineProps {
  readonly records: readonly JourneyRecord[];
}

export function JourneyTimeline({ records }: JourneyTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="card card-pad text-center py-12">
        <p className="text-muted-foreground text-sm">No Journey records found matching the active category.</p>
      </div>
    );
  }

  return (
    <div className="relative ml-2 min-w-0 space-y-10 border-l-2 border-line/50 py-2 pl-4 sm:ml-3 sm:pl-6 md:ml-6 md:pl-10">
      {records.map((r) => {
        const tone = getJourneyCategoryTone(r.category);
        const toneStyle = {
          brand: "bg-brand-soft/30 text-brand border-brand/20",
          lime: "bg-lime/10 text-lime border-lime/20",
          sky: "bg-sky/10 text-sky border-sky/20",
          amber: "bg-amber/15 text-amber border-amber/20"
        }[tone];

        // Format dates deterministically to avoid hydration mismatch
        const dateStr = r.occurredAt.split("T")[0];

        return (
          <div key={r.id} className="group relative min-w-0 animate-fade-up">
            {/* Timeline node dot indicator */}
            <span className="absolute -left-[27px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-card shadow-sm transition group-hover:scale-110 sm:-left-[35px] md:-left-[51px]">
              <span className="h-2 w-2 rounded-full bg-brand" />
            </span>

            {/* Timeline Item Container */}
            <div className="card card-pad card-hover border border-line/60 bg-card space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{dateStr}</span>
                  <span className={`pill text-[10px] font-bold uppercase tracking-wider ${toneStyle}`}>
                    {getJourneyCategoryLabel(r.category)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {/* Trust Level Indicator */}
                  <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> {getJourneyTrustLabel(r.trustLevel)}
                  </span>
                  {/* Visibility Indicator */}
                  <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold inline-flex items-center gap-1">
                    {r.visibility === "private" && <Lock className="h-3 w-3" />}
                    {r.visibility === "circle" && <Users2 className="h-3 w-3" />}
                    {r.visibility === "public" && <Globe2 className="h-3 w-3" />}
                    {getJourneyVisibilityLabel(r.visibility)}
                  </span>
                </div>
              </div>

              {/* Title & summary */}
              <div>
                <h4 className="font-display text-lg font-bold text-foreground group-hover:text-brand transition">
                  {r.title}
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed mt-1">
                  {r.summary}
                </p>
              </div>

              {/* Metrics Display */}
              {r.metrics.length > 0 && (
                <div className="flex flex-wrap gap-2 py-1">
                  {r.metrics.map((m) => (
                    <span key={m.label} className="pill bg-secondary/60 text-foreground font-medium text-xs">
                      {m.label}: <span className="font-extrabold">{m.value}</span>
                    </span>
                  ))}
                  
                  {r.healthPulseAfter !== undefined && r.healthPulseChange !== undefined && (
                    <span className="pill bg-brand-soft/20 text-brand font-semibold text-xs flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" /> Health Pulse: +{r.healthPulseChange.toFixed(1)}
                    </span>
                  )}
                </div>
              )}

              {/* Reflections */}
              {r.reflection && (
                <div className="border-l-2 border-brand-bright/30 pl-3.5 italic text-xs text-[#586b60] dark:text-[#96aa9e] leading-relaxed">
                  &ldquo;{r.reflection}&rdquo;
                </div>
              )}

              {/* Bottom Actions link to Journey Details */}
              <div className="flex flex-col items-start gap-3 border-t border-line/50 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[11px] italic text-muted-foreground sm:max-w-[70%] sm:truncate">
                  {r.meaning}
                </span>
                <Link 
                  href={`/journey/${r.id}`} 
                  className="btn btn-outline btn-sm inline-flex items-center gap-1 text-xs font-bold leading-none shrink-0"
                >
                  View Details <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
