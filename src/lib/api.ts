import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

function clientAddressHash(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "local";
  return createHash("sha256").update(address).digest("hex").slice(0, 24);
}

function enforceMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
) {
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

export async function enforceRateLimit(
  request: NextRequest,
  namespace: string,
  limit: number,
  windowMs: number,
) {
  const key = `${namespace}:${clientAddressHash(request)}`;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs * 2);
  try {
    const bucket = await prisma.apiRateLimitBucket.upsert({
      where: {
        bucketKey_windowStart: {
          bucketKey: key,
          windowStart,
        },
      },
      create: {
        bucketKey: key,
        windowStart,
        expiresAt,
      },
      update: {
        count: { increment: 1 },
        expiresAt,
      },
      select: { count: true },
    });
    if (bucket.count <= limit) return;
    throw new ApiRequestError(
      "Terlalu banyak percobaan. Tunggu sebentar lalu coba kembali.",
      429,
      "RATE_LIMITED",
    );
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const bucket = await prisma.apiRateLimitBucket.update({
        where: {
          bucketKey_windowStart: {
            bucketKey: key,
            windowStart,
          },
        },
        data: { count: { increment: 1 }, expiresAt },
        select: { count: true },
      });
      if (bucket.count <= limit) return;
      throw new ApiRequestError(
        "Terlalu banyak percobaan. Tunggu sebentar lalu coba kembali.",
        429,
        "RATE_LIMITED",
      );
    }

    // Database outages must not disable abuse protection entirely.
    enforceMemoryRateLimit(key, limit, windowMs);
  }
}

export function apiErrorResponse(error: unknown) {
  const requestId = randomUUID();
  if (error instanceof ApiAuthError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.status === 403 ? "FORBIDDEN" : "UNAUTHENTICATED",
        requestId,
      },
      { status: error.status, headers: { "x-request-id": requestId } },
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
