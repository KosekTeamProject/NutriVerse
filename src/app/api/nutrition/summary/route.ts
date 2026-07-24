import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const rawDate = searchParams.get("date");
    const start = rawDate ? new Date(`${rawDate}T00:00:00.000Z`) : new Date();
    if (!rawDate) start.setHours(0, 0, 0, 0);
    if (Number.isNaN(start.getTime())) return NextResponse.json({ success: false, error: "Tanggal tidak valid." }, { status: 400 });
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const [nutrition, water] = await Promise.all([
      prisma.nutritionEntry.aggregate({
        where: { userId: user.id, createdAt: { gte: start, lt: end } },
        _sum: { calories: true, protein: true, carbs: true, fat: true },
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
      date: start,
      totals: {
        calories: nutrition._sum.calories ?? 0,
        protein: nutrition._sum.protein ?? 0,
        carbs: nutrition._sum.carbs ?? 0,
        fat: nutrition._sum.fat ?? 0,
        waterMl: water._sum.volumeMl ?? 0,
        entryCount: nutrition._count,
        waterLogCount: water._count,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
