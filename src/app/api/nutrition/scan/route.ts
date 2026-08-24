import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { analyzeFoodScan } from "@/server/nutrition/food-scan-service";
import { sanitizeUploadedImage } from "@/server/storage/image-processing";

const MAX_SCAN_IMAGE_BYTES = 8 * 1024 * 1024;

function validatedImageUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2_000) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "nutrition:scan", 30, 60 * 60_000);
    const user = await requireCurrentUser();
    const contentType = request.headers.get("content-type") ?? "";
    let query: string | undefined;
    let imageUrl: string | undefined;
    let imageDataUrl: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const queryValue = form.get("query");
      const file = form.get("image");
      query =
        typeof queryValue === "string"
          ? queryValue.trim().slice(0, 500) || undefined
          : undefined;
      if (file instanceof File) {
        if (file.size <= 0 || file.size > MAX_SCAN_IMAGE_BYTES) {
          throw new ApiRequestError(
            "Ukuran foto makanan harus di bawah 8 MB.",
            400,
            "SCAN_IMAGE_SIZE",
          );
        }
        const sanitized = await sanitizeUploadedImage({
          bytes: Buffer.from(await file.arrayBuffer()),
          declaredContentType: file.type,
          maxBytes: 2 * 1024 * 1024,
          maxDimension: 1_600,
        });
        imageDataUrl = `data:${sanitized.contentType};base64,${sanitized.bytes.toString("base64")}`;
      }
    } else {
      const body = (await request.json().catch(() => null)) as
        | Record<string, unknown>
        | null;
      query =
        typeof body?.query === "string"
          ? body.query.trim().slice(0, 500) || undefined
          : undefined;
      imageUrl = validatedImageUrl(body?.imageUrl);
    }

    if (!imageDataUrl && !imageUrl && !query) {
      throw new ApiRequestError(
        "Ambil foto makanan atau isi nama makanan terlebih dahulu.",
        400,
        "SCAN_INPUT_REQUIRED",
      );
    }

    const result = await analyzeFoodScan({
      userId: user.id,
      query,
      imageDataUrl,
      imageUrl,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("FOOD_SCAN_UNAVAILABLE") ||
        error.message === "FOOD_SCAN_NOT_CONFIGURED")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Layanan analisis makanan belum aktif. Nyalakan workflow n8n atau isi OPENAI_API_KEY pada backend sebagai fallback.",
          code: "FOOD_SCAN_UNAVAILABLE",
        },
        { status: 503 },
      );
    }
    if (
      error instanceof Error &&
      [
        "UNSUPPORTED_IMAGE_TYPE",
        "INVALID_IMAGE_CONTENT",
        "PROCESSED_IMAGE_TOO_LARGE",
      ].includes(error.message)
    ) {
      return NextResponse.json(
        { success: false, error: "Foto tidak valid. Gunakan JPG, PNG, atau WebP." },
        { status: 400 },
      );
    }
    return apiErrorResponse(error);
  }
}
