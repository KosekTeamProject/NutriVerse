import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, finiteNumber } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ metricId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { metricId } = await context.params;
    const existing = await prisma.healthMetric.findFirst({ where: { id: metricId, userId: user.id } });
    if (!existing) return NextResponse.json({ success: false, error: "Pengukuran tidak ditemukan." }, { status: 404 });
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const weightKg = finiteNumber(body?.weightKg, "Berat badan", { min: 20, max: 400, optional: true });
    const heightCm = finiteNumber(body?.heightCm, "Tinggi badan", { min: 80, max: 250, optional: true });
    const effectiveWeight = weightKg ?? existing.weightKg;
    const effectiveHeight = heightCm ?? existing.heightCm;
    const metric = await prisma.healthMetric.update({
      where: { id: existing.id },
      data: {
        ...(weightKg !== undefined ? { weightKg } : {}),
        ...(heightCm !== undefined ? { heightCm } : {}),
        bmi: effectiveWeight && effectiveHeight ? effectiveWeight / (effectiveHeight / 100) ** 2 : null,
      },
    });
    return NextResponse.json({ success: true, metric });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { metricId } = await context.params;
    const result = await prisma.healthMetric.deleteMany({ where: { id: metricId, userId: user.id } });
    if (!result.count) return NextResponse.json({ success: false, error: "Pengukuran tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
