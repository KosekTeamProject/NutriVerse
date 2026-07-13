export type ActivityKind = "run" | "bike";

export const ACTIVITY: Record<ActivityKind, { label: string; xpPerKm: number; maxSpeedKmh: number }> = {
  run: { label: "Lari", xpPerKm: 100, maxSpeedKmh: 20 },
  bike: { label: "Bersepeda", xpPerKm: 45, maxSpeedKmh: 50 },
};

export type LatLng = { lat: number; lng: number };

export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function formatTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function paceMinPerKm(distanceM: number, elapsedSec: number): string {
  if (distanceM < 5 || elapsedSec < 1) return "--:--";
  const paceSecPerKm = elapsedSec / (distanceM / 1000);
  const m = Math.floor(paceSecPerKm / 60);
  const s = Math.floor(paceSecPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function speedKmh(distanceM: number, elapsedSec: number): number {
  if (elapsedSec < 1) return 0;
  return distanceM / 1000 / (elapsedSec / 3600);
}

export function computeXp(distanceM: number, kind: ActivityKind): number {
  return Math.floor((distanceM / 1000) * ACTIVITY[kind].xpPerKm);
}
