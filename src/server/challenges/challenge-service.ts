import {
  ChallengeMetric,
  ChallengeTrustLevel,
  LedgerType,
  Prisma,
  RewardSource,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ECONOMY_FORMULA_VERSION } from "@/lib/economy-rules";
import { calendarDayKey, tierForTotalXp } from "@/server/economy/economy-policy";
import { creditActiveSeasonXp } from "@/server/leaderboard/season-service";
import { SEASON_TIMEZONE } from "@/server/leaderboard/season-policy";
import {
  applyChallengeProgress,
  challengeContributionAmount,
} from "@/server/challenges/challenge-policy";

async function runApplyVerifiedActivityToChallenges(activitySessionId: string) {
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

        const dayKey = challenge.metric === ChallengeMetric.ACTIVE_DAY_COUNT
          ? calendarDayKey(effectiveAt, SEASON_TIMEZONE)
          : null;
        const dayAlreadyCounted = dayKey
          ? await transaction.challengeContribution.findFirst({
              where: {
                challengeId: challenge.id,
                userId: activity.userId,
                dayKey,
                amount: { gt: 0 },
              },
              select: { id: true },
            })
          : null;
        const creditedAmount = dayAlreadyCounted ? 0 : amount;

        const next = applyChallengeProgress(
          progress.currentValue,
          creditedAmount,
          challenge.targetValue,
        );
        const contribution = await transaction.challengeContribution.create({
          data: {
            userId: activity.userId,
            challengeId: challenge.id,
            challengeProgressId: progress.id,
            activitySessionId: activity.id,
            amount: creditedAmount,
            dayKey,
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
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    },
  );
}

export async function applyVerifiedActivityToChallenges(activitySessionId: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await runApplyVerifiedActivityToChallenges(activitySessionId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034") &&
        attempt < 2
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("CHALLENGE_TRANSACTION_RETRY_EXHAUSTED");
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
      const trustedReward =
        progress.challenge.trustLevel === ChallengeTrustLevel.GPS_VERIFIED_ONLY;
      const xpAmount = trustedReward ? progress.challenge.bonusXp : 0;
      const hpAmount = trustedReward ? progress.challenge.bonusHp : 0;
      const currentEconomy =
        progress.user.economy ??
        (await transaction.userEconomy.create({ data: { userId: progress.userId } }));
      const totalXp = currentEconomy.totalXp + xpAmount;
      const hpDebtPaid = Math.min(
        currentEconomy.hpDebt,
        hpAmount,
      );
      const hpBalanceIncrease = hpAmount - hpDebtPaid;
      const versionSuffix =
        progress.claimVersion > 0 ? `:v${progress.claimVersion}` : "";

      const seasonCredit = await creditActiveSeasonXp(transaction, {
        userId: progress.userId,
        amount: xpAmount,
        effectiveAt: progress.completedAt,
        lifetimeTier: currentEconomy.currentTier,
        source: RewardSource.CHALLENGE,
      });

      const xpGrant = await transaction.xPGrant.create({
        data: {
          userId: progress.userId,
          challengeId: progress.challengeId,
          idempotencyKey: `${xpKey}${versionSuffix}`,
          type: LedgerType.XP_GRANT,
          amount: xpAmount,
          capApplied: false,
          diminishingApplied: false,
          reason: "Completed challenge reward",
          source: RewardSource.CHALLENGE,
          formulaVersion: ECONOMY_FORMULA_VERSION,
          seasonId: seasonCredit.seasonId,
          effectiveAt: progress.completedAt,
        },
      });
      const hpEntry = await transaction.hPLedgerEntry.create({
        data: {
          userId: progress.userId,
          challengeId: progress.challengeId,
          idempotencyKey: `${hpKey}${versionSuffix}`,
          type: LedgerType.HP_GRANT,
          amount: hpAmount,
          capApplied: false,
          diminishingApplied: false,
          description: "Completed challenge reward",
          source: RewardSource.CHALLENGE,
          formulaVersion: ECONOMY_FORMULA_VERSION,
          seasonId: seasonCredit.seasonId,
          effectiveAt: progress.completedAt,
        },
      });
      const economy = await transaction.userEconomy.update({
        where: { userId: progress.userId },
        data: {
          totalXp,
          currentHp: { increment: hpBalanceIncrease },
          hpDebt: { decrement: hpDebtPaid },
          currentTier: tierForTotalXp(totalXp),
        },
      });
      await transaction.challengeProgress.update({
        where: { id: progress.id },
        data: {
          claimedXpGrantId: xpGrant.id,
          claimedHpLedgerEntryId: hpEntry.id,
          rewardReversedAt: null,
        },
      });

      return { xpGrant, hpEntry, economy, idempotentReplay: false as const };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    },
  );
}
