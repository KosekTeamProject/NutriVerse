import { ArrowLeft, Compass, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { verifiedMorningWalk, activityNeedsReview, activityNotVerified } from "@/lib/activity";
import { ActivityVerificationCard } from "@/features/activity/components/ActivityVerificationComponents";

export default function ActivityTrustPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      {/* Back link */}
      <div>
        <Link 
          href="/aktivitas" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-brand transition"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Aktivitas
        </Link>
      </div>

      {/* 1. Page Header */}
      <div className="border-b border-line/40 pb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Activity Trust &amp; Safety
        </h1>
        <p className="mt-1.5 text-muted-foreground text-sm font-medium">
          How NutriVerse supports fair progress while respecting activity records and location privacy.
        </p>
      </div>

      {/* 2. High-Level Data Flow */}
      <div className="card card-pad bg-gradient-to-br from-brand/5 to-secondary/35 border-brand/20 space-y-4">
        <h3 className="font-display text-base font-bold text-foreground">How We Verify Progress</h3>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground font-semibold">
          <div className="flex-1 rounded-xl border border-line bg-card p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Step 1</p>
            <p className="text-foreground font-bold mt-1">Activity Recorded</p>
          </div>
          <span className="hidden sm:inline text-brand">&rarr;</span>
          <div className="flex-1 rounded-xl border border-line bg-card p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Step 2</p>
            <p className="text-foreground font-bold mt-1">Data Quality Review</p>
          </div>
          <span className="hidden sm:inline text-brand">&rarr;</span>
          <div className="flex-1 rounded-xl border border-line bg-card p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Step 3</p>
            <p className="text-brand font-bold mt-1">Verification Result</p>
          </div>
          <span className="hidden sm:inline text-brand">&rarr;</span>
          <div className="flex-1 rounded-xl border border-line bg-card p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Step 4</p>
            <p className="text-foreground font-bold mt-1">Progress Eligibility</p>
          </div>
        </div>
      </div>

      {/* 3. Broad Data Categories Reviewed */}
      <div className="card card-pad space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Quality Check Factors</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Parameters analyzed to ensure movement continuity</p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span><strong className="text-foreground">Timing Consistency:</strong> Analyzing active and paused duration pacing.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span><strong className="text-foreground">Movement Speed:</strong> Ensuring pacing matches typical walk/run boundaries.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span><strong className="text-foreground">GPS Accuracy:</strong> Excluding signal drift samples and hardware jumps.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span><strong className="text-foreground">Simulation Source:</strong> Clearly identifying virtual logs from actual physical coordinates.</span>
          </li>
        </ul>
      </div>

      {/* 4. Personal Record vs Trusted Progress */}
      <div className="card card-pad bg-secondary/35 border-line/65 space-y-3">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-4.5 w-4.5 text-brand" /> Personal Record vs Trusted Progress
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed leading-normal">
          An activity may remain in your personal history even when it cannot contribute to reward-bearing progress. We respect your effort and protect personal records even when telemetry data fails verification standards.
        </p>
      </div>

      {/* 5. GPS Imperfections */}
      <div className="card card-pad space-y-3">
        <h3 className="font-display text-sm font-bold text-foreground">GPS Signal Imperfections</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tall buildings, tunnels, power saving profiles, and screen-lock browser suspensions can interrupt GPS sample streams. A weak telemetry signal or isolated accuracy drift is treated as an ordinary technical error, not an accusation of manipulation.
        </p>
      </div>

      {/* 6. Verification Reviews Data, Not Character */}
      <div className="card card-pad bg-amber/5 border-amber/25 space-y-3">
        <h3 className="font-display text-sm font-bold text-amber flex items-center gap-1.5">
          <ShieldAlert className="h-4.5 w-4.5 text-amber" /> Verification Reviews Data, Not Character
        </h3>
        <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
          <p>
            Our safety audits evaluate telemetry streams to safeguard game rewards and challenges. Uncertain data or poor accuracy does not imply intentional cheating.
          </p>
          <p>
            Verification limits affect reward balances, never your personal worth or identity as a traveler. Safety and recovery will always remain more important than metrics.
          </p>
        </div>
      </div>

      {/* 7. Simulation Limitations */}
      <div className="card card-pad bg-secondary/35 border-line/65 space-y-3">
        <h3 className="font-display text-sm font-bold text-foreground">Simulation Limitations</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Simulation mode demonstrates the Activity experience without using live GPS. Simulated sessions are clearly labeled and do not represent production verification.
        </p>
      </div>

      {/* 8. Showcasing Three Examples */}
      <div className="space-y-4">
        <h3 className="font-display text-base font-bold text-foreground">Verification Examples</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {verifiedMorningWalk.verification && (
            <ActivityVerificationCard result={verifiedMorningWalk.verification} variant="compact" />
          )}
          {activityNeedsReview.verification && (
            <ActivityVerificationCard result={activityNeedsReview.verification} variant="compact" />
          )}
          {activityNotVerified.verification && (
            <ActivityVerificationCard result={activityNotVerified.verification} variant="compact" />
          )}
        </div>
      </div>

      {/* 9. Bottom Navigation CTA */}
      <div className="pt-2">
        <Link href="/aktivitas" className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
          <Compass className="h-5 w-5" /> Mulai Aktivitas Baru
        </Link>
      </div>

      {/* 10. MVP Transparency Note */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-[10px] text-muted-foreground border border-line/30">
        <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p>
          Activity verification results in this competition MVP are deterministic simulations that demonstrate the intended Trust and Safety experience.
        </p>
      </div>
    </div>
  );
}
