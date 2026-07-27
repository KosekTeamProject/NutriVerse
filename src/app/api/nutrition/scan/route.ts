import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await requireCurrentUser();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Payload tidak valid." }, { status: 400 });
    }

    const { imageUrl, query } = body;
    if (!imageUrl && (!query || !query.trim())) {
      return NextResponse.json(
        { success: false, error: "Harus menyertakan gambar makanan atau teks pencarian." },
        { status: 400 }
      );
    }

    const n8nWebhookUrl = process.env.N8N_SCAN_WEBHOOK_URL;
    const n8nSharedSecret = process.env.N8N_SCAN_SHARED_SECRET;

    if (!n8nWebhookUrl) {
      return NextResponse.json(
        { success: false, error: "Konfigurasi n8n scan tidak ditemukan pada server." },
        { status: 500 }
      );
    }

    // Set up a 15-second timeout for the n8n request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(n8nSharedSecret ? { "x-nutriverse-agent-secret": n8nSharedSecret } : {}),
        },
        body: JSON.stringify({ imageUrl, query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`n8n HTTP ${response.status}: ${errorText}`);
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Respons dari server analisis tidak berformat JSON.");
      }

      // If n8n returns an array (common default response behavior if array of objects is returned)
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      // Basic validation of fields returned from n8n
      const foodName = data.name || data.foodName || query || "Makanan Teranalisis";
      const portion = data.portion || "1 porsi";
      const kcal = typeof data.kcal === "number" ? data.kcal : (data.calories || 250);
      const protein = typeof data.protein === "number" ? data.protein : 0;
      const carbs = typeof data.carbs === "number" ? data.carbs : 0;
      const fat = typeof data.fat === "number" ? data.fat : 0;
      const fiber = typeof data.fiber === "number" ? data.fiber : 0;
      const sugar = typeof data.sugar === "number" ? data.sugar : 0;
      const sodium = typeof data.sodium === "number" ? data.sodium : (data.sodiumMg || 0);
      const vitamins = data.vitamins || "A, B";

      return NextResponse.json({
        success: true,
        food: {
          name: foodName,
          portion,
          kcal,
          protein,
          carbs,
          fat,
          fiber,
          sugar,
          sodium,
          vitamins,
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error("Fetch to n8n scan webhook failed:", fetchError);
      
      const isTimeout = fetchError.name === "AbortError";
      const errMsg = isTimeout 
        ? "Analisis makanan melebihi batas waktu (timeout 15s). Coba lagi beberapa saat lagi." 
        : `Gagal menganalisis gizi makanan: ${fetchError.message || "Unknown error"}`;
        
      return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
    }
  } catch (error) {
    return apiErrorResponse(error);
  }
}
