import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  finiteNumber,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calendarDayKey,
  isCalendarDayKey,
  utcDayBoundsForKey,
} from "@/server/economy/economy-policy";
import {
  getHealthPulseOverview,
  refreshDailyHealthPulse,
} from "@/server/health/health-pulse-service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 30, 1), 180);
    const overview = await getHealthPulseOverview(user.id);
    const pulses = await prisma.healthPulse.findMany({
      where: { userId: user.id },
      orderBy: { pulseDate: "desc" },
      take: limit,
    });
    return NextResponse.json({ success: true, overview, pulses });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: { timezone: true },
    });
    const timezone = settings?.timezone ?? "Asia/Jakarta";
    const currentDayKey = calendarDayKey(new Date(), timezone);
    const dayKey =
      body?.date === undefined ? currentDayKey : body.date;
    if (!isCalendarDayKey(dayKey) || dayKey > currentDayKey) {
      return NextResponse.json(
        { success: false, error: "Tanggal tidak valid." },
        { status: 400 },
      );
    }
    const sleepHoursToAdd = finiteNumber(
      body?.sleepHoursToAdd ?? body?.sleepHours,
      "Tambahan durasi tidur",
      {
      min: 0.25,
      max: 24,
      optional: true,
      },
    );
    if (sleepHoursToAdd === undefined) {
      throw new ApiRequestError(
        "Isi tambahan durasi tidur antara 0,25 sampai 24 jam.",
        400,
        "SLEEP_DURATION_REQUIRED",
      );
    }
    const bounds = utcDayBoundsForKey(dayKey, timezone);
    const existing = await prisma.sleepLog.aggregate({
      where: { userId: user.id, loggedAt: { gte: bounds.start, lt: bounds.end } },
      _sum: { durationHours: true },
    });
    const currentTotal = existing._sum.durationHours ?? 0;
    if (currentTotal + sleepHoursToAdd > 24) {
      throw new ApiRequestError(
        `Total tidur hari ini maksimal 24 jam. Saat ini sudah tercatat ${currentTotal} jam.`,
        400,
        "SLEEP_DAILY_LIMIT",
      );
    }
    const loggedAt = dayKey === currentDayKey
      ? new Date()
      : new Date((bounds.start.getTime() + bounds.end.getTime()) / 2);
    const log = await prisma.sleepLog.create({
      data: { userId: user.id, durationHours: sleepHoursToAdd, loggedAt },
    });
    const result = await refreshDailyHealthPulse({
      userId: user.id,
      dayKey,
    });
    return NextResponse.json(
      { success: true, log, totalSleepHours: currentTotal + sleepHoursToAdd, ...result },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
