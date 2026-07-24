import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedPublicStorageUrl } from "@/lib/storage-ownership";

type NutritionPayload = {
  foodItemId?: unknown;
  foodName?: unknown;
  portionGrams?: unknown;
  calories?: unknown;
  protein?: unknown;
  carbs?: unknown;
  fat?: unknown;
  fiber?: unknown;
  sugar?: unknown;
  sodiumMg?: unknown;
  mealType?: unknown;
  source?: unknown;
  isUserConfirmed?: unknown;
  loggedAt?: unknown;
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
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 200)
      : 20;
    const cursor = searchParams.get("cursor") || undefined;
    const fromValue = searchParams.get("from");
    const from = fromValue ? new Date(fromValue) : null;
    if (from && Number.isNaN(from.getTime())) {
      return NextResponse.json(
        { success: false, error: "Tanggal awal tidak valid." },
        { status: 400 },
      );
    }

    const entries = await prisma.nutritionEntry.findMany({
      where: {
        userId: user.id,
        ...(from ? { loggedAt: { gte: from } } : {}),
      },
      include: { foodItem: true },
      orderBy: [{ loggedAt: "desc" }, { id: "desc" }],
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
    const fiber = foodItem ? foodItem.fiberPer100g * factor : nonNegative(body.fiber);
    const sugar = foodItem ? foodItem.sugarPer100g * factor : nonNegative(body.sugar);
    const sodiumMg = foodItem ? foodItem.sodiumMgPer100g * factor : nonNegative(body.sodiumMg);
    const confidenceScore = nonNegative(body.confidenceScore);
    if (
      [calories, protein, carbs, fat, fiber, sugar, sodiumMg, confidenceScore].some(
        (value) => value === null,
      )
    ) {
      return NextResponse.json({ success: false, error: "Nilai nutrisi tidak valid." }, { status: 400 });
    }
    const source =
      typeof body.source === "string" &&
      ["MANUAL", "SCAN", "DATABASE", "IMPORT"].includes(body.source)
        ? body.source
        : "MANUAL";
    const imageUrl =
      body.imageUrl === undefined || body.imageUrl === null
        ? null
        : ownedPublicStorageUrl(body.imageUrl, user.authUserId, [
            "post-images",
          ]);
    if (body.imageUrl && !imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Foto makanan harus berasal dari upload pengguna sendiri.",
        },
        { status: 400 },
      );
    }
    const loggedAt =
      typeof body.loggedAt === "string" || typeof body.loggedAt === "number"
        ? new Date(body.loggedAt)
        : new Date();
    if (
      Number.isNaN(loggedAt.getTime()) ||
      loggedAt.getTime() > Date.now() + 60_000
    ) {
      return NextResponse.json(
        { success: false, error: "Waktu pencatatan tidak valid." },
        { status: 400 },
      );
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
        fiber: fiber ?? 0,
        sugar: sugar ?? 0,
        sodiumMg: sodiumMg ?? 0,
        mealType:
          typeof body.mealType === "string"
            ? body.mealType.trim().slice(0, 50) || null
            : null,
        source,
        isUserConfirmed: body.isUserConfirmed !== false,
        confidenceScore: confidenceScore ?? 0,
        imageUrl,
        recommendationText:
          typeof body.recommendationText === "string"
            ? body.recommendationText.trim() || null
            : null,
        loggedAt,
      },
      include: { foodItem: true },
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
