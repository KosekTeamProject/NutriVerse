import {
  ActivityProcessingStatus,
  VerificationStatus,
} from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { verifyStoredActivity } from "@/server/activity/activity-service";
import { reconcileUserBadges } from "@/server/badges/badge-service";
import { applyVerifiedActivityToChallenges } from "@/server/challenges/challenge-service";
import { awardVerifiedActivity } from "@/server/economy/economy-service";
import { refreshDailyHealthPulse } from "@/server/health/health-pulse-service";

function processingErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message.slice(0, 1_000)
    : "UNKNOWN_ACTIVITY_PROCESSING_ERROR";
}

export async function reconcileActivityFinalization(activitySessionId: string) {
  const existing = await prisma.activitySession.findUnique({
    where: { id: activitySessionId },
    include: { verificationResult: true },
  });
  if (!existing) throw new Error("ACTIVITY_NOT_FOUND");
  if (!existing.endTime) throw new Error("ACTIVITY_NOT_FINISHED");

  const fullyCompleted =
    existing.processingStatus === ActivityProcessingStatus.COMPLETED &&
    existing.verificationResult &&
    (existing.verificationResult.verificationStatus !==
      VerificationStatus.VERIFIED ||
      (existing.rewardProcessedAt &&
        existing.challengeProcessedAt &&
        existing.badgeProcessedAt));
  if (fullyCompleted) {
    return {
      activity: existing,
      verification: existing.verificationResult,
      reward: null,
      challengeProgress: null,
      badges: null,
      idempotentReplay: true,
      processingInProgress: false,
    };
  }

  const leaseToken = randomUUID();
  const now = new Date();
  const lease = await prisma.activitySession.updateMany({
    where: {
      id: existing.id,
      OR: [
        { processingLeaseUntil: null },
        { processingLeaseUntil: { lt: now } },
      ],
    },
    data: {
      processingStatus: existing.verificationResult
        ? ActivityProcessingStatus.REWARDING
        : ActivityProcessingStatus.VERIFYING,
      processingAttempts: { increment: 1 },
      lastProcessingError: null,
      processingLeaseToken: leaseToken,
      processingLeaseUntil: new Date(now.getTime() + 2 * 60_000),
    },
  });
  if (!lease.count) {
    const activity = await prisma.activitySession.findUniqueOrThrow({
      where: { id: existing.id },
      include: { verificationResult: true },
    });
    return {
      activity,
      verification: activity.verificationResult,
      reward: null,
      challengeProgress: null,
      badges: null,
      idempotentReplay: true,
      processingInProgress: true,
    };
  }

  try {
    const verification =
      existing.verificationResult ??
      (await verifyStoredActivity(existing.id, {
        requireDeviceAttestation:
          process.env.REQUIRE_ACTIVITY_DEVICE_ATTESTATION === "true",
      }));
    let reward = null;
    let challengeProgress = null;
    let badges = null;

    if (verification.verificationStatus === VerificationStatus.VERIFIED) {
      await prisma.activitySession.update({
        where: { id: existing.id },
        data: { processingStatus: ActivityProcessingStatus.REWARDING },
      });

      reward = await awardVerifiedActivity(existing.id);
      await prisma.activitySession.update({
        where: { id: existing.id },
        data: { rewardProcessedAt: new Date() },
      });

      challengeProgress =
        await applyVerifiedActivityToChallenges(existing.id);
      await prisma.activitySession.update({
        where: { id: existing.id },
        data: { challengeProcessedAt: new Date() },
      });

      badges = await reconcileUserBadges(existing.userId);
      await prisma.activitySession.update({
        where: { id: existing.id },
        data: { badgeProcessedAt: new Date() },
      });
    }

    const activity = await prisma.activitySession.update({
      where: { id: existing.id },
      data: {
        processingStatus: ActivityProcessingStatus.COMPLETED,
        finalizedAt: new Date(),
        lastProcessingError: null,
        processingLeaseToken: null,
        processingLeaseUntil: null,
      },
      include: { verificationResult: true },
    });

    await refreshDailyHealthPulse({
      userId: existing.userId,
      occurredAt: activity.endTime ?? activity.startTime,
    }).catch((error: unknown) => {
      console.error("Health Pulse activity refresh failed", error);
    });

    return {
      activity,
      verification,
      reward,
      challengeProgress,
      badges,
      idempotentReplay: Boolean(existing.verificationResult),
      processingInProgress: false,
    };
  } catch (error) {
    await prisma.activitySession.updateMany({
      where: {
        id: existing.id,
        processingLeaseToken: leaseToken,
      },
      data: {
        processingStatus: ActivityProcessingStatus.FAILED,
        lastProcessingError: processingErrorMessage(error),
        processingLeaseToken: null,
        processingLeaseUntil: null,
      },
    });
    throw error;
  }
}
