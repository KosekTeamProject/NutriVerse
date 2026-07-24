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
import { getActivitySummaryById, ACTIVITY, formatTime, computeXp, type ActivityRiskSignal, type UpgradedActivitySummary } from "@/lib/activity";
import { ActivityVerificationCard } from "@/features/activity/components/ActivityVerificationComponents";
import { companionInsights } from "@/features/companion/data";
import { CompanionGuidanceSection } from "@/features/companion/components/CompanionGuidanceSection";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ActivityDetailPageProps {
  readonly params: Promise<{ readonly activityId: string }>;
}

export default async function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const { activityId } = await params;
  let activity = getActivitySummaryById(activityId);

  if (!activity) {
    const user = await requireCurrentUser();
    const stored = await prisma.activitySession.findFirst({
      where: { id: activityId, userId: user.id },
      include: { verificationResult: true },
    });
    if (stored) {
      const type = stored.activityType === "WALK" ? "walk" : stored.activityType === "RUN" ? "run" : "bike";
      const verification = stored.verificationResult;
      const paceMinutes = Math.floor(stored.averagePace / 60);
      const paceSeconds = Math.floor(stored.averagePace % 60);
      const status = stored.verificationStatus.toLowerCase().replaceAll("_", "-") as "pending" | "verified" | "needs-review" | "not-verified" | "manual-review";
      activity = {
        id: stored.id,
        travelerId: user.id,
        type,
        title: stored.activityType === "WALK" ? "Jalan Kaki" : stored.activityType === "RUN" ? "Lari" : "Bersepeda",
        startedAt: stored.startTime.toISOString(),
        endedAt: (stored.endTime ?? stored.startTime).toISOString(),
        durationSeconds: stored.durationSeconds,
        activeDurationSeconds: verification?.trustedDurationSeconds ?? stored.durationSeconds,
        pausedDurationSeconds: Math.max(0, stored.durationSeconds - (verification?.trustedDurationSeconds ?? stored.durationSeconds)),
        distanceKm: stored.distanceMeters / 1000,
        averagePace: `${paceMinutes}:${String(paceSeconds).padStart(2, "0")}`,
        averageSpeedKmh: stored.durationSeconds > 0 ? (stored.distanceMeters / 1000) / (stored.durationSeconds / 3600) : 0,
        status: "completed",
        sourceMode: stored.isSimulated ? "simulation" : "live-gps",
        personalRecordAllowed: true,
        isSimulation: stored.isSimulated,
        version: "1.0.0",
        verification: verification ? {
          activityId: stored.id,
          status,
          riskLevel: verification.riskScore >= 80 ? "critical" : verification.riskScore >= 50 ? "high" : verification.riskScore >= 20 ? "medium" : verification.riskScore > 0 ? "low" : "none",
          signals: verification.reasonCodes.map((code) => code.toLowerCase().replaceAll("_", "-") as ActivityRiskSignal),
          recommendation: status === "verified" ? "accept" : status.includes("review") ? "review" : "keep-personal-record",
          samples: {
            sampleCount: verification.sampleCount,
            acceptedSampleCount: verification.acceptedSampleCount,
            excludedSampleCount: verification.discardedSampleCount,
            activeDurationSeconds: verification.trustedDurationSeconds,
            pausedDurationSeconds: Math.max(0, stored.durationSeconds - verification.trustedDurationSeconds),
            calculatedDistanceKm: verification.trustedDistanceMeters / 1000,
            averageAccuracyMeters: 0,
            largestSampleGapSeconds: verification.largestSampleGapSeconds,
            locationDataAvailable: verification.sampleCount > 0,
          },
          eligibility: {
            eligible: status === "verified",
            xpEligible: status === "verified",
            hpEligible: status === "verified",
            challengeEligible: status === "verified",
            journeyEligible: true,
            healthyDayEligible: status === "verified",
            healthPulseEligible: status === "verified",
            reason: status === "verified" ? "Aktivitas lolos pemeriksaan server." : "Aktivitas disimpan sebagai riwayat pribadi.",
          },
          explanation: verification.reasonCodes.length
            ? `Pemeriksaan server: ${verification.reasonCodes.join(", ")}.`
            : "Aktivitas lolos seluruh pemeriksaan server.",
        } : undefined,
      } satisfies UpgradedActivitySummary;
    }
  }

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
            Ringkasan {cfg.label}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {dateStr}
          </span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground mt-2">
          {activity.title}
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Statistik telemetri dan pemeriksaan kualitas verifikasi aktivitas.
        </p>
      </div>

      {/* Core Stats Card */}
      <div className="card card-pad space-y-6">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Metrik Sesi</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Jarak dan pergerakan yang dihitung dari data aktivitas.</p>
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
            <p className="text-[10px] text-muted-foreground">XP Potensial</p>
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
          Pelajari Verifikasi
        </Link>
        <Link href="/todays-journey" className="btn btn-primary flex-1 text-center py-3 flex items-center justify-center gap-2">
          <Compass className="h-5 w-5" /> Lihat Perjalanan Hari Ini
        </Link>
      </div>

      {/* MVP Transparency */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-[10px] text-muted-foreground border border-line/30">
        <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p>
          Hasil verifikasi aktivitas ini diproses oleh engine backend. Aktivitas simulasi tetap disimpan sebagai riwayat pribadi dan tidak memperoleh reward.
        </p>
      </div>
    </div>
  );
}
