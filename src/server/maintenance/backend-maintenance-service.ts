import {
  ActivityProcessingStatus,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { expireDueRedemptions } from "@/server/rewards/reward-service";
import { rebuildLeagueLeaderboardSnapshot } from "@/server/leaderboard/leaderboard-service";

const DAY_MS = 24 * 60 * 60 * 1_000;

export async function previewBackendMaintenance(now = new Date()) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      settings: { select: { rawGpsRetentionDays: true } },
    },
  });
  let rawGpsSamplesEligible = 0;
  for (const user of users) {
    const retentionDays = user.settings?.rawGpsRetentionDays ?? 30;
    rawGpsSamplesEligible += await prisma.telemetrySample.count({
      where: {
        activitySession: {
          is: {
            userId: user.id,
            endTime: {
              lt: new Date(now.getTime() - retentionDays * DAY_MS),
            },
          },
        },
      },
    });
  }
  const [
    expiredRateLimitBuckets,
    expiredNutritionCaches,
    staleDeviceTokens,
    staleActivities,
    expiredRedemptions,
    activeSeason,
  ] = await Promise.all([
    prisma.apiRateLimitBucket.count({
      where: { expiresAt: { lt: now } },
    }),
    prisma.nutritionSearchCache.count({
      where: { expiresAt: { lt: now } },
    }),
    prisma.userDeviceToken.count({
      where: {
        updatedAt: { lt: new Date(now.getTime() - 180 * DAY_MS) },
      },
    }),
    prisma.activitySession.count({
      where: {
        endTime: null,
        startTime: { lt: new Date(now.getTime() - DAY_MS) },
      },
    }),
    prisma.redemption.count({
      where: {
        status: "PENDING",
        expiresAt: { lte: now },
      },
    }),
    prisma.leaderboardSeason.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: { id: true, name: true },
      orderBy: { startDate: "desc" },
    }),
  ]);
  return {
    previewedAt: now,
    expiredRateLimitBuckets,
    expiredNutritionCaches,
    staleDeviceTokens,
    staleActivities,
    expiredRedemptions,
    rawGpsSamplesEligible,
    activeSeason,
  };
}

export async function closeStaleActivitySessions(
  userId?: string,
  now = new Date(),
) {
  const staleBefore = new Date(now.getTime() - DAY_MS);
  const sessions = await prisma.activitySession.findMany({
    where: {
      userId,
      endTime: null,
      startTime: { lt: staleBefore },
    },
    select: {
      id: true,
      startTime: true,
      updatedAt: true,
      _count: { select: { telemetrySamples: true } },
      telemetrySamples: {
        select: { timestamp: true },
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
    take: 250,
  });

  for (const session of sessions) {
    const candidateEnd =
      session.telemetrySamples[0]?.timestamp ?? session.updatedAt;
    const endTime =
      candidateEnd > session.startTime ? candidateEnd : session.startTime;
    const durationSeconds = Math.max(
      0,
      Math.min(
        24 * 60 * 60,
        Math.floor((endTime.getTime() - session.startTime.getTime()) / 1_000),
      ),
    );
    await prisma.$transaction([
      prisma.activitySession.update({
        where: { id: session.id },
        data: {
          endTime,
          durationSeconds,
          activeDurationSeconds: durationSeconds,
          verificationStatus: VerificationStatus.NOT_VERIFIED,
          processingStatus: ActivityProcessingStatus.FAILED,
          lastProcessingError:
            "Aktivitas ditutup otomatis karena tidak selesai dalam 24 jam.",
          finalizedAt: now,
        },
      }),
      prisma.verificationResult.upsert({
        where: { activitySessionId: session.id },
        create: {
          activitySessionId: session.id,
          verificationStatus: VerificationStatus.NOT_VERIFIED,
          reasonCodes: ["SESSION_TIMEOUT"],
          riskScore: 100,
          sampleCount: session._count.telemetrySamples,
          discardedSampleCount: session._count.telemetrySamples,
        },
        update: {
          verificationStatus: VerificationStatus.NOT_VERIFIED,
          reasonCodes: ["SESSION_TIMEOUT"],
          riskScore: 100,
          sampleCount: session._count.telemetrySamples,
          acceptedSampleCount: 0,
          discardedSampleCount: session._count.telemetrySamples,
          eligibleXp: 0,
          eligibleHp: 0,
          processedAt: now,
        },
      }),
    ]);
  }
  return { scanned: sessions.length, closed: sessions.length };
}

export async function purgeExpiredRawGps(now = new Date()) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      settings: { select: { rawGpsRetentionDays: true } },
    },
  });
  let deletedSamples = 0;
  let processedUsers = 0;
  for (const user of users) {
    const retentionDays = user.settings?.rawGpsRetentionDays ?? 30;
    const cutoff = new Date(now.getTime() - retentionDays * DAY_MS);
    const result = await prisma.telemetrySample.deleteMany({
      where: {
        activitySession: {
          is: {
            userId: user.id,
            endTime: { lt: cutoff },
          },
        },
      },
    });
    processedUsers += 1;
    deletedSamples += result.count;
  }
  return { processedUsers, deletedSamples };
}

export async function runBackendMaintenance(now = new Date()) {
  const [
    rateLimitBuckets,
    nutritionCaches,
    staleDeviceTokens,
    staleActivities,
    gpsRetention,
    redemptions,
    leaderboard,
  ] = await Promise.all([
    prisma.apiRateLimitBucket.deleteMany({
      where: { expiresAt: { lt: now } },
    }),
    prisma.nutritionSearchCache.deleteMany({
      where: { expiresAt: { lt: now } },
    }),
    prisma.userDeviceToken.deleteMany({
      where: {
        updatedAt: {
          lt: new Date(now.getTime() - 180 * DAY_MS),
        },
      },
    }),
    closeStaleActivitySessions(undefined, now),
    purgeExpiredRawGps(now),
    expireDueRedemptions(now),
    rebuildLeagueLeaderboardSnapshot(now),
  ]);
  return {
    completedAt: new Date(),
    rateLimitBucketsDeleted: rateLimitBuckets.count,
    nutritionCachesDeleted: nutritionCaches.count,
    staleDeviceTokensDeleted: staleDeviceTokens.count,
    staleActivities,
    gpsRetention,
    redemptions,
    leaderboard,
  };
}
