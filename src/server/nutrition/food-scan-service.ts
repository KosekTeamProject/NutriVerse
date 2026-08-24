import { randomUUID } from "node:crypto";
import { FOODS, type Food } from "@/lib/food";

export type FoodScanProvider = "n8n" | "openai-fallback" | "local-catalog";

export type FoodScanResult = {
  food: Food;
  provider: FoodScanProvider;
  requestId: string;
};

type ScanInput = {
  userId: string;
  query?: string;
  imageDataUrl?: string;
  imageUrl?: string;
};

const FOOD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "portion",
    "kcal",
    "protein",
    "carbs",
    "fat",
    "fiber",
    "sugar",
    "sodium",
    "vitamins",
  ],
  properties: {
    name: { type: "string", minLength: 1, maxLength: 200 },
    portion: { type: "string", minLength: 1, maxLength: 100 },
    kcal: { type: "number", minimum: 0, maximum: 5_000 },
    protein: { type: "number", minimum: 0, maximum: 1_000 },
    carbs: { type: "number", minimum: 0, maximum: 1_000 },
    fat: { type: "number", minimum: 0, maximum: 1_000 },
    fiber: { type: "number", minimum: 0, maximum: 1_000 },
    sugar: { type: "number", minimum: 0, maximum: 1_000 },
    sodium: { type: "number", minimum: 0, maximum: 20_000 },
    vitamins: { type: "string", maxLength: 300 },
  },
} as const;

function finiteInRange(value: unknown, maximum: number) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= maximum
    ? Math.round(value * 10) / 10
    : null;
}

function parseFood(value: unknown): Food | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const name =
    typeof row.name === "string"
      ? row.name.trim()
      : typeof row.foodName === "string"
        ? row.foodName.trim()
        : "";
  const portion = typeof row.portion === "string" ? row.portion.trim() : "";
  const kcal = finiteInRange(row.kcal ?? row.calories, 5_000);
  const protein = finiteInRange(row.protein, 1_000);
  const carbs = finiteInRange(row.carbs, 1_000);
  const fat = finiteInRange(row.fat, 1_000);
  const fiber = finiteInRange(row.fiber, 1_000);
  const sugar = finiteInRange(row.sugar, 1_000);
  const sodium = finiteInRange(row.sodium ?? row.sodiumMg, 20_000);
  const vitamins =
    typeof row.vitamins === "string" ? row.vitamins.trim().slice(0, 300) : "";
  if (
    !name ||
    name.length > 200 ||
    !portion ||
    portion.length > 100 ||
    [kcal, protein, carbs, fat, fiber, sugar, sodium].some(
      (entry) => entry === null,
    )
  ) {
    return null;
  }
  return {
    name,
    portion,
    kcal: kcal!,
    protein: protein!,
    carbs: carbs!,
    fat: fat!,
    fiber: fiber!,
    sugar: sugar!,
    sodium: sodium!,
    vitamins,
  };
}

function responseOutputText(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.output_text === "string") return row.output_text;
  if (!Array.isArray(row.output)) return null;
  for (const item of row.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string") return text;
    }
  }
  return null;
}

function unwrapFoodResponse(value: unknown): Food | null {
  let candidate = value;
  if (Array.isArray(candidate)) candidate = candidate[0];
  if (candidate && typeof candidate === "object") {
    const row = candidate as Record<string, unknown>;
    candidate = row.food ?? row.result ?? row.data ?? candidate;
  }
  const direct = parseFood(candidate);
  if (direct) return direct;
  const text = responseOutputText(candidate) ?? responseOutputText(value);
  if (!text) return null;
  try {
    return parseFood(JSON.parse(text));
  } catch {
    return null;
  }
}

function localCatalogResult(query?: string) {
  const normalized = query?.trim().toLocaleLowerCase("id-ID");
  if (!normalized) return null;
  return (
    FOODS.find((food) => normalized.includes(food.name.toLocaleLowerCase("id-ID"))) ??
    FOODS.find((food) =>
      food.name.toLocaleLowerCase("id-ID").includes(normalized),
    ) ??
    null
  );
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function scanWithN8n(
  input: ScanInput,
  requestId: string,
): Promise<Food | null> {
  const webhookUrl = process.env.N8N_SCAN_WEBHOOK_URL;
  if (!webhookUrl) return null;
  const timeout = Number(process.env.N8N_SCAN_TIMEOUT_MS ?? 30_000);
  const response = await fetchWithTimeout(
    webhookUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_SCAN_SHARED_SECRET
          ? {
              "x-nutriverse-agent-secret":
                process.env.N8N_SCAN_SHARED_SECRET,
            }
          : {}),
      },
      body: JSON.stringify({
        requestId,
        userId: input.userId,
        query: input.query,
        imageUrl: input.imageUrl,
        imageDataUrl: input.imageDataUrl,
        locale: "id-ID",
      }),
    },
    Number.isFinite(timeout) ? Math.min(Math.max(timeout, 5_000), 60_000) : 30_000,
  );
  if (!response.ok) {
    throw new Error(`N8N_SCAN_HTTP_${response.status}`);
  }
  const data = (await response.json().catch(() => null)) as unknown;
  const food = unwrapFoodResponse(data);
  if (!food) throw new Error("N8N_SCAN_INVALID_RESPONSE");
  return food;
}

async function scanWithOpenAi(input: ScanInput): Promise<Food | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const content: Record<string, unknown>[] = [
    {
      type: "input_text",
      text:
        `Identifikasi makanan dan estimasikan zat gizi untuk porsi yang terlihat. ` +
        `Gunakan konteks pengguna bila tersedia: ${input.query || "tidak ada"}. ` +
        "Jika foto ambigu, gunakan nama yang netral dan estimasi konservatif.",
    },
  ];
  const image = input.imageDataUrl ?? input.imageUrl;
  if (image) {
    content.push({ type: "input_image", image_url: image, detail: "low" });
  }
  const response = await fetchWithTimeout(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_FOOD_SCAN_MODEL ?? "gpt-5-mini",
        store: false,
        input: [{ role: "user", content }],
        text: {
          format: {
            type: "json_schema",
            name: "nutriverse_food_analysis",
            strict: true,
            schema: FOOD_SCHEMA,
          },
        },
      }),
    },
    30_000,
  );
  if (!response.ok) {
    throw new Error(`OPENAI_SCAN_HTTP_${response.status}`);
  }
  const data = (await response.json().catch(() => null)) as unknown;
  const food = unwrapFoodResponse(data);
  if (!food) throw new Error("OPENAI_SCAN_INVALID_RESPONSE");
  return food;
}

export async function analyzeFoodScan(input: ScanInput): Promise<FoodScanResult> {
  const requestId = randomUUID();
  const providerErrors: string[] = [];

  try {
    const food = await scanWithN8n(input, requestId);
    if (food) return { food, provider: "n8n", requestId };
  } catch (error) {
    providerErrors.push(error instanceof Error ? error.message : "N8N_SCAN_FAILED");
  }

  try {
    const food = await scanWithOpenAi(input);
    if (food) return { food, provider: "openai-fallback", requestId };
  } catch (error) {
    providerErrors.push(
      error instanceof Error ? error.message : "OPENAI_SCAN_FAILED",
    );
  }

  const localFood = localCatalogResult(input.query);
  if (localFood) {
    return { food: localFood, provider: "local-catalog", requestId };
  }

  throw new Error(
    providerErrors.length > 0
      ? `FOOD_SCAN_UNAVAILABLE:${providerErrors.join(",")}`
      : "FOOD_SCAN_NOT_CONFIGURED",
  );
}
