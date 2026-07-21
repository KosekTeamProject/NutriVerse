"use client";

import { ArrowRight, ShieldCheck, Lock, AlertTriangle, Flame } from "lucide-react";
import Link from "next/link";
import { todayJourney } from "@/features/behavior/data";
import { TodayJourneyCard } from "@/features/behavior/components/BehaviorComponents";
import { getPrimaryCompanionInsight } from "@/features/companion/helpers";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";
import { useCompanionName } from "@/hooks/useCompanionName";

export default function TodaysJourneyDetailPage() {
  const { displayName } = useCompanionName();
  // Retrieve behavior-relevant companion card (e.g. morning brief or recovery reflection)
  const noraInsight = getPrimaryCompanionInsight("home");

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      {/* 1. Page Header */}
      <div className="border-b border-line/40 pb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Today’s Journey
        </h1>
        <p className="mt-1.5 text-muted-foreground text-sm font-medium">
          Tampilan jelas mengenai tindakan sehat yang membentuk progres Anda hari ini.
        </p>
      </div>

      {/* 2. Contextual Behavior Card */}
      {noraInsight && (
        <div className="space-y-3">
          <h3 className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider">Panduan dari {displayName}</h3>
          <CompanionCard 
            insight={noraInsight} 
            variant="compact" 
            showExplanation={false} 
            showPriority={false}
          />
        </div>
      )}

      {/* 3. Detailed TodayJourneyCard */}
      <TodayJourneyCard 
        journey={todayJourney} 
        variant="detailed"
        showGoalTrust={true}
        showHealthyDay={true}
        showStreak={true}
        showChallenge={true}
        showRewardPreview={true}
        maxGoals={4}
      />

      {/* 4. Trust Explanation Section */}
      <div className="card card-pad space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Goal Trust System</h3>
          <p className="text-xs text-muted-foreground mt-0.5">How we verify and protect your wellness accomplishments</p>
        </div>

        <div className="grid gap-3 text-xs">
          <div className="rounded-xl border border-line p-3 flex gap-2.5">
            <span className="pill bg-brand-soft text-brand text-[9px] font-bold uppercase py-0 h-5 shrink-0">Verified</span>
            <div>
              <p className="font-bold text-foreground">Activity &amp; Workout</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">Based on trusted, validated activity data.</p>
            </div>
          </div>

          <div className="rounded-xl border border-line p-3 flex gap-2.5">
            <span className="pill bg-sky/15 text-sky text-[9px] font-bold uppercase py-0 h-5 shrink-0">Partially Verified</span>
            <div>
              <p className="font-bold text-foreground">Nutrition &amp; Logs</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">Based on structured data that may include Traveler confirmation.</p>
            </div>
          </div>

          <div className="rounded-xl border border-line p-3 flex gap-2.5">
            <span className="pill bg-secondary text-muted-foreground text-[9px] font-bold uppercase py-0 h-5 shrink-0">Self-Reported</span>
            <div>
              <p className="font-bold text-foreground">Hydration &amp; Rest</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">Provided directly by the Traveler as supportive wellness information.</p>
            </div>
          </div>

          <div className="rounded-xl border border-line/50 p-3 border-dashed flex gap-2.5">
            <span className="pill bg-secondary text-muted-foreground text-[9px] font-bold uppercase py-0 h-5 shrink-0">Simulated</span>
            <div>
              <p className="font-bold text-foreground">Developer Test Data</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">Used in this competition MVP to demonstrate the intended experience.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Healthy Day and Streak Rules Explanations */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card card-pad bg-secondary/35 border-line/65 space-y-3">
          <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4.5 w-4.5 text-brand" /> Healthy Day Standards
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed leading-normal">
            A Healthy Day can be built through activity, nutrition, hydration, recovery, or other meaningful healthy actions. Recovery days can also qualify.
          </p>
        </div>

        <div className="card card-pad bg-secondary/35 border-line/65 space-y-3">
          <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
            <Flame className="h-4.5 w-4.5 text-brand" /> Streak Logic
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed leading-normal">
            Consistency rewards meaningful healthy patterns. Missing data is not automatically treated as a broken streak.
          </p>
        </div>
      </div>

      {/* 6. Privacy and Data Sources Informational Card */}
      <div className="card card-pad space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-1.5">
            <Lock className="h-5 w-5 text-brand" /> Privacy Rules &amp; Data minimization
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Your personal logging boundaries are fully protected</p>
        </div>

        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Activity may use verified GPS data, while hydration and recovery remain private self-reported fields.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Sensitive nutrition logs remain completely private by default.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Missing log items are treated neutrally and never penalized as failure days.</span>
          </li>
        </ul>
      </div>

      {/* 7. Primary Navigation CTA */}
      <div className="pt-2 flex flex-col gap-3">
        <Link href="/healthy-days" className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
          View Healthy Day History <ArrowRight className="h-5 w-5" />
        </Link>
      </div>

      {/* 8. MVP Transparency Note */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-[10px] text-muted-foreground border border-line/30">
        <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p>
          Some goals in this competition MVP use deterministic simulated data to demonstrate the intended Behavior Engine experience.
        </p>
      </div>
    </div>
  );
}
