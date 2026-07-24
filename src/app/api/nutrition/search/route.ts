import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { searchUsdaFoodDataCentral } from "@/features/nutrition/providers/usda-fdc";
import { FOODS } from "@/lib/food";
import { ExternalFoodSearchResult } from "@/features/nutrition/providers/types";
import {
  apiErrorResponse,
  enforceRateLimit,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "nutrition:search", 60, 60_000);
    await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 2) {
      return NextResponse.json(
        {
          success: false,
          query: q,
          results: [],
          error: "Kata kunci pencarian minimal 2 karakter.",
        },
        { status: 400 }
      );
    }

    if (q.length > 80) {
      return NextResponse.json(
        {
          success: false,
          query: q,
          results: [],
          error: "Kata kunci pencarian maksimal 80 karakter.",
        },
        { status: 400 }
      );
    }
    const normalizedQuery = q.toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
    const queryHash = createHash("sha256")
      .update(normalizedQuery)
      .digest("hex");
    const cached = await prisma.nutritionSearchCache.findFirst({
      where: { queryHash, expiresAt: { gt: new Date() } },
    });
    if (cached) {
      return NextResponse.json({
        ...(cached.responseJson as Record<string, unknown>),
        cacheHit: true,
      });
    }

    // Attempt server-side USDA search
    const providerResult = await searchUsdaFoodDataCentral(q);

    // If missing key or error, supplement with local demo fallback matches
    if (!providerResult.success && providerResult.isMissingApiKey) {
      const localMatches = FOODS.filter((f) =>
        f.name.toLowerCase().includes(q.toLowerCase())
      );

      const demoResults: ExternalFoodSearchResult[] = localMatches.map((f, idx) => ({
        provider: "demo-fallback",
        externalId: `demo-local-${idx}`,
        name: f.name,
        description: `Contoh demo lokal (${f.portion})`,
        servingSize: 100,
        servingUnit: "g",
        nutrientsPer100g: {
          caloriesKcal: f.kcal,
          proteinG: f.protein,
          carbohydrateG: f.carbs,
          fatG: f.fat,
          fiberG: f.fiber,
          sugarG: f.sugar,
          sodiumMg: f.sodium,
        },
        sourceLabel: "Demo NutriVerse",
      }));

      const response = {
        success: true,
        query: q,
        results: demoResults,
        totalHits: demoResults.length,
        source: "Demo NutriVerse",
        isMissingApiKey: true,
        isDemoFallback: true,
        error: providerResult.error,
      };
      const cachedResponse = JSON.parse(
        JSON.stringify(response),
      ) as Prisma.InputJsonValue;
      await prisma.nutritionSearchCache.upsert({
        where: { queryHash },
        create: {
          queryHash,
          queryText: normalizedQuery,
          responseJson: cachedResponse,
          expiresAt: new Date(Date.now() + 6 * 60 * 60_000),
        },
        update: {
          queryText: normalizedQuery,
          responseJson: cachedResponse,
          expiresAt: new Date(Date.now() + 6 * 60 * 60_000),
        },
      });
      return NextResponse.json({ ...response, cacheHit: false });
    }

    if (providerResult.success) {
      await prisma.nutritionSearchCache.upsert({
        where: { queryHash },
        create: {
          queryHash,
          queryText: normalizedQuery,
          responseJson: providerResult as unknown as Prisma.InputJsonValue,
          expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
        },
        update: {
          queryText: normalizedQuery,
          responseJson: providerResult as unknown as Prisma.InputJsonValue,
          expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
        },
      });
    }
    return NextResponse.json({ ...providerResult, cacheHit: false });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
