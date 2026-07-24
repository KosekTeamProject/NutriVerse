import {
  ConnectionStatus,
  LeaderboardScope,
  Prisma,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const currentUser = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
    const scopeValue = searchParams.get("scope");
    const scope =
      scopeValue &&
      Object.values(LeaderboardScope).includes(
        scopeValue as LeaderboardScope,
      )
        ? (scopeValue as LeaderboardScope)
        : LeaderboardScope.LEAGUE;
    const current = await prisma.user.findUniqueOrThrow({
      where: { id: currentUser.id },
      include: { economy: true, settings: true },
    });
    let userIds: string[] | undefined;
    let region: string | null = null;

    if (scope === LeaderboardScope.FRIENDS) {
      const connections = await prisma.userConnection.findMany({
        where: {
          status: ConnectionStatus.ACCEPTED,
          OR: [
            { requesterId: currentUser.id },
            { addresseeId: currentUser.id },
          ],
        },
        select: { requesterId: true, addresseeId: true },
      });
      userIds = [
        currentUser.id,
        ...connections.map((connection) =>
          connection.requesterId === currentUser.id
            ? connection.addresseeId
            : connection.requesterId,
        ),
      ];
    } else if (scope === LeaderboardScope.LOCAL) {
      region = current.settings?.leaderboardRegion ?? null;
      if (!region) {
        return NextResponse.json(
          {
            success: false,
            error: "Region leaderboard lokal belum diatur.",
            code: "LEADERBOARD_REGION_REQUIRED",
          },
          { status: 409 },
        );
      }
    }
    const baseWhere: Prisma.UserWhereInput = {
      isSuspended: false,
      settings: {
        is: {
          leaderboardVisible: true,
          ...(region ? { leaderboardRegion: region } : {}),
        },
      },
      ...(userIds ? { id: { in: userIds } } : {}),
      ...(scope === LeaderboardScope.LEAGUE && current.economy
        ? { economy: { is: { currentTier: current.economy.currentTier } } }
        : {}),
    };
    const users = await prisma.user.findMany({
      where: baseWhere,
      select: {
        id: true, name: true, username: true, avatarUrl: true,
        economy: { select: { totalXp: true, currentTier: true, streakDays: true } },
      },
      orderBy: [
        { economy: { totalXp: "desc" } },
        { id: "asc" },
      ],
      take: limit,
    });
    const leaderboard = users.map((user, index) => ({ rank: index + 1, ...user }));
    let myRank = leaderboard.find((row) => row.id === currentUser.id) ?? null;
    if (!myRank && current.economy) {
      const eligibleCurrent = await prisma.user.findFirst({
        where: { ...baseWhere, id: currentUser.id },
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          economy: {
            select: {
              totalXp: true,
              currentTier: true,
              streakDays: true,
            },
          },
        },
      });
      if (eligibleCurrent) {
        const higherRanked = await prisma.user.count({
          where: {
            ...baseWhere,
            OR: [
              {
                economy: {
                  is: { totalXp: { gt: current.economy.totalXp } },
                },
              },
              {
                AND: [
                  {
                    economy: {
                      is: { totalXp: current.economy.totalXp },
                    },
                  },
                  { id: { lt: currentUser.id } },
                ],
              },
            ],
          },
        });
        myRank = {
          rank: higherRanked + 1,
          ...eligibleCurrent,
        };
      }
    }
    const season = await prisma.leaderboardSeason.findFirst({
      where: { isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json({
      success: true,
      scope,
      region,
      season,
      leaderboard,
      myRank,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
