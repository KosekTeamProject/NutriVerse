"use client";

import type { ActivityKind, LatLng } from "@/lib/activity";

export type ActivityPngPayload = {
  readonly kind: ActivityKind;
  readonly route: readonly LatLng[];
  readonly distanceKm: number;
  readonly elapsedLabel: string;
  readonly paceLabel: string;
  readonly speedKmh: number;
  readonly estimatedXp: number;
  readonly isSimulation: boolean;
  readonly needsReview: boolean;
};

const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  walk: "Jalan Kaki",
  run: "Lari",
  bike: "Bersepeda",
};

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function drawRoute(
  context: CanvasRenderingContext2D,
  points: readonly LatLng[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (points.length < 2) {
    context.fillStyle = "#64748b";
    context.font = "600 28px Arial";
    context.textAlign = "center";
    context.fillText("Rute belum tersedia", x + width / 2, y + height / 2);
    return;
  }

  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  const minimumLatitude = Math.min(...latitudes);
  const maximumLatitude = Math.max(...latitudes);
  const minimumLongitude = Math.min(...longitudes);
  const maximumLongitude = Math.max(...longitudes);
  const span = Math.max(
    1e-6,
    maximumLatitude - minimumLatitude,
    maximumLongitude - minimumLongitude,
  );
  const padding = 42;
  const normalize = (point: LatLng) => ({
    x:
      x +
      padding +
      ((point.lng - minimumLongitude) / span) * (width - padding * 2),
    y:
      y +
      height -
      padding -
      ((point.lat - minimumLatitude) / span) * (height - padding * 2),
  });

  const gradient = context.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, "#10b981");
  gradient.addColorStop(1, "#38bdf8");
  context.strokeStyle = gradient;
  context.lineWidth = 16;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  points.forEach((point, index) => {
    const normalized = normalize(point);
    if (index === 0) context.moveTo(normalized.x, normalized.y);
    else context.lineTo(normalized.x, normalized.y);
  });
  context.stroke();

  const start = normalize(points[0]);
  const finish = normalize(points.at(-1) ?? points[0]);
  context.fillStyle = "#10b981";
  context.beginPath();
  context.arc(start.x, start.y, 20, 0, Math.PI * 2);
  context.fill();
  context.lineWidth = 8;
  context.strokeStyle = "#ffffff";
  context.stroke();
  context.fillStyle = "#38bdf8";
  context.beginPath();
  context.arc(finish.x, finish.y, 23, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

export async function downloadActivityPng(payload: ActivityPngPayload) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("CANVAS_NOT_AVAILABLE");

  const background = context.createLinearGradient(0, 0, 1080, 1350);
  background.addColorStop(0, "#f8fffb");
  background.addColorStop(0.62, "#eefbf5");
  background.addColorStop(1, "#edf8ff");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const logo = await loadImage("/brand/nutriverse-logo.svg");
    context.drawImage(logo, 72, 58, 260, 64);
  } catch {
    context.fillStyle = "#062c21";
    context.font = "900 34px Arial";
    context.textAlign = "left";
    context.fillText("NutriVerse", 72, 100);
  }

  context.fillStyle = payload.isSimulation ? "#e0f2fe" : "#dcfce7";
  roundedRect(context, 762, 60, 246, 58, 29);
  context.fill();
  context.fillStyle = payload.isSimulation ? "#0369a1" : "#047857";
  context.font = "800 21px Arial";
  context.textAlign = "center";
  context.fillText(payload.isSimulation ? "MODE SIMULASI" : "GPS TRACKING", 885, 96);

  context.fillStyle = "#64748b";
  context.font = "700 25px Arial";
  context.textAlign = "left";
  context.fillText(`${ACTIVITY_LABEL[payload.kind]} • Ringkasan Aktivitas`, 72, 180);

  context.fillStyle = "#052e23";
  context.font = "900 106px Arial";
  context.fillText(payload.distanceKm.toFixed(2), 72, 292);
  context.font = "800 38px Arial";
  context.fillStyle = "#475569";
  context.fillText("km", 370, 292);

  const metrics = [
    ["WAKTU", payload.elapsedLabel],
    ["PACE /KM", payload.paceLabel],
    ["KECEPATAN", `${payload.speedKmh.toFixed(1)} km/jam`],
    ["ESTIMASI XP", String(payload.estimatedXp)],
  ] as const;
  const metricWidth = 222;
  const metricGap = 16;
  metrics.forEach(([label, value], index) => {
    const x = 72 + index * (metricWidth + metricGap);
    context.fillStyle = index === 3 ? "#fff0dc" : "#ffffff";
    context.strokeStyle = index === 3 ? "#fed7aa" : "#dbe7df";
    context.lineWidth = 2;
    roundedRect(context, x, 338, metricWidth, 132, 24);
    context.fill();
    context.stroke();
    context.fillStyle = "#64748b";
    context.font = "700 17px Arial";
    context.textAlign = "center";
    context.fillText(label, x + metricWidth / 2, 379);
    context.fillStyle = index === 3 ? "#d97706" : "#052e23";
    context.font = "900 29px Arial";
    context.fillText(value, x + metricWidth / 2, 430);
  });

  context.fillStyle = "#ffffff";
  context.strokeStyle = "#dbe7df";
  context.lineWidth = 2;
  roundedRect(context, 72, 520, 936, 500, 36);
  context.fill();
  context.stroke();
  context.fillStyle = "#052e23";
  context.font = "900 28px Arial";
  context.textAlign = "left";
  context.fillText("Rute aktivitas", 108, 570);
  context.fillStyle = "#f0faf6";
  roundedRect(context, 108, 604, 864, 372, 28);
  context.fill();
  drawRoute(context, payload.route, 108, 604, 864, 372);

  context.fillStyle = payload.needsReview ? "#fff7ed" : "#ecfdf5";
  roundedRect(context, 72, 1060, 936, 116, 26);
  context.fill();
  context.fillStyle = payload.needsReview ? "#c2410c" : "#047857";
  context.font = "900 25px Arial";
  context.textAlign = "left";
  context.fillText(
    payload.needsReview ? "Perlu peninjauan" : "Lolos pemeriksaan demo",
    108,
    1110,
  );
  context.fillStyle = "#64748b";
  context.font = "500 20px Arial";
  context.fillText(
    payload.isSimulation
      ? "Data simulasi tidak digunakan untuk reward produksi."
      : "Keputusan reward final dilakukan oleh server NutriVerse.",
    108,
    1144,
  );

  context.fillStyle = "#64748b";
  context.font = "600 17px Arial";
  context.textAlign = "left";
  context.fillText(
    "Rute pada gambar dinormalisasi tanpa koordinat mentah.",
    72,
    1262,
  );
  context.textAlign = "right";
  context.fillText(new Date().toLocaleDateString("id-ID"), 1008, 1262);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png", 1),
  );
  if (!blob) throw new Error("PNG_EXPORT_FAILED");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `nutriverse-${payload.kind}-${Date.now()}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
