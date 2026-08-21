import { createHash } from "node:crypto";

export function discoveryParams(url: URL, defaultLimit = 12) {
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const requestedLimit = Number(url.searchParams.get("limit") ?? defaultLimit);
  const requestedRotation = Number(url.searchParams.get("rotation") ?? 0);
  return {
    query,
    cursor: (url.searchParams.get("cursor") ?? "").trim() || null,
    limit: Number.isFinite(requestedLimit) ? Math.min(20, Math.max(1, Math.trunc(requestedLimit))) : defaultLimit,
    rotation: Number.isFinite(requestedRotation) ? Math.min(10_000, Math.max(0, Math.trunc(requestedRotation))) : 0,
  };
}

export function stableDiscoveryOffset(total: number, userId: string, resource: string, rotation: number) {
  if (total <= 1) return 0;
  const day = new Date().toISOString().slice(0, 10);
  const digest = createHash("sha256").update(`${resource}:${userId}:${day}:${rotation}`).digest();
  return digest.readUInt32BE(0) % total;
}
