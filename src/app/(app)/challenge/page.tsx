import { ChallengeHub } from "@/components/app/ChallengeHub";

export default function ChallengePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Challenge Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tantangan harian, mingguan, dan bulanan dalam satu tempat. Selesaikan untuk meraih XP dan Health Points.
        </p>
      </div>

      <ChallengeHub />
    </div>
  );
}
