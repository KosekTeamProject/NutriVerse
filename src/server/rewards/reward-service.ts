import {
  LedgerType,
  NotificationType,
  Prisma,
  RedemptionStatus,
  RewardSource,
} from "@prisma/client";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createUserNotification } from "@/server/notifications/notification-service";

const REDEMPTION_VALIDITY_MS = 30 * 24 * 60 * 60 * 1_000;

function redemptionExpiry(rewardExpiry: Date | null) {
  const standardExpiry = new Date(Date.now() + REDEMPTION_VALIDITY_MS);
  return rewardExpiry && rewardExpiry < standardExpiry
    ? rewardExpiry
    : standardExpiry;
}

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
          expiresAt: redemptionExpiry(reward.expiryDate),
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
          source: RewardSource.REDEMPTION,
          formulaVersion: "reward-store-v1",
        },
      });
      await createUserNotification(
        {
          userId,
          type: NotificationType.REWARD,
          title: "Reward berhasil ditukar",
          message: `${reward.title} sedang menunggu proses fulfillment.`,
          respectPreferences: false,
          actionUrl: "/reward",
          dedupeKey: `reward-redemption-created:${redemption.id}`,
        },
        transaction,
      );
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

type RefundRedemptionInput = {
  redemptionId: string;
  reason: string;
  status: "CANCELLED" | "EXPIRED";
  actorUserId?: string;
  ownerUserId?: string;
};

async function refundRedemption(input: RefundRedemptionInput) {
  return prisma.$transaction(
    async (transaction) => {
      const redemption = await transaction.redemption.findUnique({
        where: { id: input.redemptionId },
        include: { reward: true },
      });
      if (!redemption) throw new Error("REDEMPTION_NOT_FOUND");
      if (input.ownerUserId && redemption.userId !== input.ownerUserId) {
        throw new Error("REDEMPTION_NOT_FOUND");
      }
      if (redemption.status === input.status) {
        return { redemption, idempotentReplay: true as const };
      }
      if (redemption.status !== RedemptionStatus.PENDING) {
        throw new Error("REDEMPTION_ALREADY_FINAL");
      }

      const ledgerKey = `reward-refund:${redemption.id}`;
      const existingRefund = await transaction.hPLedgerEntry.findUnique({
        where: { idempotencyKey: ledgerKey },
      });
      if (!existingRefund) {
        const economy = await transaction.userEconomy.findUnique({
          where: { userId: redemption.userId },
        });
        if (!economy) throw new Error("ECONOMY_NOT_FOUND");
        const debtRepaid = Math.min(economy.hpDebt, redemption.hpSpent);
        const balanceCredit = redemption.hpSpent - debtRepaid;
        await transaction.userEconomy.update({
          where: { userId: redemption.userId },
          data: {
            hpDebt: { decrement: debtRepaid },
            currentHp: { increment: balanceCredit },
          },
        });
        await transaction.hPLedgerEntry.create({
          data: {
            userId: redemption.userId,
            redemptionId: redemption.id,
            idempotencyKey: ledgerKey,
            type: LedgerType.HP_REFUND,
            amount: redemption.hpSpent,
            description: `Refund reward: ${redemption.reward.title}`,
            source: RewardSource.REFUND,
            formulaVersion: "reward-store-v1",
          },
        });
        await transaction.reward.update({
          where: { id: redemption.rewardId },
          data: { stock: { increment: 1 } },
        });
      }

      const updated = await transaction.redemption.update({
        where: { id: redemption.id },
        data: {
          status: input.status,
          statusReason: input.reason,
          cancelledAt:
            input.status === RedemptionStatus.CANCELLED ? new Date() : null,
        },
        include: { reward: true },
      });
      if (input.actorUserId) {
        await transaction.auditLog.create({
          data: {
            actorUserId: input.actorUserId,
            action:
              input.status === RedemptionStatus.CANCELLED
                ? "CANCEL_REDEMPTION"
                : "EXPIRE_REDEMPTION",
            entityName: "Redemption",
            entityId: redemption.id,
            beforeState: { status: redemption.status },
            afterState: {
              status: updated.status,
              hpRefunded: redemption.hpSpent,
            },
            reason: input.reason,
          },
        });
      }
      await createUserNotification(
        {
          userId: redemption.userId,
          type: NotificationType.REWARD,
          title:
            input.status === RedemptionStatus.CANCELLED
              ? "Penukaran dibatalkan"
              : "Penukaran kedaluwarsa",
          message: `${redemption.reward.title} dibatalkan dan ${redemption.hpSpent} HP telah dikembalikan.`,
          respectPreferences: false,
          actionUrl: "/reward",
          dedupeKey: `reward-redemption-${input.status.toLowerCase()}:${redemption.id}`,
        },
        transaction,
      );
      return { redemption: updated, idempotentReplay: false as const };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    },
  );
}

