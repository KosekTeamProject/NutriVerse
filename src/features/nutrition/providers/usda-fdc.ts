// Server-only USDA FoodData Central provider module.
// Never imports client-side code, never exposes API keys to client.

import { ExternalFoodSearchResult, FoodSearchResponse } from "./types";

interface UsdaNutrient {
  readonly nutrientId?: number;
  readonly nutrientName?: string;
  readonly value?: number;
  readonly unitName?: string;
}

interface UsdaFoodItem {
  readonly fdcId: number;
  readonly description: string;
  readonly brandOwner?: string;
  readonly dataType?: string;
  readonly servingSize?: number;
  readonly servingSizeUnit?: string;
  readonly foodNutrients?: readonly UsdaNutrient[];
}

interface UsdaSearchResponse {
  readonly totalHits?: number;
  readonly foods?: readonly UsdaFoodItem[];
}

export async function searchUsdaFoodDataCentral(
  query: string,
  pageSize: number = 8
): Promise<FoodSearchResponse> {
  const apiKey = process.env.USDA_FDC_API_KEY;

  if (!apiKey || apiKey === "your_key_here") {
    return {
      success: false,
      query,
      results: [],
      source: "USDA FoodData Central",
      isMissingApiKey: true,
      error: "Pencarian nutrisi internet belum dikonfigurasi pada lingkungan ini (USDA_FDC_API_KEY). Gunakan contoh demo atau input manual sementara.",
    };
  }

  const cleanQuery = encodeURIComponent(query.trim());
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${cleanQuery}&pageSize=${pageSize}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (res.status === 429) {
      return {
        success: false,
        query,
        results: [],
        source: "USDA FoodData Central",
        error: "Sumber data nutrisi sedang membatasi permintaan (Rate Limit). Coba lagi beberapa saat.",
      };
    }

    if (!res.ok) {
      return {
        success: false,
        query,
        results: [],
        source: "USDA FoodData Central",
        error: `Gagal mengambil data dari USDA FDC (${res.status}).`,
      };
    }

    const data: UsdaSearchResponse = await res.json();
    const foods = data.foods || [];

    const results: ExternalFoodSearchResult[] = foods.map((item) => {
      const nutrients = item.foodNutrients || [];

      const getNutrientVal = (id: number, names: string[]): number | undefined => {
        const found = nutrients.find(
          (n) =>
            (n.nutrientId && n.nutrientId === id) ||
            (n.nutrientName && names.some((nm) => n.nutrientName?.toLowerCase().includes(nm.toLowerCase())))
        );
        return found?.value;
      };

      return {
        provider: "usda-fdc",
        externalId: String(item.fdcId),
        name: item.description,
        brand: item.brandOwner,
        dataType: item.dataType,
        servingSize: item.servingSize || 100,
        servingUnit: item.servingSizeUnit || "g",
        nutrientsPer100g: {
          caloriesKcal: getNutrientVal(1008, ["Energy", "KCAL"]),
          proteinG: getNutrientVal(1003, ["Protein"]),
          carbohydrateG: getNutrientVal(1005, ["Carbohydrate"]),
          fatG: getNutrientVal(1004, ["Total lipid (fat)", "Fat"]),
          fiberG: getNutrientVal(1079, ["Fiber"]),
          sugarG: getNutrientVal(2000, ["Sugars"]),
          sodiumMg: getNutrientVal(1093, ["Sodium"]),
        },
        sourceLabel: "USDA FoodData Central",
      };
    });

    return {
      success: true,
      query,
      results,
      totalHits: data.totalHits || results.length,
      source: "USDA FoodData Central",
    };
  } catch (err: unknown) {
    return {
      success: false,
      query,
      results: [],
      source: "USDA FoodData Central",
      error:
        err instanceof Error && err.name === "AbortError"
          ? "Permintaan ke sumber nutrisi melebihi batas waktu (Timeout)."
          : "Gagal terhubung ke layanan nutrisi online.",
    };
  }
}
