import { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { eligibleBadgeCodes } from "@/server/badges/badge-policy";

export async function evaluateAndAwardUserBadges(userId: string) {
  const [verifiedActivityCount, economy] = await Promise.all([
    prisma.activitySession.count({
      where: { userId, verificationStatus: VerificationStatus.VERIFIED },
    }),
    prisma.userEconomy.findUnique({ where: { userId } }),
  ]);
  const eligibleCodes = eligibleBadgeCodes({
    verifiedActivityCount,
    streakDays: economy?.streakDays ?? 0,
  });
  if (!eligibleCodes.length) return [];

  const badges = await prisma.badge.findMany({
    where: { code: { in: eligibleCodes } },
  });
  await prisma.userBadge.createMany({
    data: badges.map((badge) => ({ userId, badgeId: badge.id })),
    skipDuplicates: true,
  });
  return prisma.userBadge.findMany({
    where: { userId, badgeId: { in: badges.map((badge) => badge.id) } },
    include: { badge: true },
    orderBy: { earnedAt: "asc" },
  });
}
