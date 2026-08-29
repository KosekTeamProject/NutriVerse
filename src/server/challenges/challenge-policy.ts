import { ChallengeMetric } from "@prisma/client";

export type VerifiedActivityMetrics = {
  readonly trustedDistanceMeters: number;
  readonly trustedDurationSeconds: number;
};

export function challengeContributionAmount(
  metric: ChallengeMetric,
  activity: VerifiedActivityMetrics,
) {
  switch (metric) {
    case ChallengeMetric.DISTANCE_METERS:
      return Math.max(0, activity.trustedDistanceMeters);
    case ChallengeMetric.DURATION_SECONDS:
      return Math.max(0, activity.trustedDurationSeconds);
    case ChallengeMetric.VERIFIED_ACTIVITY_COUNT:
    case ChallengeMetric.ACTIVE_DAY_COUNT:
      return 1;
  }
}

export function applyChallengeProgress(
  currentValue: number,
  contribution: number,
  targetValue: number,
) {
  const safeTarget = Math.max(0, targetValue);
  const nextValue = Math.min(
    safeTarget,
    Math.max(0, currentValue) + Math.max(0, contribution),
  );
  return {
    currentValue: nextValue,
    isCompleted: safeTarget > 0 && nextValue >= safeTarget,
  };
}
