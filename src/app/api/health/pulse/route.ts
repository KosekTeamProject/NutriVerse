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
    const sleepHours = finiteNumber(body?.sleepHours, "Durasi tidur", {
      min: 1,
      max: 16,
      optional: true,
    });
    if (sleepHours === undefined) {
      throw new ApiRequestError(
        "Isi durasi tidur antara 1 sampai 16 jam.",
        400,
        "SLEEP_DURATION_REQUIRED",
      );
    }
    const result = await refreshDailyHealthPulse({
      userId: user.id,
      dayKey,
      sleepHours,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
