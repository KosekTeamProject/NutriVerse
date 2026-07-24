const PUBLIC_STORAGE_PREFIX = "/storage/v1/object/public/";

export function ownedPublicStorageUrl(
  value: unknown,
  authUserId: string | null,
  allowedBuckets: readonly string[],
) {
  if (typeof value !== "string" || !authUserId) return null;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;

  try {
    const expectedOrigin = new URL(baseUrl).origin;
    const parsed = new URL(value);
    if (parsed.origin !== expectedOrigin) return null;
    if (!parsed.pathname.startsWith(PUBLIC_STORAGE_PREFIX)) return null;
    const remainder = decodeURIComponent(
      parsed.pathname.slice(PUBLIC_STORAGE_PREFIX.length),
    );
    const [bucket, ownerId] = remainder.split("/");
    if (!allowedBuckets.includes(bucket) || ownerId !== authUserId) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function ownedStoragePath(
  value: unknown,
  authUserId: string | null,
) {
  if (
    typeof value !== "string" ||
    !authUserId ||
    value.length > 1_000
  ) {
    return null;
  }
  const normalized = value.replaceAll("\\", "/").replace(/^\/+/, "");
  if (
    !normalized.startsWith(`${authUserId}/`) ||
    normalized.includes("../") ||
    normalized.includes("\0")
  ) {
    return null;
  }
  return normalized;
}
