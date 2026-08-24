import assert from "node:assert/strict";
import test from "node:test";
import { analyzeFoodScan } from "./food-scan-service";

test("uses the local catalog for a known text query when AI is unavailable", async () => {
  const n8nUrl = process.env.N8N_SCAN_WEBHOOK_URL;
  const openAiKey = process.env.OPENAI_API_KEY;
  delete process.env.N8N_SCAN_WEBHOOK_URL;
  delete process.env.OPENAI_API_KEY;
  try {
    const result = await analyzeFoodScan({
      userId: "test-user",
      query: "berapa gizi satu porsi soto ayam?",
    });
    assert.equal(result.provider, "local-catalog");
    assert.equal(result.food.name, "Soto Ayam");
  } finally {
    if (n8nUrl) process.env.N8N_SCAN_WEBHOOK_URL = n8nUrl;
    if (openAiKey) process.env.OPENAI_API_KEY = openAiKey;
  }
});
