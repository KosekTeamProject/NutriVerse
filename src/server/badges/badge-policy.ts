export type BadgeEvaluationSnapshot = {
  readonly verifiedActivityCount: number;
  readonly streakDays: number;
};

export function eligibleBadgeCodes(snapshot: BadgeEvaluationSnapshot) {
  const codes: string[] = [];
  if (snapshot.verifiedActivityCount >= 1) codes.push("FIRST_STEP");
  if (snapshot.streakDays >= 7) codes.push("STREAK_MASTER");
  return codes;
}
