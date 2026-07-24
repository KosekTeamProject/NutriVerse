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
    },
    orderBy: [{ economy: { totalXp: "desc" } }, { id: "asc" }],
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
        totalVerifiedXp: user.economy.totalXp,
        consistencyScore: user.economy.streakDays,
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
