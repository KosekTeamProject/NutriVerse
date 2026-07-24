import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calendarDayKey,
  isCalendarDayKey,
  utcDayBoundsForKey,
} from "@/server/economy/economy-policy";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const rawDate = searchParams.get("date");
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: { timezone: true },
    });
    const timezone = settings?.timezone ?? "Asia/Jakarta";
    const dayKey = rawDate ?? calendarDayKey(new Date(), timezone);
    if (!isCalendarDayKey(dayKey)) {
      return NextResponse.json(
        { success: false, error: "Tanggal tidak valid." },
        { status: 400 },
      );
    }
    const { start, end } = utcDayBoundsForKey(dayKey, timezone);
    const [nutrition, water] = await Promise.all([
      prisma.nutritionEntry.aggregate({
        where: { userId: user.id, loggedAt: { gte: start, lt: end } },
        _sum: { calories: true, protein: true, carbs: true, fat: true, fiber: true },
        _count: true,
      }),
      prisma.waterLog.aggregate({
        where: { userId: user.id, loggedAt: { gte: start, lt: end } },
        _sum: { volumeMl: true },
        _count: true,
      }),
    ]);
    return NextResponse.json({
      success: true,
      date: dayKey,
      timezone,
      totals: {
        calories: nutrition._sum.calories ?? 0,
        protein: nutrition._sum.protein ?? 0,
        carbs: nutrition._sum.carbs ?? 0,
        fat: nutrition._sum.fat ?? 0,
        fiber: nutrition._sum.fiber ?? 0,
        waterMl: water._sum.volumeMl ?? 0,
        entryCount: nutrition._count,
        waterLogCount: water._count,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
