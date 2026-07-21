import { NextResponse } from "next/server";
import { searchUsdaFoodDataCentral } from "@/features/nutrition/providers/usda-fdc";
import { FOODS } from "@/lib/food";
import { ExternalFoodSearchResult } from "@/features/nutrition/providers/types";

export async function GET(request: Request) {
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

    return NextResponse.json({
      success: true,
      query: q,
      results: demoResults,
      totalHits: demoResults.length,
      source: "Demo NutriVerse",
      isMissingApiKey: true,
      isDemoFallback: true,
      error: providerResult.error,
    });
  }

  return NextResponse.json(providerResult);
}
