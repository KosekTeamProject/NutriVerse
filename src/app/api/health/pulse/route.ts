import { VerificationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, finiteNumber } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function dayBounds(value: unknown) {
  const date =
    typeof value === "string" && value
      ? new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
      : new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
  if (Number.isNaN(date.getTime())) return null;
  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: date, end };
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 30, 1), 180);
    const pulses = await prisma.healthPulse.findMany({
      where: { userId: user.id },
      orderBy: { pulseDate: "desc" },
      take: limit,
    });
    return NextResponse.json({ success: true, pulses });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const bounds = dayBounds(body?.date);
    if (!bounds) return NextResponse.json({ success: false, error: "Tanggal tidak valid." }, { status: 400 });
    const sleepHours = finiteNumber(body?.sleepHours, "Durasi tidur", { min: 0, max: 24, optional: true });
    const hydrationLiters = finiteNumber(body?.hydrationLiters, "Hidrasi", { min: 0, max: 15, optional: true });
    const [profile, nutrition, activity] = await Promise.all([
      prisma.healthProfile.findUnique({ where: { userId: user.id } }),
      prisma.nutritionEntry.aggregate({
        where: { userId: user.id, createdAt: { gte: bounds.start, lt: bounds.end } },
        _sum: { protein: true },
      }),
      prisma.activitySession.aggregate({
        where: {
          userId: user.id,
          verificationStatus: VerificationStatus.VERIFIED,
          endTime: { gte: bounds.start, lt: bounds.end },
        },
        _sum: { durationSeconds: true },
      }),
    ]);
    const nutritionScore = Math.min(
      100,
      ((nutrition._sum.protein ?? 0) / (profile?.dailyProteinTargetGrams ?? 80)) * 100,
    );
    const activityScore = Math.min(100, ((activity._sum.durationSeconds ?? 0) / 1800) * 100);
    const sleepScore =
      sleepHours === undefined ? 0 : Math.min(100, (sleepHours / (profile?.dailySleepTargetHours ?? 8)) * 100);
    const hydrationScore =
      hydrationLiters === undefined
        ? 0
        : Math.min(100, (hydrationLiters * 1000 / (profile?.dailyWaterTargetMl ?? 2000)) * 100);
    const availableScores = [
      nutritionScore,
      activityScore,
      ...(sleepHours !== undefined ? [sleepScore] : []),
      ...(hydrationLiters !== undefined ? [hydrationScore] : []),
    ];
    const overallScore =
      availableScores.reduce((total, score) => total + score, 0) / availableScores.length;
    const pulse = await prisma.healthPulse.upsert({
      where: { userId_pulseDate: { userId: user.id, pulseDate: bounds.start } },
      create: {
        userId: user.id,
        pulseDate: bounds.start,
        overallScore,
        nutritionScore,
        activityScore,
        sleepHours,
        hydrationLiters,
      },
      update: { overallScore, nutritionScore, activityScore, sleepHours, hydrationLiters },
    });
    return NextResponse.json({ success: true, pulse });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
