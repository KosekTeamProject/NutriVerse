import { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { eligibleBadgeCodes } from "@/server/badges/badge-policy";

const MANAGED_BADGE_CODES = ["FIRST_STEP", "STREAK_MASTER"] as const;

export async function reconcileUserBadges(userId: string) {
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

  const badges = await prisma.badge.findMany({
    where: { code: { in: [...MANAGED_BADGE_CODES] } },
  });
  const eligibleBadgeIds = badges
    .filter((badge) => eligibleCodes.includes(badge.code))
    .map((badge) => badge.id);
  const ineligibleBadgeIds = badges
    .filter((badge) => !eligibleCodes.includes(badge.code))
    .map((badge) => badge.id);

  await prisma.$transaction([
    prisma.userBadge.deleteMany({
      where: { userId, badgeId: { in: ineligibleBadgeIds } },
    }),
    prisma.userBadge.createMany({
      data: eligibleBadgeIds.map((badgeId) => ({ userId, badgeId })),
      skipDuplicates: true,
    }),
  ]);

  return prisma.userBadge.findMany({
    where: { userId, badgeId: { in: eligibleBadgeIds } },
    include: { badge: true },
    orderBy: { earnedAt: "asc" },
  });
}

export const evaluateAndAwardUserBadges = reconcileUserBadges;
