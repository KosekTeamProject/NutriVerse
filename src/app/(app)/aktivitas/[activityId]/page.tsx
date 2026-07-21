import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Timer, 
  Gauge, 
  Bike, 
  Zap, 
  AlertTriangle,
  Compass
} from "lucide-react";
import { getActivitySummaryById, ACTIVITY, formatTime, computeXp } from "@/lib/activity";
import { ActivityVerificationCard } from "@/features/activity/components/ActivityVerificationComponents";
import { companionInsights } from "@/features/companion/data";
import { CompanionGuidanceSection } from "@/features/companion/components/CompanionGuidanceSection";

interface ActivityDetailPageProps {
  readonly params: Promise<{ readonly activityId: string }>;
}

export default async function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const { activityId } = await params;
  const activity = getActivitySummaryById(activityId);

  if (!activity) {
    notFound();
  }

  const dateStr = activity.startedAt.split("T")[0];
  const cfg = ACTIVITY[activity.type];

  // Retrieve relevant Nora activity reflection
  const noraInsight = activity.id === "journey-morning-walk"
    ? companionInsights.find((ins) => ins.id === "companion-activity-reflection")
    : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      {/* Back button */}
      <div>
        <Link 
          href="/aktivitas" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-brand transition"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Aktivitas
        </Link>
      </div>

      {/* Page Header */}
      <div className="border-b border-line/40 pb-5">
        <div className="flex items-center gap-2">
          <span className="pill bg-brand-soft text-brand text-[9px] font-bold uppercase tracking-wider">
            {cfg.label} Summary
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {dateStr}
          </span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground mt-2">
          {activity.title}
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Detailed telemetry statistics and quality verification checks.
        </p>
      </div>

      {/* Core Stats Card */}
      <div className="card card-pad space-y-6">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Session Metrics</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Calculated distance and movement coordinates</p>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Jarak tempuh</p>
          <p className="stat-num mt-1 text-5xl leading-none font-extrabold text-foreground">
            {activity.distanceKm.toFixed(2)}<span className="ml-2 text-xl text-muted-foreground font-normal">km</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-line bg-secondary/35 p-3.5 text-center">
            <Timer className="mx-auto h-4 w-4 text-muted-foreground" />
            <p className="stat-num mt-1.5 text-base font-bold text-foreground">{formatTime(activity.durationSeconds)}</p>
            <p className="text-[10px] text-muted-foreground">Waktu</p>
          </div>
          <div className="rounded-xl border border-line bg-secondary/35 p-3.5 text-center">
            <Gauge className="mx-auto h-4 w-4 text-muted-foreground" />
            <p className="stat-num mt-1.5 text-base font-bold text-foreground">{activity.averagePace}</p>
            <p className="text-[10px] text-muted-foreground">Pace /km</p>
          </div>
          <div className="rounded-xl border border-line bg-secondary/35 p-3.5 text-center">
            <Bike className="mx-auto h-4 w-4 text-muted-foreground" />
            <p className="stat-num mt-1.5 text-base font-bold text-foreground">{activity.averageSpeedKmh.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">km/jam</p>
          </div>
          <div className="rounded-xl border border-line bg-brand-soft/20 p-3.5 text-center">
            <Zap className="mx-auto h-4 w-4 text-brand" />
            <p className="stat-num mt-1.5 text-base font-bold text-brand">+{computeXp(activity.distanceKm * 1000, activity.type)}</p>
            <p className="text-[10px] text-muted-foreground">Potential XP</p>
          </div>
        </div>
      </div>

      {/* Activity Reflection */}
      {noraInsight && (
        <CompanionGuidanceSection insight={noraInsight} type="guidance" variant="compact" />
      )}

      {/* Detailed Verification Card */}
      {activity.verification && (
        <ActivityVerificationCard result={activity.verification} variant="detailed" />
      )}

      {/* Navigation actions */}
      <div className="pt-2 flex flex-col gap-3 sm:flex-row">
        <Link href="/aktivitas/kepercayaan" className="btn btn-outline flex-1 text-center py-3 flex items-center justify-center gap-2">
          Learn About Verification
        </Link>
        <Link href="/todays-journey" className="btn btn-primary flex-1 text-center py-3 flex items-center justify-center gap-2">
          <Compass className="h-5 w-5" /> View Today’s Journey
        </Link>
      </div>

      {/* MVP Transparency */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-[10px] text-muted-foreground border border-line/30">
        <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p>
          Activity verification results in this competition MVP are deterministic simulations that demonstrate the intended Trust and Safety experience.
        </p>
      </div>
    </div>
  );
}
