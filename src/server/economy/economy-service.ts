import {
  LedgerType,
  Prisma,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ECONOMY_POLICY,
  applyDailyAwardPolicy,
  nextStreakDays,
  tierForTotalXp,
  utcDayBounds,
} from "@/server/economy/economy-policy";

function activityRewardKey(activitySessionId: string) {
  return `activity:${activitySessionId}`;
}

async function findActivityRewardReceipt(activitySessionId: string) {
  const xpKey = activityRewardKey(activitySessionId);
  const hpKey = `${xpKey}:hp`;
  const [xpGrant, hpEntry] = await Promise.all([
    prisma.xPGrant.findUnique({ where: { idempotencyKey: xpKey } }),
    prisma.hPLedgerEntry.findUnique({ where: { idempotencyKey: hpKey } }),
  ]);
  if (!xpGrant) return null;
  const economy = await prisma.userEconomy.findUnique({
    where: { userId: xpGrant.userId },
  });
  return { xpGrant, hpEntry, economy, idempotentReplay: true as const };
}

async function runActivityAwardTransaction(activitySessionId: string) {
  const xpKey = activityRewardKey(activitySessionId);
  const hpKey = `${xpKey}:hp`;

  return prisma.$transaction(
    async (transaction) => {
      const existingGrant = await transaction.xPGrant.findUnique({
        where: { idempotencyKey: xpKey },
      });
      if (existingGrant) {
        const [hpEntry, economy] = await Promise.all([
          transaction.hPLedgerEntry.findUnique({ where: { idempotencyKey: hpKey } }),
          transaction.userEconomy.findUnique({ where: { userId: existingGrant.userId } }),
        ]);
        return { xpGrant: existingGrant, hpEntry, economy, idempotentReplay: true as const };
      }

      const activity = await transaction.activitySession.findUnique({
        where: { id: activitySessionId },
        include: {
          verificationResult: true,
          user: {
            include: {
              economy: true,
              settings: true,
            },
          },
        },
      });
      if (!activity) throw new Error("ACTIVITY_NOT_FOUND");
      if (
        activity.verificationStatus !== VerificationStatus.VERIFIED ||
        activity.verificationResult?.verificationStatus !== VerificationStatus.VERIFIED
      ) {
        throw new Error("ACTIVITY_NOT_ELIGIBLE");
      }

      const effectiveAt = activity.endTime ?? activity.startTime;
      const timezone = activity.user.settings?.timezone ?? "Asia/Jakarta";
      const bounds = utcDayBounds(effectiveAt, timezone);
      const [xpToday, hpToday] = await Promise.all([
        transaction.xPGrant.aggregate({
          where: {
            userId: activity.userId,
            effectiveAt: { gte: bounds.start, lt: bounds.end },
            type: {
              in: [LedgerType.XP_GRANT, LedgerType.XP_REVERSAL],
            },
          },
          _sum: { amount: true },
        }),
        transaction.hPLedgerEntry.aggregate({
          where: {
            userId: activity.userId,
            effectiveAt: { gte: bounds.start, lt: bounds.end },
            type: {
              in: [LedgerType.HP_GRANT, LedgerType.HP_REVERSAL],
            },
          },
          _sum: { amount: true },
        }),
      ]);

      const xpAward = applyDailyAwardPolicy(
        activity.verificationResult.eligibleXp,
        xpToday._sum.amount ?? 0,
        ECONOMY_POLICY.xp,
      );
      const hpAward = applyDailyAwardPolicy(
        activity.verificationResult.eligibleHp,
        hpToday._sum.amount ?? 0,
        ECONOMY_POLICY.hp,
      );
      const currentEconomy =
        activity.user.economy ??
        (await transaction.userEconomy.create({ data: { userId: activity.userId } }));
      const totalXp = currentEconomy.totalXp + xpAward.awardedAmount;
      const hpDebtPaid = Math.min(
        currentEconomy.hpDebt,
        hpAward.awardedAmount,
      );
      const hpBalanceIncrease = hpAward.awardedAmount - hpDebtPaid;
      const streakDays = nextStreakDays(
        currentEconomy.streakDays,
        currentEconomy.lastActiveDate,
        effectiveAt,
        timezone,
      );

      const xpGrant = await transaction.xPGrant.create({
        data: {
          userId: activity.userId,
          activitySessionId: activity.id,
          idempotencyKey: xpKey,
          type: LedgerType.XP_GRANT,
          amount: xpAward.awardedAmount,
          capApplied: xpAward.capApplied,
          diminishingApplied: xpAward.diminishingApplied,
          reason: "Verified activity reward",
          effectiveAt,
        },
      });
      const hpEntry = await transaction.hPLedgerEntry.create({
        data: {
          userId: activity.userId,
          activitySessionId: activity.id,
          idempotencyKey: hpKey,
          type: LedgerType.HP_GRANT,
          amount: hpAward.awardedAmount,
          capApplied: hpAward.capApplied,
          diminishingApplied: hpAward.diminishingApplied,
          description: "Verified activity reward",
          effectiveAt,
        },
      });
      const economy = await transaction.userEconomy.update({
        where: { userId: activity.userId },
        data: {
          totalXp,
          currentHp: { increment: hpBalanceIncrease },
          hpDebt: { decrement: hpDebtPaid },
          currentTier: tierForTotalXp(totalXp),
          streakDays,
          lastActiveDate: effectiveAt,
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

export async function awardVerifiedActivity(activitySessionId: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await runActivityAwardTransaction(activitySessionId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034")
      ) {
        const receipt = await findActivityRewardReceipt(activitySessionId);
        if (receipt) return receipt;
        if (error.code === "P2034" && attempt < 2) continue;
      }
      throw error;
    }
  }
  throw new Error("ECONOMY_TRANSACTION_RETRY_EXHAUSTED");
}
