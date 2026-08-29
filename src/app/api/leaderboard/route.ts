import { ConnectionStatus, LeaderboardScope, Prisma, RewardSource } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const currentUser = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
    const window = searchParams.get("window") === "7d" ? "7d" : "season";
    const scopeValue = searchParams.get("scope");
    const scope = scopeValue && Object.values(LeaderboardScope).includes(scopeValue as LeaderboardScope)
      ? scopeValue as LeaderboardScope
      : LeaderboardScope.LEAGUE;
    const now = new Date();
    const [current, season] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: currentUser.id }, include: { economy: true, settings: true } }),
      prisma.leaderboardSeason.findFirst({
        where: { isActive: true, finalizedAt: null, startDate: { lte: now }, endDate: { gte: now } },
        orderBy: { startDate: "desc" },
      }),
    ]);

    let userIds: string[] | undefined;
    let region: string | null = null;
    if (scope === LeaderboardScope.FRIENDS) {
      const connections = await prisma.userConnection.findMany({
        where: { status: ConnectionStatus.ACCEPTED, OR: [{ requesterId: currentUser.id }, { addresseeId: currentUser.id }] },
        select: { requesterId: true, addresseeId: true },
      });
      userIds = [currentUser.id, ...connections.map((connection) => connection.requesterId === currentUser.id ? connection.addresseeId : connection.requesterId)];
    } else if (scope === LeaderboardScope.LOCAL) {
      region = current.settings?.leaderboardRegion ?? null;
      if (!region) {
        return NextResponse.json({ success: false, error: "Region leaderboard lokal belum diatur.", code: "LEADERBOARD_REGION_REQUIRED" }, { status: 409 });
      }
    }

    const baseWhere: Prisma.UserWhereInput = {
      isSuspended: false,
      settings: { is: { leaderboardVisible: true, ...(region ? { leaderboardRegion: region } : {}) } },
      ...(userIds ? { id: { in: userIds } } : {}),
      ...(scope === LeaderboardScope.LEAGUE && current.economy
        ? { economy: { is: { currentTier: current.economy.currentTier } } }
        : {}),
    };
    const users = await prisma.user.findMany({
      where: baseWhere,
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        economy: { select: { totalXp: true, currentTier: true, streakDays: true } },
        seasonParticipations: {
          where: { seasonId: season?.id ?? "__no_active_season__" },
          select: { activeDayCount: true, verifiedChallengeCount: true, carryoverXp: true, status: true },
        },
      },
    });
    const scores = season
      ? await prisma.xPGrant.groupBy({
          by: ["userId"],
          where: {
            seasonId: season.id,
            ...(window === "7d"
              ? { effectiveAt: { gte: new Date(now.getTime() - 7 * 86_400_000) }, source: { not: RewardSource.SEASON_CARRYOVER } }
              : {}),
          },
          _sum: { amount: true },
        })
      : [];
    const scoreByUser = new Map(scores.map((score) => [score.userId, Math.max(0, score._sum.amount ?? 0)]));
    const ranked = users
      .map((user) => {
        const participant = user.seasonParticipations?.[0] ?? null;
        return {
          ...user,
          seasonParticipations: undefined,
          seasonXp: scoreByUser.get(user.id) ?? 0,
          lifetimeXp: user.economy?.totalXp ?? 0,
          activeDayCount: participant?.activeDayCount ?? 0,
          verifiedChallengeCount: participant?.verifiedChallengeCount ?? 0,
          seasonStatus: participant?.status ?? "NEWCOMER",
        };
      })
      .sort((left, right) =>
        right.seasonXp - left.seasonXp ||
        right.activeDayCount - left.activeDayCount ||
        right.verifiedChallengeCount - left.verifiedChallengeCount ||
        left.id.localeCompare(right.id),
      )
      .map((user, index) => ({ rank: index + 1, ...user }));
    const myRank = ranked.find((row) => row.id === currentUser.id) ?? null;
    return NextResponse.json({
      success: true,
      scope,
      window,
      region,
      season,
      leaderboard: ranked.slice(0, limit),
      myRank,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
