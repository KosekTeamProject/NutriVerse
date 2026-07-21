import { ArrowLeft, Compass, Info, AlertTriangle, ShieldCheck, Flame } from "lucide-react";
import Link from "next/link";
import { healthyDayHistory, todayJourney } from "@/features/behavior/data";
import { HealthyDayHeatmap, StreakSummaryCard } from "@/features/behavior/components/BehaviorComponents";

export default function HealthyDaysHistoryPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      {/* Back button */}
      <div>
        <Link 
          href="/todays-journey" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-brand transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Today’s Journey
        </Link>
      </div>

      {/* 1. Page Header */}
      <div className="border-b border-line/40 pb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Healthy Days
        </h1>
        <p className="mt-1.5 text-muted-foreground text-sm font-medium">
          A calm view of how activity, nutrition, recovery, and everyday habits are building consistency over time.
        </p>
      </div>

      {/* 2. Streak Summary Card */}
      <StreakSummaryCard summary={todayJourney.streak} />

      {/* 3. 28-day Heatmap Widget */}
      <HealthyDayHeatmap history={healthyDayHistory} />

      {/* 4. Consistency Summary Metrics */}
      <div className="card card-pad space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Consistency Coordinates</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Summary metrics derived from the past 28-day cycle</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
          <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Achieved Days</p>
            <p className="text-lg font-extrabold text-foreground">16</p>
          </div>

          <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Recovery Days</p>
            <p className="text-lg font-extrabold text-sky">5</p>
          </div>

          <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Active Streak</p>
            <p className="text-lg font-extrabold text-brand flex items-center justify-center gap-1">
              <Flame className="h-4.5 w-4.5" /> 7
            </p>
          </div>

          <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Avg Completeness</p>
            <p className="text-lg font-extrabold text-foreground">86%</p>
          </div>
        </div>
      </div>

      {/* 5. Recovery Protects Progress Card */}
      <div className="card card-pad bg-gradient-to-br from-card to-secondary/35 border-line space-y-3">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-4.5 w-4.5 text-brand" /> Recovery Protects Progress
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed leading-normal">
          Rest, stretching, sleep, and lighter activity can support a Healthy Day when recovery is the right focus. Consistency does not require intense exercise every day.
        </p>
      </div>

      {/* 6. Data Completeness Explanation Box */}
      <div className="card card-pad bg-secondary/35 border-line/65 space-y-3">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
          <Info className="h-4.5 w-4.5 text-muted-foreground" /> Data Source Completeness Rules
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed leading-normal">
          Some days contain verified data, some use self-reported data, and some need more information. Missing data is not treated as unhealthy behavior.
        </p>
      </div>

      {/* 7. Bottom Navigation CTA */}
      <div className="pt-2">
        <Link href="/todays-journey" className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
          <Compass className="h-5 w-5" /> Continue Today’s Journey
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
