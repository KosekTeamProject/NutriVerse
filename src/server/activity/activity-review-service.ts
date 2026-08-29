import {
  ActivityProcessingStatus,
  ChallengeMetric,
  LedgerType,
  NotificationType,
  Prisma,
  RewardSource,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calendarDayKey,
  tierForTotalXp,
} from "@/server/economy/economy-policy";
import { createUserNotification } from "@/server/notifications/notification-service";

function streakSnapshot(
  activities: readonly { endTime: Date | null; startTime: Date }[],
  timezone: string,
) {
  const byDay = new Map<string, Date>();
  for (const activity of activities) {
    const effectiveAt = activity.endTime ?? activity.startTime;
    const key = calendarDayKey(effectiveAt, timezone);
    const current = byDay.get(key);
    if (!current || current < effectiveAt) byDay.set(key, effectiveAt);
  }
  const days = [...byDay.keys()].sort().reverse();
  if (!days.length) return { streakDays: 0, lastActiveDate: null };

  let streakDays = 1;
  for (let index = 1; index < days.length; index += 1) {
    const previous = new Date(`${days[index - 1]}T00:00:00.000Z`);
    const current = new Date(`${days[index]}T00:00:00.000Z`);
    const differenceDays = Math.round(
      (previous.getTime() - current.getTime()) / 86_400_000,
    );
    if (differenceDays !== 1) break;
    streakDays += 1;
  }
  return {
    streakDays,
    lastActiveDate: byDay.get(days[0]) ?? null,
  };
}

function rejectionReasonCodes(existing: readonly string[] | undefined) {
  return [...new Set([...(existing ?? []), "ADMIN_REJECTED"])];
}

