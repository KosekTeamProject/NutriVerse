import { EventRegistrationStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { badgeProgress, type BadgeEvaluationSnapshot } from "@/server/badges/badge-policy";

async function badgeSnapshot(userId: string): Promise<BadgeEvaluationSnapshot> {
  const [activity, economy, completedChallengeCount, attendedEventCount] =
    await Promise.all([
      prisma.activitySession.aggregate({
        where: { userId, verificationStatus: VerificationStatus.VERIFIED },
        _count: { id: true },
        _sum: { distanceMeters: true },
      }),
      prisma.userEconomy.findUnique({ where: { userId } }),
      prisma.challengeProgress.count({ where: { userId, isCompleted: true } }),
      prisma.eventRegistration.count({
        where: { userId, status: EventRegistrationStatus.ATTENDED },
      }),
    ]);
  return {
    verifiedActivityCount: activity._count.id,
    streakDays: economy?.streakDays ?? 0,
    verifiedDistanceMeters: activity._sum.distanceMeters ?? 0,
    completedChallengeCount,
    attendedEventCount,
  };
}

export async function getUserBadgeGallery(userId: string) {
  const [snapshot, badges] = await Promise.all([
    badgeSnapshot(userId),
    prisma.badge.findMany({
      include: {
        userBadges: {
          where: { userId },
          select: { id: true, earnedAt: true },
        },
      },
      orderBy: [{ targetValue: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  return badges.map(({ userBadges, ...badge }) => {
    const earnedAt = userBadges[0]?.earnedAt ?? null;
    const progress = badgeProgress(badge.criteriaKey, badge.targetValue, snapshot);
    return {
      ...badge,
      earned: Boolean(earnedAt),
      earnedAt,
      progress: earnedAt
        ? { ...progress, current: progress.target, percentage: 100, eligible: true }
        : progress,
    };
  });
}

export async function reconcileUserBadges(userId: string) {
  const gallery = await getUserBadgeGallery(userId);
  const eligibleBadgeIds = gallery
    .filter((badge) => badge.progress.eligible)
    .map((badge) => badge.id);

  if (eligibleBadgeIds.length) {
    await prisma.userBadge.createMany({
      data: eligibleBadgeIds.map((badgeId) => ({ userId, badgeId })),
      skipDuplicates: true,
    });
  }

  return prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: "asc" },
  });
}

export const evaluateAndAwardUserBadges = reconcileUserBadges;
