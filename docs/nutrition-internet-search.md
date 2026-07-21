# Internet-Based Manual Food Search

This document outlines the architecture, data sources, and safety boundaries for online nutrition search in NutriVerse.

## 1. Provider Architecture
- **Primary Source**: USDA FoodData Central (FDC) via server-only module `usda-fdc.ts`.
- **API Key Security**: Key configured in `USDA_FDC_API_KEY` (documented in `.env.example`). Never prefixed with `NEXT_PUBLIC_`, never exposed to browser client bundles or returned in JSON responses.
- **Route Handler**: `GET /api/nutrition/search?q=...` validates query length (2–80 characters), sanitizes input, and returns normalized `ExternalFoodSearchResult[]`.

## 2. Fallback & Build Reliability
- When `USDA_FDC_API_KEY` is missing or unconfigured:
  - Application build succeeds with zero errors.
  - Scanner and logger routes render without crashing.
  - Honest notice displayed to Traveler: `"Pencarian nutrisi internet belum dikonfigurasi pada lingkungan ini."`
  - Local demo food entries remain fully available as fallback.

## 3. Two-Step Confirmation & Nutrient Scaling
1. **Identity Confirmation**: Traveler verifies match (`"Apakah makanan ini sudah sesuai?"`) before portion scaling.
2. **Portion Confirmation**: Traveler selects portion unit and confirms estimated weight in grams.
3. **Business Logic Scaling**: Formula `scaledValue = nutrientPer100g * confirmedGrams / 100` scales calories, protein, carbs, fat, fiber, sugar, and sodium.
4. **Source Attribution & Limitations**: Displayed with `"Informasi nutrisi berasal dari basis data eksternal... Nilainya tetap berupa estimasi"`.