export async function rejectActivityWithCompensation(input: {
  activitySessionId: string;
  adminUserId: string;
  reason: string;
}) {
  return prisma.$transaction(
    async (transaction) => {
      const activity = await transaction.activitySession.findUnique({
        where: { id: input.activitySessionId },
        include: {
          verificationResult: true,
          user: { include: { economy: true, settings: true } },
        },
      });
      if (!activity) throw new Error("ACTIVITY_NOT_FOUND");

      const beforeStatus = activity.verificationStatus;
      await transaction.activitySession.update({
        where: { id: activity.id },
        data: {
          verificationStatus: VerificationStatus.NOT_VERIFIED,
          processingStatus: ActivityProcessingStatus.COMPLETED,
          finalizedAt: new Date(),
        },
      });
      await transaction.verificationResult.updateMany({
        where: { activitySessionId: activity.id },
        data: {
          verificationStatus: VerificationStatus.NOT_VERIFIED,
          reasonCodes: rejectionReasonCodes(
            activity.verificationResult?.reasonCodes,
          ),
          processedAt: new Date(),
        },
      });

      const directXp = await transaction.xPGrant.findUnique({
        where: { idempotencyKey: `activity:${activity.id}` },
      });
      const directHp = await transaction.hPLedgerEntry.findUnique({
        where: { idempotencyKey: `activity:${activity.id}:hp` },
      });

      let xpToReverse = 0;
      let hpToReverse = 0;
      if (directXp && directXp.amount > 0) {
        const reversalKey = `activity:${activity.id}:reversal:xp`;
        const existingReversal = await transaction.xPGrant.findUnique({
          where: { idempotencyKey: reversalKey },
        });
        if (!existingReversal) {
          await transaction.xPGrant.create({
            data: {
              userId: activity.userId,
              activitySessionId: activity.id,
              idempotencyKey: reversalKey,
              type: LedgerType.XP_REVERSAL,
              amount: -directXp.amount,
              reason: `Activity review reversal: ${input.reason}`,
              source: RewardSource.REVERSAL,
              formulaVersion: directXp.formulaVersion,
              seasonId: directXp.seasonId,
              effectiveAt: directXp.effectiveAt,
            },
          });
          xpToReverse += directXp.amount;
        }
      }
      if (directHp && directHp.amount > 0) {
        const reversalKey = `activity:${activity.id}:reversal:hp`;
        const existingReversal = await transaction.hPLedgerEntry.findUnique({
          where: { idempotencyKey: reversalKey },
        });
        if (!existingReversal) {
          await transaction.hPLedgerEntry.create({
            data: {
              userId: activity.userId,
              activitySessionId: activity.id,
              idempotencyKey: reversalKey,
              type: LedgerType.HP_REVERSAL,
              amount: -directHp.amount,
              description: `Activity review reversal: ${input.reason}`,
              source: RewardSource.REVERSAL,
              formulaVersion: directHp.formulaVersion,
              seasonId: directHp.seasonId,
              effectiveAt: directHp.effectiveAt,
            },
          });
          hpToReverse += directHp.amount;
        }
      }

      const contributions = await transaction.challengeContribution.findMany({
        where: { activitySessionId: activity.id },
        include: {
          challengeProgress: {
            include: {
              challenge: true,
              claimedXpGrant: true,
              claimedHpLedgerEntry: true,
            },
          },
        },
      });
      const progressById = new Map(
        contributions.map((item) => [
          item.challengeProgressId,
          item.challengeProgress,
        ]),
      );
      await transaction.challengeContribution.deleteMany({
        where: { activitySessionId: activity.id },
      });

      for (const progress of progressById.values()) {
        const remaining = await transaction.challengeContribution.findMany({
          where: { challengeProgressId: progress.id },
          select: { amount: true, dayKey: true, createdAt: true },
        });
        const remainingValue = progress.challenge.metric === ChallengeMetric.ACTIVE_DAY_COUNT
          ? new Set(remaining.map((item) => item.dayKey).filter(Boolean)).size
          : remaining.reduce((sum, item) => sum + item.amount, 0);
        const currentValue = Math.min(
          progress.challenge.targetValue,
          remainingValue,
        );
        const isCompleted =
          currentValue >= progress.challenge.targetValue;
        const rewardMustBeReversed =
          !isCompleted &&
          !progress.rewardReversedAt &&
          (progress.claimedXpGrant || progress.claimedHpLedgerEntry);

        if (rewardMustBeReversed) {
          if (
            progress.claimedXpGrant &&
            progress.claimedXpGrant.amount > 0
          ) {
            await transaction.xPGrant.create({
              data: {
                userId: progress.userId,
                challengeId: progress.challengeId,
                idempotencyKey: `challenge:${progress.id}:reversal:xp:v${progress.claimVersion}`,
                type: LedgerType.XP_REVERSAL,
                amount: -progress.claimedXpGrant.amount,
                reason: `Challenge reward reversed after activity review: ${input.reason}`,
                source: RewardSource.REVERSAL,
                formulaVersion: progress.claimedXpGrant.formulaVersion,
                seasonId: progress.claimedXpGrant.seasonId,
                effectiveAt: progress.claimedXpGrant.effectiveAt,
              },
            });
            xpToReverse += progress.claimedXpGrant.amount;
          }
          if (
            progress.claimedHpLedgerEntry &&
            progress.claimedHpLedgerEntry.amount > 0
          ) {
            await transaction.hPLedgerEntry.create({
              data: {
                userId: progress.userId,
                challengeId: progress.challengeId,
                idempotencyKey: `challenge:${progress.id}:reversal:hp:v${progress.claimVersion}`,
                type: LedgerType.HP_REVERSAL,
                amount: -progress.claimedHpLedgerEntry.amount,
                description: `Challenge reward reversed after activity review: ${input.reason}`,
                source: RewardSource.REVERSAL,
                formulaVersion: progress.claimedHpLedgerEntry.formulaVersion,
                seasonId: progress.claimedHpLedgerEntry.seasonId,
                effectiveAt:
                  progress.claimedHpLedgerEntry.effectiveAt,
              },
            });
            hpToReverse += progress.claimedHpLedgerEntry.amount;
          }
        }

        await transaction.challengeProgress.update({
          where: { id: progress.id },
          data: {
            currentValue,
            isCompleted,
            completedAt: isCompleted ? progress.completedAt : null,
            lastContributedAt: remaining.reduce<Date | null>((latest, item) => !latest || item.createdAt > latest ? item.createdAt : latest, null),
            ...(rewardMustBeReversed
              ? {
                  claimedXpGrantId: null,
                  claimedHpLedgerEntryId: null,
                  rewardReversedAt: new Date(),
                  claimVersion: { increment: 1 },
                }
              : {}),
          },
        });
      }

      const currentEconomy =
        activity.user.economy ??
        (await transaction.userEconomy.create({
          data: { userId: activity.userId },
        }));
      const currentHpAfterReversal = Math.max(
        0,
        currentEconomy.currentHp - hpToReverse,
      );
      const addedDebt = Math.max(
        0,
        hpToReverse - currentEconomy.currentHp,
      );
      const totalXp = Math.max(
        0,
        currentEconomy.totalXp - xpToReverse,
      );
      const verifiedActivities = await transaction.activitySession.findMany({
        where: {
          userId: activity.userId,
          verificationStatus: VerificationStatus.VERIFIED,
        },
        select: { startTime: true, endTime: true },
        orderBy: { endTime: "desc" },
      });
      const streak = streakSnapshot(
        verifiedActivities,
        activity.user.settings?.timezone ?? "Asia/Jakarta",
      );
      const economy = await transaction.userEconomy.update({
        where: { userId: activity.userId },
        data: {
          totalXp,
          currentTier: tierForTotalXp(totalXp),
          currentHp: currentHpAfterReversal,
          hpDebt: { increment: addedDebt },
          streakDays: streak.streakDays,
          lastActiveDate: streak.lastActiveDate,
        },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: input.adminUserId,
          action: "REJECT_ACTIVITY_AND_REVERSE_REWARDS",
          entityName: "ActivitySession",
          entityId: activity.id,
          beforeState: { verificationStatus: beforeStatus },
          afterState: {
            verificationStatus: VerificationStatus.NOT_VERIFIED,
            xpReversed: xpToReverse,
            hpReversed: hpToReverse,
            hpDebtAdded: addedDebt,
          },
          reason: input.reason,
        },
      });
      await createUserNotification(
        {
          userId: activity.userId,
          type: NotificationType.CHEAT_ALERT,
          title: "Hasil review aktivitas",
          message:
            "Aktivitas tidak lolos verifikasi setelah review. Reward terkait telah disesuaikan dan kamu dapat mengajukan banding.",
          respectPreferences: false,
          requiresAction: true,
          actionUrl: `/aktivitas/${activity.id}`,
          actionKey: `activity-appeal:${activity.id}`,
          dedupeKey: `activity-review-rejected:${activity.id}`,
        },
        transaction,
      );

      return {
        activityId: activity.id,
        userId: activity.userId,
        economy,
        xpReversed: xpToReverse,
        hpReversed: hpToReverse,
        hpDebtAdded: addedDebt,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 30_000,
    },
  );
}

