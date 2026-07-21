import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  Compass, 
  Zap, 
  Heart, 
  Activity 
} from "lucide-react";
import { getChallengeById, AUTO_PROGRESS, TIER_STYLE } from "@/lib/challenges";
import { getPrimaryCompanionInsight } from "@/features/companion/helpers";
import { CompanionGuidanceSection } from "@/features/companion/components/CompanionGuidanceSection";

interface ChallengeDetailPageProps {
  readonly params: Promise<{ readonly challengeId: string }>;
}

export default async function ChallengeDetailPage({ params }: ChallengeDetailPageProps) {
  const { challengeId } = await params;
  const challenge = getChallengeById(challengeId);

  if (!challenge) {
    notFound();
  }

  // Get progress percentage and completed state
  const isGps = challenge.source === "gps";
  const now = isGps ? Math.min(challenge.goal, AUTO_PROGRESS[challenge.metric] ?? 0) : 0;
  const pct = Math.min(100, Math.round((now / challenge.goal) * 100));
  const done = now >= challenge.goal;

  // Retrieve Nora Challenge guidance
  const noraInsight = getPrimaryCompanionInsight("challenge");

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      {/* Back Link */}
      <div>
        <Link 
          href="/challenge" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-brand transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Challenge Hub
        </Link>
      </div>

      {/* Page Header */}
      <div className="border-b border-line/40 pb-5">
        <span className={`pill text-[10px] font-bold uppercase tracking-wider ${TIER_STYLE[challenge.tier]}`}>
          {challenge.tier} Tier
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground mt-2">
          {challenge.title}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm leading-normal">
          {challenge.desc}
        </p>
      </div>

      {/* Progress Card */}
      <div className="card card-pad space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Challenge Progress</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Tracking status for current cycle</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="capitalize">{challenge.period} Target</span>
            <span>{now} / {challenge.goal} {challenge.unit} ({pct}%)</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-secondary">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${done ? "bg-brand" : "bg-gradient-to-r from-brand to-lime"}`} 
              style={{ width: `${pct}%` }} 
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line/40 pt-4 flex-wrap gap-2 text-xs">
          <div className="flex gap-2 items-center text-muted-foreground">
            <Activity className="h-4 w-4 text-brand" />
            <span className="font-semibold text-foreground">Source Mode:</span>
            <span className="capitalize">{challenge.source === "gps" ? "Automatic Progress" : "Self-Reported"}</span>
          </div>

          <div className="flex gap-2 items-center text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <span className="font-semibold text-foreground">Trust Level:</span>
            <span className="capitalize">{challenge.source === "gps" ? "Verified" : "Self-Reported"}</span>
          </div>
        </div>
      </div>

      {/* Eligible Activities info */}
      <div className="card card-pad space-y-3">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">Eligible Data Sources</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Telemetry coordinates accepted for tracking</p>
        </div>

        <div className="rounded-xl border border-line p-3 flex justify-between items-center text-xs">
          <span className="font-semibold text-foreground">Activity Mode</span>
          <span className="text-muted-foreground">
            {challenge.source === "gps" ? "Verified browser GPS metrics" : "Traveler self-logged checklist entries"}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-normal">
          {challenge.source === "gps" 
            ? "Verified walking or running activity may contribute to this Challenge."
            : "Self-reported entries are useful for logging consistency but do not trigger verified activity status."
          }
        </p>
      </div>

      {/* Reward Preview Panel */}
      <div className="card card-pad bg-gradient-to-br from-brand/5 to-secondary/35 border-brand/20 space-y-4">
        <div>
          <h4 className="text-xs text-brand font-bold uppercase tracking-wider flex items-center gap-1.5">
            Potential Reward Preview
          </h4>
          <p className="text-xs text-muted-foreground mt-1">Estimates granted upon verified server completion</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          {challenge.xp > 0 && (
            <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Potential XP</p>
              <p className="text-lg font-extrabold text-foreground flex items-center justify-center gap-1">
                <Zap className="h-4.5 w-4.5 text-amber" /> +{challenge.xp} XP
              </p>
            </div>
          )}

          <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1 col-span-2 sm:col-span-1">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Potential HP Gain</p>
            <p className="text-lg font-extrabold text-brand flex items-center justify-center gap-1">
              <Heart className="h-4.5 w-4.5 text-brand" /> +{challenge.hp} HP
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground italic leading-normal bg-secondary/40 rounded-xl p-2.5 border border-line/20">
          * Potential XP/HP after validated completion. Only trusted activity contributes.
        </p>
      </div>

      {/* Challenge Guidance */}
      {noraInsight && (
        <CompanionGuidanceSection insight={noraInsight} type="guidance" variant="compact" />
      )}

      {/* Fair Progress Section */}
      <div className="card card-pad bg-secondary/35 border-line/65 space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Fair Progress</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Ensuring balanced and trusted consistency metrics</p>
        </div>

        <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>GPS-based Challenge progress should use trusted, validated activity data.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Manual Challenges remain clearly labeled as self-reported to protect data integrity.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Self-reported data is useful but does not become verified automatically.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Recovery and rest days are valid healthy progress; missing data is treated neutrally.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Rewards require trusted server-side validation processing in the final production release.</span>
          </li>
        </ul>
      </div>

      {/* Privacy Section */}
      <div className="card card-pad space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-1.5">
            <Lock className="h-5 w-5 text-brand" /> Privacy &amp; Visibility
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Control how your wellness details are logged</p>
        </div>

        <p className="text-xs text-muted-foreground leading-normal">
          Activity Challenge summaries may be set to public-safe, while nutrition, hydration, and recovery details remain strictly private by default. Raw GPS tracking coordinates are never exposed in public Challenge presentations.
        </p>
      </div>

      {/* Navigation CTA */}
      <div className="pt-2">
        <Link href="/todays-journey" className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
          <Compass className="h-5 w-5" /> View Today’s Journey
        </Link>
      </div>

      {/* MVP Transparency */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-[10px] text-muted-foreground border border-line/30">
        <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p>
          Some goals in this competition MVP use deterministic simulated data to demonstrate the intended Behavior Engine experience.
        </p>
      </div>
    </div>
  );
}
