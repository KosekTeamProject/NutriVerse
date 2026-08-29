import { Prisma, RewardSource, Tier } from "@prisma/client";
import { utcDayBounds } from "@/server/economy/economy-policy";

type SeasonCredit = {
  userId: string;
  amount: number;
  effectiveAt: Date;
  lifetimeTier: Tier;
  source: "ACTIVITY" | "CHALLENGE";
};

export async function creditActiveSeasonXp(
  transaction: Prisma.TransactionClient,
  input: SeasonCredit,
) {
  const season = await transaction.leaderboardSeason.findFirst({
    where: {
      isActive: true,
      finalizedAt: null,
      startDate: { lte: input.effectiveAt },
      endDate: { gte: input.effectiveAt },
    },
    orderBy: { startDate: "desc" },
  });
  if (!season || input.amount === 0) return { seasonId: season?.id ?? null };

  const existing = await transaction.seasonParticipant.findUnique({
    where: { seasonId_userId: { seasonId: season.id, userId: input.userId } },
  });
  if (!existing) {
    await transaction.seasonParticipant.create({
      data: {
        seasonId: season.id,
        userId: input.userId,
        lifetimeTierAtStart: input.lifetimeTier,
      },
    });
  }

  let newActiveDay = false;
  if (input.source === RewardSource.ACTIVITY) {
    const bounds = utcDayBounds(input.effectiveAt, season.timezone);
    const activityGrantToday = await transaction.xPGrant.findFirst({
      where: {
        seasonId: season.id,
        userId: input.userId,
        source: RewardSource.ACTIVITY,
        effectiveAt: { gte: bounds.start, lt: bounds.end },
      },
      select: { id: true },
    });
    newActiveDay = !activityGrantToday;
  }

  await transaction.seasonParticipant.update({
    where: { seasonId_userId: { seasonId: season.id, userId: input.userId } },
    data: {
      earnedXp: { increment: input.amount },
      status: "ACTIVE",
      missedSeasonCount: 0,
      ...(input.source === RewardSource.ACTIVITY
        ? {
            verifiedActivityCount: { increment: input.amount > 0 ? 1 : -1 },
            ...(newActiveDay ? { activeDayCount: { increment: 1 } } : {}),
          }
        : input.source === RewardSource.CHALLENGE
          ? { verifiedChallengeCount: { increment: input.amount > 0 ? 1 : -1 } }
          : {}),
    },
  });
  return { seasonId: season.id };
}
