import {
  AppealStatus,
  LeaderboardScope,
  LedgerType,
  NotificationType,
  Prisma,
  RewardSource,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calendarDayKey } from "@/server/economy/economy-policy";
import { createUserNotification } from "@/server/notifications/notification-service";
import {
  SEASON_REWARD_HP,
  isSeasonRewardEligible,
  seasonCarryoverXp,
} from "@/server/leaderboard/season-policy";

export async function finalizeLeaderboardSeason(input: {
  seasonId: string;
  adminUserId: string;
}) {
  return prisma.$transaction(
    async (transaction) => {
      const season = await transaction.leaderboardSeason.findUnique({
        where: { id: input.seasonId },
        include: {
          participants: { include: { user: { include: { economy: true } } } },
        },
      });
      if (!season) throw new Error("SEASON_NOT_FOUND");
      if (season.finalizedAt) return { season, idempotentReplay: true as const };
      if (season.endDate > new Date()) throw new Error("SEASON_NOT_FINISHED");

      const userIds = season.participants.map((participant) => participant.userId);
      const [grants, activities, unresolvedAppeals, nextSeason] = await Promise.all([
        transaction.xPGrant.groupBy({
          by: ["userId"],
          where: {
            seasonId: season.id,
            source: { not: RewardSource.SEASON_CARRYOVER },
          },
          _sum: { amount: true },
        }),
        transaction.activitySession.findMany({
          where: {
            userId: { in: userIds },
            verificationStatus: VerificationStatus.VERIFIED,
            startTime: { gte: season.startDate, lte: season.endDate },
          },
          select: { userId: true, startTime: true, endTime: true },
        }),
        transaction.appeal.findMany({
          where: {
            userId: { in: userIds },
            status: AppealStatus.PENDING,
            activitySession: { startTime: { gte: season.startDate, lte: season.endDate } },
          },
          select: { userId: true },
        }),
        transaction.leaderboardSeason.findFirst({
          where: { startDate: { gt: season.endDate } },
          orderBy: { startDate: "asc" },
        }),
      ]);
      const grantByUser = new Map(grants.map((grant) => [grant.userId, grant._sum.amount ?? 0]));
      const activityDays = new Map<string, Set<string>>();
      const activityCount = new Map<string, number>();
      for (const activity of activities) {
        const days = activityDays.get(activity.userId) ?? new Set<string>();
        days.add(calendarDayKey(activity.endTime ?? activity.startTime, season.timezone));
        activityDays.set(activity.userId, days);
        activityCount.set(activity.userId, (activityCount.get(activity.userId) ?? 0) + 1);
      }
      const unresolvedUsers = new Set(unresolvedAppeals.map((appeal) => appeal.userId));
      const ranked = season.participants
        .map((participant) => ({
          participant,
          earnedXp: grantByUser.get(participant.userId) ?? 0,
          activeDayCount: activityDays.get(participant.userId)?.size ?? 0,
          verifiedActivityCount: activityCount.get(participant.userId) ?? 0,
          score: participant.carryoverXp + (grantByUser.get(participant.userId) ?? 0),
        }))
        .sort((left, right) =>
          right.score - left.score ||
          right.activeDayCount - left.activeDayCount ||
          right.participant.verifiedChallengeCount - left.participant.verifiedChallengeCount ||
          left.participant.createdAt.getTime() - right.participant.createdAt.getTime(),
        );

      await transaction.ranking.deleteMany({
        where: { seasonId: season.id, scope: LeaderboardScope.LEAGUE },
      });
      for (const [index, row] of ranked.entries()) {
        const tier = row.participant.user.economy?.currentTier ?? row.participant.lifetimeTierAtStart;
        const eligible = isSeasonRewardEligible({
          activeDayCount: row.activeDayCount,
          verifiedActivityCount: row.verifiedActivityCount,
          hasUnresolvedReview: unresolvedUsers.has(row.participant.userId),
        });
        const rewardHp = eligible ? SEASON_REWARD_HP[tier] : 0;
        await transaction.ranking.create({
          data: {
            seasonId: season.id,
            userId: row.participant.userId,
            scope: LeaderboardScope.LEAGUE,
            tier,
            rankPosition: index + 1,
            totalVerifiedXp: row.score,
            consistencyScore: row.activeDayCount,
          },
        });
        await transaction.seasonParticipant.update({
          where: { id: row.participant.id },
          data: {
            earnedXp: row.earnedXp,
            activeDayCount: row.activeDayCount,
            verifiedActivityCount: row.verifiedActivityCount,
            finalPosition: index + 1,
            seasonRewardHp: rewardHp,
            finalizedAt: new Date(),
          },
        });
        if (rewardHp > 0) {
          const economy = row.participant.user.economy ??
            (await transaction.userEconomy.create({ data: { userId: row.participant.userId } }));
          const debtPaid = Math.min(economy.hpDebt, rewardHp);
          await transaction.hPLedgerEntry.create({
            data: {
              userId: row.participant.userId,
              seasonId: season.id,
              idempotencyKey: `season:${season.id}:reward:${row.participant.userId}`,
              type: LedgerType.HP_GRANT,
              amount: rewardHp,
              description: `Reward akhir ${season.name}`,
              source: RewardSource.SEASON_REWARD,
              formulaVersion: "season-v1",
              effectiveAt: season.endDate,
            },
          });
          await transaction.userEconomy.update({
            where: { userId: row.participant.userId },
            data: { currentHp: { increment: rewardHp - debtPaid }, hpDebt: { decrement: debtPaid } },
          });
          await createUserNotification({
            userId: row.participant.userId,
            type: NotificationType.REWARD,
            title: `Reward ${season.name}`,
            message: `${rewardHp} HP masuk ke akunmu. Lifetime tier tetap ${tier}.`,
            actionUrl: "/komunitas?bagian=peringkat",
            dedupeKey: `season-reward:${season.id}:${row.participant.userId}`,
          }, transaction);
        }
        if (nextSeason) {
          const missedSeasonCount = row.activeDayCount === 0
            ? row.participant.missedSeasonCount + 1
            : 0;
          const carryoverXp = seasonCarryoverXp(row.score, tier, missedSeasonCount);
          await transaction.seasonParticipant.upsert({
            where: { seasonId_userId: { seasonId: nextSeason.id, userId: row.participant.userId } },
            create: {
              seasonId: nextSeason.id,
              userId: row.participant.userId,
              lifetimeTierAtStart: tier,
              carryoverXp,
              status: missedSeasonCount > 0 ? "RETURNING" : "ACTIVE",
              missedSeasonCount,
            },
            update: {
              carryoverXp,
              lifetimeTierAtStart: tier,
              status: missedSeasonCount > 0 ? "RETURNING" : "ACTIVE",
              missedSeasonCount,
            },
          });
          await transaction.xPGrant.upsert({
            where: { idempotencyKey: `season:${nextSeason.id}:carryover:${row.participant.userId}` },
            create: {
              userId: row.participant.userId,
              seasonId: nextSeason.id,
              idempotencyKey: `season:${nextSeason.id}:carryover:${row.participant.userId}`,
              type: LedgerType.XP_GRANT,
              amount: carryoverXp,
              reason: `Carryover dari ${season.name}`,
              source: RewardSource.SEASON_CARRYOVER,
              formulaVersion: "season-v1",
              countsTowardLifetime: false,
              effectiveAt: nextSeason.startDate,
            },
            update: { amount: carryoverXp },
          });
        }
      }
      const finalizedAt = new Date();
      const updated = await transaction.leaderboardSeason.update({
        where: { id: season.id },
        data: { finalizedAt, isActive: false },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: input.adminUserId,
          action: "FINALIZE_LEADERBOARD_SEASON",
          entityName: "LeaderboardSeason",
          entityId: season.id,
          afterState: { finalizedAt, participantCount: ranked.length, nextSeasonId: nextSeason?.id ?? null },
        },
      });
      return { season: updated, participants: ranked.length, idempotentReplay: false as const };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 60_000 },
  );
}
