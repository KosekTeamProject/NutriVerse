import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, finiteNumber, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const foods = await prisma.customFoodItem.findMany({
      where: { OR: [{ userId: user.id }, { isPublic: true }] },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, foods });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const food = await prisma.customFoodItem.create({
      data: {
        userId: user.id,
        name: stringValue(body?.name, "Nama makanan", { max: 150 }),
        caloriesPer100g: finiteNumber(body?.caloriesPer100g, "Kalori", { min: 0, max: 2000 }),
        proteinPer100g: finiteNumber(body?.proteinPer100g ?? 0, "Protein", { min: 0, max: 100 }),
        carbsPer100g: finiteNumber(body?.carbsPer100g ?? 0, "Karbohidrat", { min: 0, max: 100 }),
        fatPer100g: finiteNumber(body?.fatPer100g ?? 0, "Lemak", { min: 0, max: 100 }),
        isPublic: body?.isPublic === true,
      },
    });
    return NextResponse.json({ success: true, food }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
