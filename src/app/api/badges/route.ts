import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const badges = await prisma.badge.findMany({
      include: { userBadges: { where: { userId: user.id }, select: { id: true, earnedAt: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      success: true,
      badges: badges.map((badge) => ({
        ...badge,
        earned: badge.userBadges.length > 0,
        earnedAt: badge.userBadges[0]?.earnedAt ?? null,
      })),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
