import {
  EventRegistrationStatus,
  LedgerType,
  NotificationType,
  Prisma,
  RewardSource,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createUserNotification } from "@/server/notifications/notification-service";

const PLACEMENTS = [1, 2, 3] as const;

export async function finalizeEventRewards(input: {
  eventId: string;
  adminUserId: string;
  winnerUserIds: readonly [string, string, string];
}) {
  return prisma.$transaction(
    async (transaction) => {
      const event = await transaction.event.findUnique({
        where: { id: input.eventId },
        include: {
          registrations: {
            where: { status: EventRegistrationStatus.ATTENDED },
            include: { user: { select: { name: true } } },
          },
        },
      });
      if (!event) throw new Error("EVENT_NOT_FOUND");
      if (event.resultsFinalizedAt) {
        return { event, idempotentReplay: true as const };
      }
      if (event.endDate > new Date()) throw new Error("EVENT_NOT_FINISHED");
      if (event.registrations.length < 3) throw new Error("EVENT_NEEDS_THREE_ATTENDEES");
      if (new Set(input.winnerUserIds).size !== 3) throw new Error("EVENT_WINNERS_NOT_UNIQUE");

      const attendedIds = new Set(event.registrations.map((item) => item.userId));
      if (input.winnerUserIds.some((userId) => !attendedIds.has(userId))) {
        throw new Error("EVENT_WINNER_NOT_ATTENDED");
      }
      const podiumBonus = [
        event.firstPlaceBonusHp,
        event.secondPlaceBonusHp,
        event.thirdPlaceBonusHp,
      ];

      for (const registration of event.registrations) {
        const placementIndex = input.winnerUserIds.indexOf(registration.userId);
        const placement = placementIndex >= 0 ? PLACEMENTS[placementIndex] : null;
        const bonus = placementIndex >= 0 ? podiumBonus[placementIndex] : 0;
        const totalHp = event.participationHp + bonus;
        const economy =
          (await transaction.userEconomy.findUnique({ where: { userId: registration.userId } })) ??
          (await transaction.userEconomy.create({ data: { userId: registration.userId } }));
        const debtPaid = Math.min(economy.hpDebt, totalHp);

        await transaction.hPLedgerEntry.create({
          data: {
            userId: registration.userId,
            eventId: event.id,
            idempotencyKey: `event:${event.id}:participation:${registration.userId}`,
            type: LedgerType.HP_GRANT,
            amount: event.participationHp,
            description: `Reward kehadiran event ${event.title}`,
            source: RewardSource.EVENT_PARTICIPATION,
            formulaVersion: "event-admin-v1",
            effectiveAt: event.endDate,
          },
        });
        if (placement && bonus > 0) {
          await transaction.hPLedgerEntry.create({
            data: {
              userId: registration.userId,
              eventId: event.id,
              idempotencyKey: `event:${event.id}:podium:${placement}`,
              type: LedgerType.HP_GRANT,
              amount: bonus,
              description: `Bonus juara ${placement} event ${event.title}`,
              source: RewardSource.EVENT_PODIUM,
              formulaVersion: "event-admin-v1",
              effectiveAt: event.endDate,
            },
          });
        }
        await transaction.userEconomy.update({
          where: { userId: registration.userId },
          data: {
            currentHp: { increment: totalHp - debtPaid },
            hpDebt: { decrement: debtPaid },
          },
        });
        await transaction.eventRegistration.update({
          where: { id: registration.id },
          data: { placement, rewardedAt: new Date() },
        });
        await createUserNotification(
          {
            userId: registration.userId,
            type: NotificationType.EVENT,
            title: placement ? `Selamat, juara ${placement}!` : "Reward event diterima",
            message: `${totalHp} HP dari event ${event.title} telah masuk ke akunmu.`,
            actionUrl: `/komunitas/event/${event.id}`,
            dedupeKey: `event-reward:${event.id}:${registration.userId}`,
          },
          transaction,
        );
      }

      const finalizedAt = new Date();
      const updated = await transaction.event.update({
        where: { id: event.id },
        data: { resultsFinalizedAt: finalizedAt, rewardsLockedAt: event.rewardsLockedAt ?? finalizedAt },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: input.adminUserId,
          action: "FINALIZE_EVENT_REWARDS",
          entityName: "Event",
          entityId: event.id,
          beforeState: { resultsFinalizedAt: null },
          afterState: {
            resultsFinalizedAt: finalizedAt,
            winners: input.winnerUserIds,
            attendanceRewarded: event.registrations.length,
          },
        },
      });
      return { event: updated, idempotentReplay: false as const };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 30_000,
    },
  );
}