export function cancelRedemption(input: {
  redemptionId: string;
  reason: string;
  actorUserId?: string;
  ownerUserId?: string;
}) {
  return refundRedemption({
    ...input,
    status: RedemptionStatus.CANCELLED,
  });
}

export function expireRedemption(
  redemptionId: string,
  reason: string,
  actorUserId?: string,
) {
  return refundRedemption({
    redemptionId,
    reason,
    actorUserId,
    status: RedemptionStatus.EXPIRED,
  });
}

export async function fulfillRedemption(input: {
  redemptionId: string;
  actorUserId: string;
  fulfillmentReference: string;
  reason: string;
}) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.redemption.findUnique({
      where: { id: input.redemptionId },
      include: { reward: true },
    });
    if (!existing) throw new Error("REDEMPTION_NOT_FOUND");
    if (existing.status === RedemptionStatus.FULFILLED) {
      return { redemption: existing, idempotentReplay: true as const };
    }
    if (existing.status !== RedemptionStatus.PENDING) {
      throw new Error("REDEMPTION_ALREADY_FINAL");
    }
    if (existing.expiresAt && existing.expiresAt <= new Date()) {
      throw new Error("REDEMPTION_EXPIRED");
    }
    const redemption = await transaction.redemption.update({
      where: { id: existing.id },
      data: {
        status: RedemptionStatus.FULFILLED,
        fulfilledAt: new Date(),
        fulfillmentReference: input.fulfillmentReference,
        statusReason: input.reason,
      },
      include: { reward: true },
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: "FULFILL_REDEMPTION",
        entityName: "Redemption",
        entityId: existing.id,
        beforeState: { status: existing.status },
        afterState: {
          status: redemption.status,
          fulfillmentReference: input.fulfillmentReference,
        },
        reason: input.reason,
      },
    });
    await createUserNotification(
      {
        userId: existing.userId,
        type: NotificationType.REWARD,
        title: "Reward telah dipenuhi",
        message: `${existing.reward.title} telah selesai diproses. Referensi: ${input.fulfillmentReference}.`,
        respectPreferences: false,
        actionUrl: "/reward",
        dedupeKey: `reward-redemption-fulfilled:${redemption.id}`,
      },
      transaction,
    );
    return { redemption, idempotentReplay: false as const };
  });
}

export async function expireDueRedemptions(now = new Date(), limit = 100) {
  const due = await prisma.redemption.findMany({
    where: {
      status: RedemptionStatus.PENDING,
      expiresAt: { lte: now },
    },
    select: { id: true },
    orderBy: { expiresAt: "asc" },
    take: Math.max(1, Math.min(limit, 500)),
  });
  let expired = 0;
  for (const redemption of due) {
    const result = await expireRedemption(
      redemption.id,
      "Masa berlaku penukaran telah berakhir.",
    );
    if (!result.idempotentReplay) expired += 1;
  }
  return { scanned: due.length, expired };
}
