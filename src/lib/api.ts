import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ApiAuthError } from "@/lib/auth";

type RateBucket = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as {
  nutriverseRateBuckets?: Map<string, RateBucket>;
};
const rateBuckets =
  globalForRateLimit.nutriverseRateBuckets ?? new Map<string, RateBucket>();
globalForRateLimit.nutriverseRateBuckets = rateBuckets;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code = "INVALID_REQUEST",
  ) {
    super(message);
  }
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    throw new ApiRequestError("Origin permintaan tidak diizinkan.", 403, "ORIGIN_REJECTED");
  }
}

export function enforceRateLimit(
  request: NextRequest,
  namespace: string,
  limit: number,
  windowMs: number,
) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = `${namespace}:${forwarded || request.headers.get("x-real-ip") || "local"}`;
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) {
    throw new ApiRequestError(
      "Terlalu banyak percobaan. Tunggu sebentar lalu coba kembali.",
      429,
      "RATE_LIMITED",
    );
  }
  current.count += 1;
}

export function apiErrorResponse(error: unknown) {
  const requestId = randomUUID();
  if (error instanceof ApiAuthError) {
    return NextResponse.json(
      { success: false, error: error.message, code: "UNAUTHENTICATED", requestId },
      { status: 401, headers: { "x-request-id": requestId } },
    );
  }
  if (error instanceof ApiRequestError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code, requestId },
      { status: error.status, headers: { "x-request-id": requestId } },
    );
  }
  console.error(`[${requestId}] Unhandled API error`, error);
  return NextResponse.json(
    {
      success: false,
      error: "Terjadi gangguan pada server. Silakan coba kembali.",
      code: "INTERNAL_ERROR",
      requestId,
    },
    { status: 500, headers: { "x-request-id": requestId } },
  );
}

export function stringValue(
  value: unknown,
  field: string,
  options: { min?: number; max?: number; optional: true },
): string | undefined;
export function stringValue(
  value: unknown,
  field: string,
  options?: { min?: number; max?: number; optional?: false },
): string;
export function stringValue(
  value: unknown,
  field: string,
  options: { min?: number; max?: number; optional?: boolean } = {},
): string | undefined {
  if ((value === undefined || value === null) && options.optional) return undefined;
  if (typeof value !== "string") {
    throw new ApiRequestError(`${field} harus berupa teks.`);
  }
  const clean = value.trim();
  const min = options.min ?? 1;
  const max = options.max ?? 500;
  if (clean.length < min || clean.length > max) {
    throw new ApiRequestError(`${field} harus berisi ${min}-${max} karakter.`);
  }
  return clean;
}

export function finiteNumber(
  value: unknown,
  field: string,
  options: { min?: number; max?: number; optional: true },
): number | undefined;
export function finiteNumber(
  value: unknown,
  field: string,
  options?: { min?: number; max?: number; optional?: false },
): number;
export function finiteNumber(
  value: unknown,
  field: string,
  options: { min?: number; max?: number; optional?: boolean } = {},
): number | undefined {
  if ((value === undefined || value === null || value === "") && options.optional) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ApiRequestError(`${field} harus berupa angka.`);
  }
  if (options.min !== undefined && value < options.min) {
    throw new ApiRequestError(`${field} minimal ${options.min}.`);
  }
  if (options.max !== undefined && value > options.max) {
    throw new ApiRequestError(`${field} maksimal ${options.max}.`);
  }
  return value;
}

export function stringArray(value: unknown, field: string, maxItems = 20) {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new ApiRequestError(`${field} tidak valid.`);
  }
  return value.map((item) => stringValue(item, field, { max: 100 }));
}
