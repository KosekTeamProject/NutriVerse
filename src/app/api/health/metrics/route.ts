import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, finiteNumber } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 200);
    const metrics = await prisma.healthMetric.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ success: true, metrics });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const weightKg = finiteNumber(body?.weightKg, "Berat badan", { min: 20, max: 400, optional: true });
    const heightCm = finiteNumber(body?.heightCm, "Tinggi badan", { min: 80, max: 250, optional: true });
    if (weightKg === undefined && heightCm === undefined) {
      return NextResponse.json({ success: false, error: "Berat atau tinggi harus diisi." }, { status: 400 });
    }
    const current = await prisma.healthProfile.findUnique({ where: { userId: user.id } });
    const effectiveWeight = weightKg ?? current?.weightKg;
    const effectiveHeight = heightCm ?? current?.heightCm;
    const bmi =
      effectiveWeight && effectiveHeight
        ? effectiveWeight / (effectiveHeight / 100) ** 2
        : null;
    const recordedAt =
      typeof body?.recordedAt === "string" ? new Date(body.recordedAt) : new Date();
    if (Number.isNaN(recordedAt.getTime()) || recordedAt > new Date()) {
      return NextResponse.json({ success: false, error: "Tanggal pengukuran tidak valid." }, { status: 400 });
    }
    const [metric] = await prisma.$transaction([
      prisma.healthMetric.create({
        data: { userId: user.id, weightKg, heightCm, bmi, recordedAt },
      }),
      prisma.healthProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, weightKg, heightCm },
        update: {
          ...(weightKg !== undefined ? { weightKg } : {}),
          ...(heightCm !== undefined ? { heightCm } : {}),
        },
      }),
    ]);
    return NextResponse.json({ success: true, metric }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
