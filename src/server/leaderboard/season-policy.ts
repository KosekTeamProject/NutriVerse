import { Tier } from "@prisma/client";

type CarryoverRule = {
  readonly percentage: number;
  readonly maximum: number;
  readonly missedSeasonReduction: number;
  readonly returnFloor: number;
};

export const SEASON_DURATION_DAYS = 84;
export const SEASON_TIMEZONE = "Asia/Jakarta";

export const SEASON_CARRYOVER_RULES: Record<Tier, CarryoverRule> = {
  SPROUT: { percentage: 1, maximum: 600, missedSeasonReduction: 0.05, returnFloor: 0 },
  SEEDLING: { percentage: 0.95, maximum: 900, missedSeasonReduction: 0.05, returnFloor: 100 },
  BLOOM: { percentage: 0.9, maximum: 1_200, missedSeasonReduction: 0.05, returnFloor: 150 },
  VITAL: { percentage: 0.85, maximum: 1_500, missedSeasonReduction: 0.1, returnFloor: 250 },
  RADIANT: { percentage: 0.8, maximum: 1_800, missedSeasonReduction: 0.1, returnFloor: 350 },
  PEAK: { percentage: 0.75, maximum: 2_100, missedSeasonReduction: 0.1, returnFloor: 450 },
  ELITE: { percentage: 0.7, maximum: 2_400, missedSeasonReduction: 0.15, returnFloor: 550 },
  APEX: { percentage: 0.65, maximum: 2_700, missedSeasonReduction: 0.2, returnFloor: 700 },
  LEGEND: { percentage: 0.6, maximum: 3_000, missedSeasonReduction: 0.25, returnFloor: 900 },
};

export const SEASON_REWARD_HP: Record<Tier, number> = {
  SPROUT: 25,
  SEEDLING: 50,
  BLOOM: 100,
  VITAL: 175,
  RADIANT: 275,
  PEAK: 400,
  ELITE: 600,
  APEX: 850,
  LEGEND: 1_200,
};

export function seasonCarryoverXp(
  previousSeasonXp: number,
  tier: Tier,
  missedSeasons = 0,
) {
  const rule = SEASON_CARRYOVER_RULES[tier];
  const base = Math.min(
    rule.maximum,
    Math.floor(Math.max(0, previousSeasonXp) * rule.percentage),
  );
  if (missedSeasons <= 0) return base;
  const reduction = Math.max(0, 1 - rule.missedSeasonReduction * missedSeasons);
  return Math.max(rule.returnFloor, Math.floor(base * reduction));
}

export function isSeasonRewardEligible(input: {
  activeDayCount: number;
  verifiedActivityCount: number;
  hasUnresolvedReview: boolean;
}) {
  return (
    input.activeDayCount >= 7 &&
    input.verifiedActivityCount >= 3 &&
    !input.hasUnresolvedReview
  );
}

