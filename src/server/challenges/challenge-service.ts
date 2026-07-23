import {
  ChallengeTrustLevel,
  LedgerType,
  Prisma,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ECONOMY_POLICY,
  applyDailyAwardPolicy,
  tierForTotalXp,
  utcDayBounds,
} from "@/server/economy/economy-policy";
import {
  applyChallengeProgress,
  challengeContributionAmount,
} from "@/server/challenges/challenge-policy";

export async function applyVerifiedActivityToChallenges(activitySessionId: string) {
  return prisma.$transaction(
    async (transaction) => {
      const activity = await transaction.activitySession.findUnique({
        where: { id: activitySessionId },
        include: { verificationResult: true },
      });
      if (!activity) throw new Error("ACTIVITY_NOT_FOUND");
      if (
        activity.verificationStatus !== VerificationStatus.VERIFIED ||
        activity.verificationResult?.verificationStatus !== VerificationStatus.VERIFIED
      ) {
        throw new Error("ACTIVITY_NOT_ELIGIBLE");
      }

      const effectiveAt = activity.endTime ?? activity.startTime;
      const challenges = await transaction.challenge.findMany({
        where: {
          isActive: true,
          trustLevel: ChallengeTrustLevel.GPS_VERIFIED_ONLY,
          startDate: { lte: effectiveAt },
          endDate: { gte: effectiveAt },
          OR: [{ activityType: null }, { activityType: activity.activityType }],
        },
        orderBy: { startDate: "asc" },
      });

      const results = [];
      for (const challenge of challenges) {
        const amount = challengeContributionAmount(challenge.metric, {
          trustedDistanceMeters: activity.verificationResult.trustedDistanceMeters,
          trustedDurationSeconds: activity.verificationResult.trustedDurationSeconds,
        });
        if (amount <= 0) continue;

        const progress = await transaction.challengeProgress.upsert({
          where: {
            userId_challengeId: {
              userId: activity.userId,
              challengeId: challenge.id,
            },
          },
          create: {
            userId: activity.userId,
            challengeId: challenge.id,
          },
          update: {},
        });
        const existingContribution = await transaction.challengeContribution.findUnique({
          where: {
            challengeId_userId_activitySessionId: {
              challengeId: challenge.id,
              userId: activity.userId,
              activitySessionId: activity.id,
            },
          },
        });
        if (existingContribution) {
          results.push({ challenge, progress, contribution: existingContribution, replay: true });
          continue;
        }

        const next = applyChallengeProgress(
          progress.currentValue,
          amount,
          challenge.targetValue,
        );
        const contribution = await transaction.challengeContribution.create({
          data: {
            userId: activity.userId,
            challengeId: challenge.id,
            challengeProgressId: progress.id,
            activitySessionId: activity.id,
            amount,
          },
        });
        const updatedProgress = await transaction.challengeProgress.update({
          where: { id: progress.id },
          data: {
            currentValue: next.currentValue,
            isCompleted: next.isCompleted,
            completedAt: next.isCompleted ? progress.completedAt ?? effectiveAt : null,
            lastContributedAt: effectiveAt,
          },
        });
        results.push({
          challenge,
          progress: updatedProgress,
          contribution,
          replay: false,
        });
      }
      return results;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function claimChallengeReward(challengeProgressId: string) {
  return prisma.$transaction(
    async (transaction) => {
      const progress = await transaction.challengeProgress.findUnique({
        where: { id: challengeProgressId },
        include: {
          challenge: true,
          user: { include: { economy: true, settings: true } },
          claimedXpGrant: true,
          claimedHpLedgerEntry: true,
        },
      });
      if (!progress) throw new Error("CHALLENGE_PROGRESS_NOT_FOUND");
      if (!progress.isCompleted || !progress.completedAt) {
        throw new Error("CHALLENGE_NOT_COMPLETED");
      }
      if (progress.claimedXpGrant) {
        return {
          xpGrant: progress.claimedXpGrant,
          hpEntry: progress.claimedHpLedgerEntry,
          economy: progress.user.economy,
          idempotentReplay: true as const,
        };
      }

      const xpKey = `challenge:${progress.id}:xp`;
      const hpKey = `challenge:${progress.id}:hp`;
      const timezone = progress.user.settings?.timezone ?? "Asia/Jakarta";
      const bounds = utcDayBounds(progress.completedAt, timezone);
      const [xpToday, hpToday] = await Promise.all([
        transaction.xPGrant.aggregate({
          where: {
            userId: progress.userId,
            effectiveAt: { gte: bounds.start, lt: bounds.end },
            amount: { gt: 0 },
          },
          _sum: { amount: true },
        }),
        transaction.hPLedgerEntry.aggregate({
          where: {
            userId: progress.userId,
            effectiveAt: { gte: bounds.start, lt: bounds.end },
            type: LedgerType.HP_GRANT,
            amount: { gt: 0 },
          },
          _sum: { amount: true },
        }),
      ]);

      const trustedReward =
        progress.challenge.trustLevel === ChallengeTrustLevel.GPS_VERIFIED_ONLY;
      const xpAward = applyDailyAwardPolicy(
        trustedReward ? progress.challenge.bonusXp : 0,
        xpToday._sum.amount ?? 0,
        ECONOMY_POLICY.xp,
      );
      const hpAward = applyDailyAwardPolicy(
        trustedReward ? progress.challenge.bonusHp : 0,
        hpToday._sum.amount ?? 0,
        ECONOMY_POLICY.hp,
      );
      const currentEconomy =
        progress.user.economy ??
        (await transaction.userEconomy.create({ data: { userId: progress.userId } }));
      const totalXp = currentEconomy.totalXp + xpAward.awardedAmount;

      const xpGrant = await transaction.xPGrant.create({
        data: {
          userId: progress.userId,
          challengeId: progress.challengeId,
          idempotencyKey: xpKey,
          amount: xpAward.awardedAmount,
          capApplied: xpAward.capApplied,
          diminishingApplied: xpAward.diminishingApplied,
          reason: "Completed challenge reward",
          effectiveAt: progress.completedAt,
        },
      });
      const hpEntry = await transaction.hPLedgerEntry.create({
        data: {
          userId: progress.userId,
          challengeId: progress.challengeId,
          idempotencyKey: hpKey,
          type: LedgerType.HP_GRANT,
          amount: hpAward.awardedAmount,
          capApplied: hpAward.capApplied,
          diminishingApplied: hpAward.diminishingApplied,
          description: "Completed challenge reward",
          effectiveAt: progress.completedAt,
        },
      });
      const economy = await transaction.userEconomy.update({
        where: { userId: progress.userId },
        data: {
          totalXp,
          currentHp: { increment: hpAward.awardedAmount },
          currentTier: tierForTotalXp(totalXp),
        },
      });
      await transaction.challengeProgress.update({
        where: { id: progress.id },
        data: {
          claimedXpGrantId: xpGrant.id,
          claimedHpLedgerEntryId: hpEntry.id,
        },
      });

      return { xpGrant, hpEntry, economy, idempotentReplay: false as const };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
