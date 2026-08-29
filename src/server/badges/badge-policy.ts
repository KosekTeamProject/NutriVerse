export type BadgeEvaluationSnapshot = {
  readonly verifiedActivityCount: number;
  readonly streakDays: number;
  readonly verifiedDistanceMeters: number;
  readonly completedChallengeCount: number;
  readonly attendedEventCount: number;
};

export function badgeMetricValue(
  criteriaKey: string,
  snapshot: BadgeEvaluationSnapshot,
) {
  switch (criteriaKey) {
    case "STREAK_DAYS":
      return snapshot.streakDays;
    case "VERIFIED_DISTANCE_METERS":
      return snapshot.verifiedDistanceMeters;
    case "COMPLETED_CHALLENGE_COUNT":
      return snapshot.completedChallengeCount;
    case "ATTENDED_EVENT_COUNT":
      return snapshot.attendedEventCount;
    case "VERIFIED_ACTIVITY_COUNT":
    default:
      return snapshot.verifiedActivityCount;
  }
}

export function badgeProgress(
  criteriaKey: string,
  targetValue: number,
  snapshot: BadgeEvaluationSnapshot,
) {
  const target = Math.max(1, Math.floor(targetValue));
  const current = Math.max(0, badgeMetricValue(criteriaKey, snapshot));
  return {
    current,
    target,
    percentage: Math.min(100, Math.floor((current / target) * 100)),
    eligible: current >= target,
  };
}

export function eligibleBadgeCodes(snapshot: BadgeEvaluationSnapshot) {
  const definitions = [
    ["FIRST_STEP", "VERIFIED_ACTIVITY_COUNT", 1],
    ["STREAK_MASTER", "STREAK_DAYS", 7],
    ["ACTIVE_10", "VERIFIED_ACTIVITY_COUNT", 10],
    ["DISTANCE_50K", "VERIFIED_DISTANCE_METERS", 50_000],
    ["CHALLENGE_5", "COMPLETED_CHALLENGE_COUNT", 5],
    ["EVENT_EXPLORER", "ATTENDED_EVENT_COUNT", 3],
  ] as const;
  return definitions
    .filter(([, criteriaKey, target]) => badgeProgress(criteriaKey, target, snapshot).eligible)
    .map(([code]) => code);
}
