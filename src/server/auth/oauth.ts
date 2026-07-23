import type { NextRequest } from "next/server";

const DEFAULT_REDIRECT_PATH = "/dashboard";

export function safeRedirectPath(value: string | null, fallback = DEFAULT_REDIRECT_PATH) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const parsed = new URL(value, "http://nutriverse.local");
    if (parsed.origin !== "http://nutriverse.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function requestOrigin(request: NextRequest) {
  if (process.env.NODE_ENV === "development") return request.nextUrl.origin;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    return `${forwardedProto === "http" ? "http" : "https"}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}
