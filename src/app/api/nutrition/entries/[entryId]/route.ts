import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshDailyHealthPulse } from "@/server/health/health-pulse-service";

type RouteContext = { params: Promise<{ entryId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { entryId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Payload tidak valid." },
        { status: 400 },
      );
    }
    const foodName =
      typeof body.foodName === "string" ? body.foodName.trim() : undefined;
    if (foodName !== undefined && (foodName.length < 1 || foodName.length > 200)) {
      return NextResponse.json(
        { success: false, error: "Nama makanan tidak valid." },
        { status: 400 },
      );
    }
    const portionGrams =
      typeof body.portionGrams === "number" &&
      Number.isFinite(body.portionGrams) &&
      body.portionGrams > 0 &&
      body.portionGrams <= 10_000
        ? body.portionGrams
        : undefined;
    if (body.portionGrams !== undefined && portionGrams === undefined) {
      return NextResponse.json(
        { success: false, error: "Porsi makanan tidak valid." },
        { status: 400 },
      );
    }
    const existing = await prisma.nutritionEntry.findFirst({
      where: { id: entryId, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Catatan nutrisi tidak ditemukan." },
        { status: 404 },
      );
    }
    const scale =
      portionGrams !== undefined && existing.portionGrams
        ? portionGrams / existing.portionGrams
        : null;
    const entry = await prisma.nutritionEntry.update({
      where: { id: entryId },
      data: {
        ...(foodName !== undefined ? { foodName } : {}),
        ...(portionGrams !== undefined ? { portionGrams } : {}),
        ...(scale !== null
          ? {
              calories: existing.calories * scale,
              protein: existing.protein * scale,
              carbs: existing.carbs * scale,
              fat: existing.fat * scale,
              fiber: existing.fiber * scale,
              sugar: existing.sugar * scale,
              sodiumMg: existing.sodiumMg * scale,
            }
          : {}),
        ...(typeof body.mealType === "string"
          ? { mealType: body.mealType.trim().slice(0, 50) || null }
          : {}),
      },
      include: { foodItem: true },
    });
    await refreshDailyHealthPulse({
      userId: user.id,
      occurredAt: entry.loggedAt,
    });
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { entryId } = await context.params;
    const existing = await prisma.nutritionEntry.findFirst({
      where: { id: entryId, userId: user.id },
      select: { loggedAt: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Catatan nutrisi tidak ditemukan." }, { status: 404 });
    }
    const result = await prisma.nutritionEntry.deleteMany({
      where: { id: entryId, userId: user.id },
    });
    if (!result.count) {
      return NextResponse.json({ success: false, error: "Catatan nutrisi tidak ditemukan." }, { status: 404 });
    }
    await refreshDailyHealthPulse({
      userId: user.id,
      occurredAt: existing.loggedAt,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
