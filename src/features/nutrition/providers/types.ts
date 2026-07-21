// Normalized type for external nutrition search results.
// Returned only by server-side routes/providers. External provider payload shapes
// are normalized on the server before being sent to the client.

export interface ExternalFoodSearchResult {
  readonly provider: "usda-fdc" | "open-food-facts" | "demo-fallback";
  readonly externalId: string;
  readonly name: string;
  readonly description?: string;
  readonly brand?: string;
  readonly dataType?: string; // e.g. "Foundation", "Branded", "Survey (FPRD)"
  readonly servingSize?: number;
  readonly servingUnit?: string;
  readonly nutrientsPer100g: {
    readonly caloriesKcal?: number;
    readonly proteinG?: number;
    readonly carbohydrateG?: number;
    readonly fatG?: number;
    readonly fiberG?: number;
    readonly sugarG?: number;
    readonly sodiumMg?: number;
  };
  readonly sourceLabel: string;
}

export interface FoodSearchResponse {
  readonly success: boolean;
  readonly query: string;
  readonly results: readonly ExternalFoodSearchResult[];
  readonly totalHits?: number;
  readonly source: string;
  readonly isDemoFallback?: boolean;
  readonly isMissingApiKey?: boolean;
  readonly error?: string;
}
