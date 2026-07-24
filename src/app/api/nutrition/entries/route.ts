import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type NutritionPayload = {
  foodItemId?: unknown;
  foodName?: unknown;
  portionGrams?: unknown;
  calories?: unknown;
  protein?: unknown;
  carbs?: unknown;
  fat?: unknown;
  confidenceScore?: unknown;
  imageUrl?: unknown;
  recommendationText?: unknown;
};

function nonNegative(value: unknown, fallback = 0) {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return value;
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get("limit") ?? 20);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 50)
      : 20;
    const cursor = searchParams.get("cursor") || undefined;

    const entries = await prisma.nutritionEntry.findMany({
      where: { userId: user.id },
      include: { foodItem: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = entries.length > limit;
    const page = hasMore ? entries.slice(0, limit) : entries;

    return NextResponse.json({
      success: true,
      entries: page,
      nextCursor: hasMore ? page.at(-1)?.id : null,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as NutritionPayload | null;
    if (!body) {
      return NextResponse.json({ success: false, error: "Payload tidak valid." }, { status: 400 });
    }

    const foodItemId = typeof body.foodItemId === "string" ? body.foodItemId : undefined;
    const portionGrams =
      typeof body.portionGrams === "number" &&
      Number.isFinite(body.portionGrams) &&
      body.portionGrams > 0
        ? body.portionGrams
        : 100;
    const foodItem = foodItemId
      ? await prisma.foodItem.findUnique({ where: { id: foodItemId } })
      : null;

    if (foodItemId && !foodItem) {
      return NextResponse.json({ success: false, error: "Makanan tidak ditemukan." }, { status: 404 });
    }

    const factor = portionGrams / 100;
    const manualName = typeof body.foodName === "string" ? body.foodName.trim() : "";
    const foodName = foodItem?.name ?? manualName;
    if (!foodName || foodName.length > 200) {
      return NextResponse.json({ success: false, error: "Nama makanan tidak valid." }, { status: 400 });
    }

    const calories = foodItem ? foodItem.caloriesPer100g * factor : nonNegative(body.calories);
    const protein = foodItem ? foodItem.proteinPer100g * factor : nonNegative(body.protein);
    const carbs = foodItem ? foodItem.carbsPer100g * factor : nonNegative(body.carbs);
    const fat = foodItem ? foodItem.fatPer100g * factor : nonNegative(body.fat);
    const confidenceScore = nonNegative(body.confidenceScore);
    if ([calories, protein, carbs, fat, confidenceScore].some((value) => value === null)) {
      return NextResponse.json({ success: false, error: "Nilai nutrisi tidak valid." }, { status: 400 });
    }

    const entry = await prisma.nutritionEntry.create({
      data: {
        userId: user.id,
        foodItemId: foodItem?.id,
        foodName,
        portionGrams,
        calories: calories ?? 0,
        protein: protein ?? 0,
        carbs: carbs ?? 0,
        fat: fat ?? 0,
        confidenceScore: confidenceScore ?? 0,
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() || null : null,
        recommendationText:
          typeof body.recommendationText === "string"
            ? body.recommendationText.trim() || null
            : null,
      },
      include: { foodItem: true },
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
