import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const activityId = request.nextUrl.searchParams.get("activityId") || undefined;
    const [economy, pulses, activities] = await Promise.all([
      prisma.userEconomy.findUnique({ where: { userId: user.id }, select: { totalXp: true, currentTier: true, streakDays: true } }),
      prisma.healthPulse.findMany({ where: { userId: user.id }, orderBy: { pulseDate: "desc" }, take: 2, select: { overallScore: true, pulseDate: true } }),
      prisma.activitySession.findMany({
        where: { userId: user.id, ...(activityId ? { id: activityId } : {}) },
        select: { id: true, activityType: true, startTime: true, distanceMeters: true, durationSeconds: true, caloriesBurned: true, verificationStatus: true },
        orderBy: { startTime: "desc" },
        take: activityId ? 1 : 20,
      }),
    ]);
    const current = pulses[0]?.overallScore ?? null;
    const previous = pulses[1]?.overallScore ?? null;
    const delta = current !== null && previous !== null ? Math.round((current - previous) * 10) / 10 : null;
    return NextResponse.json({
      success: true,
      context: {
        user: { id: user.id, name: user.name, username: user.username, avatarUrl: user.avatarUrl },
        progress: economy,
        healthPulse: { current, previous, delta, trend: delta === null ? "UNKNOWN" : delta > 0 ? "UP" : delta < 0 ? "DOWN" : "STABLE", comparisonDate: pulses[1]?.pulseDate ?? null },
        activities,
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
