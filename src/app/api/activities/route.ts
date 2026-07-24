import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 50);
    const cursor = searchParams.get("cursor") || undefined;
    const rows = await prisma.activitySession.findMany({
      where: { userId: user.id },
      include: { verificationResult: true },
      orderBy: [{ startTime: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const activities = hasMore ? rows.slice(0, limit) : rows;
    return NextResponse.json({
      success: true,
      activities,
      nextCursor: hasMore ? activities.at(-1)?.id : null,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
