import "dotenv/config";
import { randomUUID } from "node:crypto";
import { ActivityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyStoredActivity } from "@/server/activity/activity-service";
import { evaluateAndAwardUserBadges } from "@/server/badges/badge-service";
import { applyVerifiedActivityToChallenges } from "@/server/challenges/challenge-service";
import { awardVerifiedActivity } from "@/server/economy/economy-service";
import { redeemReward } from "@/server/rewards/reward-service";

const runId = randomUUID();
const email = `integration-${runId}@example.invalid`;
const rewardId = `integration-reward-${runId}`;

async function main() {
  const user = await prisma.user.create({
    data: {
      email,
      name: "Integration Test",
      economy: { create: { currentHp: 100 } },
      settings: { create: {} },
      healthProfile: { create: {} },
      companionPreference: { create: {} },
    },
  });
  try {
    const startTime = new Date(Date.now() - 120_000);
    const endTime = new Date();
    const activity = await prisma.activitySession.create({
      data: {
        userId: user.id,
        clientSessionId: runId,
        activityType: ActivityType.WALK,
        startTime,
        endTime,
        telemetrySamples: {
          create: Array.from({ length: 5 }, (_, index) => ({
            sequenceNumber: index,
            timestamp: new Date(startTime.getTime() + index * 30_000),
            latitude: -6.9147 + index * 0.0002,
            longitude: 107.6098,
            accuracy: 5,
            speed: 1.2,
          })),
        },
      },
    });
    const verification = await verifyStoredActivity(activity.id);
    if (verification.verificationStatus !== "VERIFIED") {
      throw new Error(`Expected VERIFIED, received ${verification.verificationStatus}`);
    }
    const [firstAward, replayAward] = await Promise.all([
      awardVerifiedActivity(activity.id),
      awardVerifiedActivity(activity.id),
    ]);
    if (firstAward.xpGrant.id !== replayAward.xpGrant.id) {
      throw new Error("Activity reward idempotency failed");
    }
    await Promise.all([
      applyVerifiedActivityToChallenges(activity.id),
      applyVerifiedActivityToChallenges(activity.id),
    ]);
    const badges = await evaluateAndAwardUserBadges(user.id);
    if (!badges.some((entry) => entry.badge.code === "FIRST_STEP")) {
      throw new Error("Automatic badge award failed");
    }

    await prisma.reward.create({
      data: {
        id: rewardId,
        title: "Integration Reward",
        description: "Temporary integration test reward",
        partnerName: "NutriVerse",
        imageUrl: "/brand/nutriverse-mark.svg",
        hpCost: 5,
        stock: 1,
      },
    });
    const [firstRedemption, replayRedemption] = await Promise.all([
      redeemReward(user.id, rewardId, runId),
      redeemReward(user.id, rewardId, runId),
    ]);
    if (
      firstRedemption.redemption.id !== replayRedemption.redemption.id
    ) {
      throw new Error("Reward redemption idempotency failed");
    }
    const reward = await prisma.reward.findUniqueOrThrow({ where: { id: rewardId } });
    if (reward.stock !== 0) throw new Error("Reward stock was not decremented exactly once");

    console.log(JSON.stringify({
      success: true,
      verification: verification.verificationStatus,
      xpAwarded: firstAward.xpGrant.amount,
      activityReplayProtected: firstAward.idempotentReplay || replayAward.idempotentReplay,
      challengeContributionsProcessed: true,
      firstStepBadgeAwarded: true,
      rewardReplayProtected: firstRedemption.idempotentReplay || replayRedemption.idempotentReplay,
      finalRewardStock: reward.stock,
    }, null, 2));
  } finally {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.reward.deleteMany({ where: { id: rewardId } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
