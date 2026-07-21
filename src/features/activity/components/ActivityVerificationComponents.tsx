"use client";

import Link from "next/link";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Compass
} from "lucide-react";
import { ActivityVerificationResult, ActivityRiskSignal } from "@/lib/activity";
import { getVerificationStatusLabel, getRiskSignalLabel } from "@/features/activity/helpers";


export function ActivityVerificationCard({ 
  result, 
  variant = "compact" 
}: { 
  readonly result: ActivityVerificationResult; 
  readonly variant?: "compact" | "detailed";
}) {
  const isVerified = result.status === "verified";
  const isNeedsReview = result.status === "needs-review";

  // Badges & styling map
  const statusColors = {
    verified: "bg-brand-soft text-brand border-brand/20",
    "needs-review": "bg-amber/10 text-amber border-amber/20",
    "not-verified": "bg-secondary text-muted-foreground border-line",
    pending: "bg-secondary text-muted-foreground border-line",
    "manual-review": "bg-amber/10 text-amber border-line"
  }[result.status] || "bg-secondary text-muted-foreground";

  const Icon = isVerified ? CheckCircle2 : isNeedsReview ? AlertTriangle : XCircle;

  if (variant === "compact") {
    return (
      <div className="card card-pad border-line/60 bg-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="pill bg-secondary text-muted-foreground font-mono text-[9px] font-bold uppercase tracking-wider">
              Verification Check
            </span>
          </div>
          <span className={`pill text-[10px] font-bold uppercase ${statusColors}`}>
            {getVerificationStatusLabel(result.status)}
          </span>
        </div>

        <div className="flex items-start gap-2.5">
          <Icon className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${isVerified ? "text-brand" : isNeedsReview ? "text-amber" : "text-muted-foreground"}`} />
          <div className="text-xs text-muted-foreground leading-normal">
            <p className="font-bold text-foreground">{result.eligibility.reason}</p>
            <p className="mt-1">
              Personal Record Status: <span className="font-semibold text-foreground">Allowed</span>
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-line/45 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Target System: Journey &amp; Pulse</span>
          <Link href="/aktivitas/kepercayaan" className="hover:text-brand transition font-bold uppercase tracking-wider inline-flex items-center gap-0.5">
            Learn More <Compass className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Detailed Variant
  return (
    <div className="card card-pad space-y-5 border-line/65 bg-card">
      {/* Title Header */}
      <div className="flex items-start justify-between border-b border-line/45 pb-3">
        <div>
          <span className="pill bg-secondary text-muted-foreground font-mono text-[9px] font-bold uppercase tracking-wider">Verification Engine Detail</span>
          <h3 className="font-display text-base font-bold text-foreground mt-1.5">Telemetry Analysis</h3>
        </div>
        <span className={`pill text-[10px] font-bold uppercase ${statusColors}`}>
          {getVerificationStatusLabel(result.status)}
        </span>
      </div>

      {/* Primary recommendation message banner */}
      <div className="flex items-start gap-3 bg-secondary/35 rounded-xl p-4 border border-line/30">
        <Icon className={`h-6 w-6 shrink-0 ${isVerified ? "text-brand" : isNeedsReview ? "text-amber" : "text-muted-foreground"}`} />
        <div className="text-xs space-y-1">
          <p className="font-bold text-foreground leading-normal">{result.eligibility.reason}</p>
          <p className="text-muted-foreground">
            Recommendation: <span className="font-bold text-foreground capitalize">{result.recommendation.replace("-", " ")}</span>
          </p>
          <p className="text-[10px] text-muted-foreground italic mt-1">{result.explanation}</p>
        </div>
      </div>

      {/* Risk Signals if present */}
      {result.signals.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Unusual Data Signals</h4>
          <div className="flex flex-wrap gap-2">
            {result.signals.map((sig) => (
              <span key={sig} className="pill bg-amber/10 text-amber border border-amber/15 text-[10px] font-bold">
                {getRiskSignalLabel(sig)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sample Quality Summary Metrics Grid */}
      <div className="space-y-2.5">
        <h4 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Sample Quality Summary</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-line bg-card p-3">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Total Samples</p>
            <p className="text-sm font-extrabold text-foreground mt-0.5">{result.samples.sampleCount}</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-3">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Accepted Samples</p>
            <p className="text-sm font-extrabold text-brand mt-0.5">{result.samples.acceptedSampleCount}</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-3">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Avg GPS Accuracy</p>
            <p className="text-sm font-extrabold text-foreground mt-0.5">{result.samples.averageAccuracyMeters.toFixed(1)} m</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-3">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Active Duration</p>
            <p className="text-sm font-extrabold text-foreground mt-0.5">{Math.round(result.samples.activeDurationSeconds / 60)} min</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-3">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Largest Signal Gap</p>
            <p className="text-sm font-extrabold text-foreground mt-0.5">{result.samples.largestSampleGapSeconds} s</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-3">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Coordinates Rec</p>
            <p className="text-sm font-extrabold text-foreground mt-0.5">{result.samples.locationDataAvailable ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>

      {/* Downstream System Eligibility checks */}
      <div className="space-y-2.5">
        <h4 className="font-display text-xs font-bold text-brand uppercase tracking-wider">System Integration Eligibility</h4>
        <div className="grid gap-2 sm:grid-cols-2 text-xs">
          <div className="flex items-center justify-between border border-line bg-card p-3 rounded-xl">
            <span className="text-muted-foreground font-semibold">Traveler Personal Record</span>
            <span className="pill bg-brand-soft text-brand font-bold">Allowed</span>
          </div>

          <div className="flex items-center justify-between border border-line bg-card p-3 rounded-xl">
            <span className="text-muted-foreground font-semibold">XP Reward Preview</span>
            <span className={`pill font-bold ${result.eligibility.xpEligible ? "bg-brand-soft text-brand" : "bg-secondary text-muted-foreground/60"}`}>
              {result.eligibility.xpEligible ? "Eligible" : "Blocked"}
            </span>
          </div>

          <div className="flex items-center justify-between border border-line bg-card p-3 rounded-xl">
            <span className="text-muted-foreground font-semibold">Challenge Advancement</span>
            <span className={`pill font-bold ${result.eligibility.challengeEligible ? "bg-brand-soft text-brand" : "bg-secondary text-muted-foreground/60"}`}>
              {result.eligibility.challengeEligible ? "Eligible" : "Blocked"}
            </span>
          </div>

          <div className="flex items-center justify-between border border-line bg-card p-3 rounded-xl">
            <span className="text-muted-foreground font-semibold">Today’s Journey Goals</span>
            <span className={`pill font-bold ${result.eligibility.journeyEligible ? "bg-brand-soft text-brand" : "bg-secondary text-muted-foreground/60"}`}>
              {result.eligibility.journeyEligible ? "Eligible" : "Blocked"}
            </span>
          </div>

          <div className="flex items-center justify-between border border-line bg-card p-3 rounded-xl">
            <span className="text-muted-foreground font-semibold">Healthy Day Contribution</span>
            <span className={`pill font-bold ${result.eligibility.healthyDayEligible ? "bg-brand-soft text-brand" : "bg-secondary text-muted-foreground/60"}`}>
              {result.eligibility.healthyDayEligible ? "Eligible" : "Blocked"}
            </span>
          </div>

          <div className="flex items-center justify-between border border-line bg-card p-3 rounded-xl">
            <span className="text-muted-foreground font-semibold">Health Pulse Evolution</span>
            <span className={`pill font-bold ${result.eligibility.healthPulseEligible ? "bg-brand-soft text-brand" : "bg-secondary text-muted-foreground/60"}`}>
              {result.eligibility.healthPulseEligible ? "Eligible" : "Blocked"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p>Aktivitas ini memenuhi pemeriksaan demonstrasi saat ini. Verifikasi produksi memerlukan pemrosesan server.</p>
      </div>
    </div>
  );
}