export async function approveActivityReview(input: {
  activitySessionId: string;
  adminUserId: string;
  reason: string;
}) {
  return prisma.$transaction(
    async (transaction) => {
      const activity = await transaction.activitySession.findUnique({
        where: { id: input.activitySessionId },
        include: {
          verificationResult: true,
          user: { include: { economy: true } },
        },
      });
      if (!activity) throw new Error("ACTIVITY_NOT_FOUND");
      if (!activity.verificationResult) {
        throw new Error("ACTIVITY_VERIFICATION_NOT_FOUND");
      }

      const reversalXp = await transaction.xPGrant.findUnique({
        where: {
          idempotencyKey: `activity:${activity.id}:reversal:xp`,
        },
      });
      const reinstatementKey = `activity:${activity.id}:reinstatement:xp`;
      const existingReinstatement = await transaction.xPGrant.findUnique({
        where: { idempotencyKey: reinstatementKey },
      });
      let reinstatedXp = 0;
      let reinstatedHp = 0;

      if (reversalXp && !existingReinstatement) {
        const originalXp = await transaction.xPGrant.findUnique({
          where: { idempotencyKey: `activity:${activity.id}` },
        });
        const originalHp = await transaction.hPLedgerEntry.findUnique({
          where: { idempotencyKey: `activity:${activity.id}:hp` },
        });
        if (originalXp && originalXp.amount > 0) {
          await transaction.xPGrant.create({
            data: {
              userId: activity.userId,
              activitySessionId: activity.id,
              idempotencyKey: reinstatementKey,
              type: LedgerType.XP_GRANT,
              amount: originalXp.amount,
              reason: `Activity reward reinstated: ${input.reason}`,
              source: RewardSource.ACTIVITY,
              formulaVersion: originalXp.formulaVersion,
              seasonId: originalXp.seasonId,
              effectiveAt: originalXp.effectiveAt,
            },
          });
          reinstatedXp = originalXp.amount;
        }
        if (originalHp && originalHp.amount > 0) {
          await transaction.hPLedgerEntry.create({
            data: {
              userId: activity.userId,
              activitySessionId: activity.id,
              idempotencyKey: `activity:${activity.id}:reinstatement:hp`,
              type: LedgerType.HP_GRANT,
              amount: originalHp.amount,
              description: `Activity reward reinstated: ${input.reason}`,
              source: RewardSource.ACTIVITY,
              formulaVersion: originalHp.formulaVersion,
              seasonId: originalHp.seasonId,
              effectiveAt: originalHp.effectiveAt,
            },
          });
          reinstatedHp = originalHp.amount;
        }

        const economy =
          activity.user.economy ??
          (await transaction.userEconomy.create({
            data: { userId: activity.userId },
          }));
        const debtPaid = Math.min(economy.hpDebt, reinstatedHp);
        const totalXp = economy.totalXp + reinstatedXp;
        await transaction.userEconomy.update({
          where: { userId: activity.userId },
          data: {
            totalXp,
            currentTier: tierForTotalXp(totalXp),
            currentHp: { increment: reinstatedHp - debtPaid },
            hpDebt: { decrement: debtPaid },
          },
        });
      }

      const updated = await transaction.activitySession.update({
        where: { id: activity.id },
        data: {
          verificationStatus: VerificationStatus.VERIFIED,
          processingStatus: ActivityProcessingStatus.REWARDING,
          lastProcessingError: null,
        },
      });
      await transaction.verificationResult.update({
        where: { activitySessionId: activity.id },
        data: {
          verificationStatus: VerificationStatus.VERIFIED,
          processedAt: new Date(),
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: input.adminUserId,
          action: "APPROVE_ACTIVITY",
          entityName: "ActivitySession",
          entityId: activity.id,
          beforeState: {
            verificationStatus: activity.verificationStatus,
          },
          afterState: {
            verificationStatus: VerificationStatus.VERIFIED,
            reinstatedXp,
            reinstatedHp,
          },
          reason: input.reason,
        },
      });
      await createUserNotification(
        {
          userId: activity.userId,
          type: NotificationType.ACTIVITY,
          title: "Aktivitas disetujui",
          message:
            "Aktivitasmu telah disetujui setelah review dan reward sedang direkonsiliasi.",
          respectPreferences: false,
          actionUrl: `/aktivitas/${activity.id}`,
          dedupeKey: `activity-review-approved:${activity.id}`,
        },
        transaction,
      );
      return updated;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    },
  );
}
