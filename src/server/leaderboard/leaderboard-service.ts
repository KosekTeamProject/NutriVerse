import {
  LeaderboardScope,
  Tier,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function rebuildLeagueLeaderboardSnapshot(now = new Date()) {
  const season = await prisma.leaderboardSeason.findFirst({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { startDate: "desc" },
  });
  if (!season) return { seasonId: null, rankings: 0 };

  const users = await prisma.user.findMany({
    where: {
      isSuspended: false,
      settings: { is: { leaderboardVisible: true } },
      economy: { isNot: null },
    },
    select: {
      id: true,
      economy: {
        select: {
          totalXp: true,
          currentTier: true,
          streakDays: true,
        },
      },
      seasonParticipations: {
        where: { seasonId: season.id },
        select: { carryoverXp: true, earnedXp: true, activeDayCount: true },
      },
    },
  });
  users.sort((left, right) => {
    const leftSeason = left.seasonParticipations[0];
    const rightSeason = right.seasonParticipations[0];
    const leftXp = (leftSeason?.carryoverXp ?? 0) + (leftSeason?.earnedXp ?? 0);
    const rightXp = (rightSeason?.carryoverXp ?? 0) + (rightSeason?.earnedXp ?? 0);
    return rightXp - leftXp || (rightSeason?.activeDayCount ?? 0) - (leftSeason?.activeDayCount ?? 0) || left.id.localeCompare(right.id);
  });
  const rankByTier = new Map<Tier, number>();
  const rows = users.flatMap((user) => {
    if (!user.economy) return [];
    const rank = (rankByTier.get(user.economy.currentTier) ?? 0) + 1;
    rankByTier.set(user.economy.currentTier, rank);
    return [
      {
        seasonId: season.id,
        userId: user.id,
        scope: LeaderboardScope.LEAGUE,
        tier: user.economy.currentTier,
        rankPosition: rank,
        totalVerifiedXp: (user.seasonParticipations[0]?.carryoverXp ?? 0) + (user.seasonParticipations[0]?.earnedXp ?? 0),
        consistencyScore: user.seasonParticipations[0]?.activeDayCount ?? 0,
      },
    ];
  });
  await prisma.$transaction(async (transaction) => {
    await transaction.ranking.deleteMany({
      where: {
        seasonId: season.id,
        scope: LeaderboardScope.LEAGUE,
      },
    });
    if (rows.length) {
      await transaction.ranking.createMany({ data: rows });
    }
  });
  return { seasonId: season.id, rankings: rows.length };
}
