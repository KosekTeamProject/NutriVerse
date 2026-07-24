import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const currentUser = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
    const users = await prisma.user.findMany({
      where: { settings: { is: { leaderboardVisible: true } } },
      select: {
        id: true, name: true, username: true, avatarUrl: true,
        economy: { select: { totalXp: true, currentTier: true, streakDays: true } },
      },
      orderBy: { economy: { totalXp: "desc" } },
      take: limit,
    });
    const leaderboard = users.map((user, index) => ({ rank: index + 1, ...user }));
    const myRank = leaderboard.find((row) => row.id === currentUser.id) ?? null;
    const season = await prisma.leaderboardSeason.findFirst({
      where: { isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json({ success: true, season, leaderboard, myRank });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
