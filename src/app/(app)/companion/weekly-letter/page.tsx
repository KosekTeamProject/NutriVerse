"use client";

import { ArrowLeft, AlertTriangle, Compass, Info } from "lucide-react";
import Link from "next/link";
import { currentWeeklyLetter } from "@/features/companion/data";
import { useCompanionName } from "@/hooks/useCompanionName";

export default function WeeklyLetterPage() {
  const { displayName } = useCompanionName();
  const startStr = currentWeeklyLetter.periodStart.split("T")[0];
  const endStr = currentWeeklyLetter.periodEnd.split("T")[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
      {/* Back button */}
      <div>
        <Link 
          href="/companion" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-brand transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Companion Hub
        </Link>
      </div>

      {/* Page Header */}
      <div className="border-b border-line/40 pb-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="pill bg-brand-soft text-brand text-[10px] font-bold uppercase tracking-wider">
            Cycle Report
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {startStr} &mdash; {endStr}
          </span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {currentWeeklyLetter.title}
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          A calm reflection on the wellness patterns shaping your week.
        </p>
      </div>

      {/* Letter Body Card */}
      <div className="card card-pad bg-gradient-to-br from-card to-secondary/35 border-line/60 space-y-6">
        {/* Greetings */}
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            {currentWeeklyLetter.greeting}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {currentWeeklyLetter.opening}
          </p>
        </div>

        {/* Weekly Metrics Dashboard Summary Grid */}
        <div className="border-t border-b border-line/45 py-4 space-y-3">
          <h3 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Cycle Summary Coordinates</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-card p-3 text-center">
              <p className="text-[9px] text-muted-foreground font-semibold">PULSE RANGE</p>
              <p className="text-xs font-bold text-foreground mt-1">76.8 &rarr; 78.0</p>
            </div>
            <div className="rounded-xl border border-line bg-card p-3 text-center">
              <p className="text-[9px] text-muted-foreground font-semibold">STREAK PATTERN</p>
              <p className="text-xs font-bold text-brand mt-1">7 Days</p>
            </div>
            <div className="rounded-xl border border-line bg-card p-3 text-center">
              <p className="text-[9px] text-muted-foreground font-semibold">PRIMARY LOG</p>
              <p className="text-xs font-bold text-foreground mt-1">1.4 km walk</p>
            </div>
            <div className="rounded-xl border border-line bg-card p-3 text-center">
              <p className="text-[9px] text-muted-foreground font-semibold">TODAY JOURNAL</p>
              <p className="text-xs font-bold text-brand mt-1">64%</p>
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="space-y-3">
          <h3 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Weekly Highlights</h3>
          <ul className="space-y-2">
            {currentWeeklyLetter.highlights.map((hl, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground leading-normal">
                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[9px] font-bold text-brand">
                  {idx + 1}
                </span>
                <span>{hl}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Area */}
        <div className="space-y-2">
          <h3 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Area for Growth</h3>
          <div className="rounded-xl border border-line bg-card/50 p-3.5 text-xs text-muted-foreground leading-relaxed">
            {currentWeeklyLetter.growthArea}
          </div>
        </div>

        {/* Next Week's Focus */}
        <div className="space-y-2">
          <h3 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Next Week Focus</h3>
          <p className="text-xs text-foreground font-semibold bg-brand-soft/20 rounded-xl p-3 border border-brand/10 leading-relaxed">
            {currentWeeklyLetter.nextWeekFocus}
          </p>
        </div>

        {/* Closing */}
        <div className="space-y-2 pt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {currentWeeklyLetter.closing}
          </p>
          <p className="text-xs font-bold text-foreground mt-2">
            {displayName}, NutriVerse Companion
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <Link href="/journey" className="btn btn-primary w-full text-center py-3 flex items-center justify-center gap-2">
          <Compass className="h-5 w-5" /> Continue Your Journey
        </Link>
      </div>

      {/* Informational disclaimers */}
      <div className="space-y-3">
        <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-xs text-muted-foreground border border-line/30">
          <Info className="h-4.5 w-4.5 shrink-0 text-muted-foreground mt-0.5" />
          <p>
            This Weekly Letter reflects patterns in your wellness data and does not provide medical diagnosis or treatment advice.
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-line p-4 text-[10px] text-muted-foreground/80 bg-card">
          <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <p>
            This competition MVP uses deterministic Companion content to demonstrate the intended Weekly Letter experience.
          </p>
        </div>
      </div>
    </div>
  );
}
