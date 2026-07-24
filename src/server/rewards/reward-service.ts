import { LedgerType, Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

async function runRedemption(
  userId: string,
  rewardId: string,
  idempotencyKey: string,
) {
  const ledgerKey = `reward:${userId}:${rewardId}:${idempotencyKey}`;
  return prisma.$transaction(
    async (transaction) => {
      const replay = await transaction.hPLedgerEntry.findUnique({
        where: { idempotencyKey: ledgerKey },
        include: { redemption: { include: { reward: true } } },
      });
      if (replay?.redemption) {
        return { redemption: replay.redemption, ledger: replay, idempotentReplay: true as const };
      }
      const [reward, economy] = await Promise.all([
        transaction.reward.findUnique({ where: { id: rewardId } }),
        transaction.userEconomy.findUnique({ where: { userId } }),
      ]);
      if (!reward || !reward.isActive || (reward.expiryDate && reward.expiryDate <= new Date())) {
        throw new Error("REWARD_NOT_AVAILABLE");
      }
      if (reward.stock <= 0) throw new Error("REWARD_OUT_OF_STOCK");
      if (!economy || economy.currentHp < reward.hpCost) throw new Error("INSUFFICIENT_HP");

      const stockUpdate = await transaction.reward.updateMany({
        where: { id: reward.id, stock: { gt: 0 } },
        data: { stock: { decrement: 1 } },
      });
      if (!stockUpdate.count) throw new Error("REWARD_OUT_OF_STOCK");
      const economyUpdate = await transaction.userEconomy.updateMany({
        where: { userId, currentHp: { gte: reward.hpCost } },
        data: { currentHp: { decrement: reward.hpCost } },
      });
      if (!economyUpdate.count) throw new Error("INSUFFICIENT_HP");

      const redemption = await transaction.redemption.create({
        data: {
          userId,
          rewardId: reward.id,
          hpSpent: reward.hpCost,
          redemptionCode: randomBytes(8).toString("hex").toUpperCase(),
        },
        include: { reward: true },
      });
      const ledger = await transaction.hPLedgerEntry.create({
        data: {
          userId,
          redemptionId: redemption.id,
          idempotencyKey: ledgerKey,
          type: LedgerType.HP_REDEEM,
          amount: -reward.hpCost,
          description: `Redeem reward: ${reward.title}`,
        },
      });
      return { redemption, ledger, idempotentReplay: false as const };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    },
  );
}

export async function redeemReward(
  userId: string,
  rewardId: string,
  idempotencyKey: string,
) {
  const ledgerKey = `reward:${userId}:${rewardId}:${idempotencyKey}`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await runRedemption(userId, rewardId, idempotencyKey);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034")
      ) {
        const replay = await prisma.hPLedgerEntry.findUnique({
          where: { idempotencyKey: ledgerKey },
          include: { redemption: { include: { reward: true } } },
        });
        if (replay?.redemption) {
          return {
            redemption: replay.redemption,
            ledger: replay,
            idempotentReplay: true as const,
          };
        }
        if (attempt < 2) continue;
      }
      throw error;
    }
  }
  throw new Error("REWARD_TRANSACTION_RETRY_EXHAUSTED");
}
