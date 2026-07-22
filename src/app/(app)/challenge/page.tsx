import { ChallengeHub } from "@/components/app/ChallengeHub";
import { getPrimaryCompanionInsight } from "@/features/companion/helpers";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";

export default function ChallengePage() {
  const challengeInsight = getPrimaryCompanionInsight("challenge");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Pusat Tantangan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tantangan harian, mingguan, dan bulanan dalam satu tempat. Target GPS tervalidasi memberi bonus XP; kebiasaan suportif memberi Health Points.
        </p>
      </div>

      {challengeInsight && (
        <CompanionCard insight={challengeInsight} variant="compact" showPriority={true} />
      )}

      <ChallengeHub />
    </div>
  );
}
