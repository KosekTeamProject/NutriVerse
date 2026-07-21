// Business logic for nutrient scaling based on confirmed portion weight.
// Pure functions, no UI / presentation dependencies.

import { Nutrition } from "@/lib/food";
import { ExternalFoodSearchResult } from "../providers/types";

export interface ScaledNutritionResult {
  readonly confirmedGrams: number;
  readonly portionLabel: string;
  readonly nutrition: Nutrition;
  readonly missingNutrients: readonly string[];
}

export function scaleNutrientsFromPer100g(
  result: ExternalFoodSearchResult,
  confirmedGrams: number,
  portionQuantity: number = 1,
  unitLabel: string = "porsi"
): ScaledNutritionResult {
  const grams = Math.max(1, confirmedGrams);
  const factor = grams / 100;
  const missingNutrients: string[] = [];

  const n = result.nutrientsPer100g;

  const scale = (val?: number, name?: string): number => {
    if (val === undefined || isNaN(val)) {
      if (name) missingNutrients.push(name);
      return 0;
    }
    return Math.round(val * factor * 10) / 10;
  };

  const kcal = Math.round(scale(n.caloriesKcal, "Kalori"));
  const protein = scale(n.proteinG, "Protein");
  const carbs = scale(n.carbohydrateG, "Karbohidrat");
  const fat = scale(n.fatG, "Lemak");
  const fiber = scale(n.fiberG, "Serat");
  const sugar = scale(n.sugarG, "Gula");
  const sodium = Math.round(scale(n.sodiumMg, "Sodium"));

  const nutrition: Nutrition = {
    kcal,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    sodium,
    vitamins: "Berdasarkan rincian nutrisi eksternal",
  };

  return {
    confirmedGrams: grams,
    portionLabel: `${portionQuantity}x ${unitLabel} (${grams}g)`,
    nutrition,
    missingNutrients,
  };
}
