import { HealthDimension, HealthPulseStatus, HealthPulseTrend, HealthDataTrustLevel, HealthPulseSnapshot } from "./types";
import { currentSnapshot, previousSnapshot } from "./data";

export function getHealthDimensionLabel(dim: HealthDimension): string {
  switch (dim) {
    case "nutrition": return "Nutrisi";
    case "activity": return "Aktivitas";
    case "sleep": return "Tidur";
    case "hydration": return "Hidrasi";
    case "weight": return "Manajemen Berat";
    case "consistency": return "Indikator Konsistensi";
    default: return dim;
  }
}

export function getHealthPulseStatusLabel(status: HealthPulseStatus): string {
  switch (status) {
    case "seed": return "Mulai";
    case "growing": return "Berkembang";
    case "balanced": return "Seimbang";
    case "flourishing": return "Sangat Baik";
    case "thrive": return "Optimal";
    default: return status;
  }
}

export function getHealthPulseStatusDescription(status: HealthPulseStatus): string {
  switch (status) {
    case "seed": return "Pemantauan kebiasaan sehat Anda baru saja dimulai.";
    case "growing": return "Anda mulai mencatat dan menjaga tindakan kesehatan dasar.";
    case "balanced": return "Perilaku kesehatan Anda menunjukkan stabilitas yang konsisten.";
    case "flourishing": return "Tingkat konsistensi yang tinggi mendukung sasaran kebugaran Anda.";
    case "thrive": return "Kebiasaan harian Anda terintegrasi secara optimal menjadi progres kesejahteraan.";
    default: return "";
  }
}

export function getHealthPulseTrendLabel(trend: HealthPulseTrend): string {
  switch (trend) {
    case "improving": return "Meningkat Sehat";
    case "stable": return "Stabil";
    case "recovering": return "Pemulihan";
    case "needs-attention": return "Masih ada ruang untuk berkembang";
    default: return trend;
  }
}

export function getHealthDataTrustLabel(trust: HealthDataTrustLevel): string {
  switch (trust) {
    case "trusted": return "Terverifikasi";
    case "partially-verified": return "Sebagian Terverifikasi";
    case "self-reported": return "Dilaporkan Pengguna";
    case "simulated": return "Simulasi";
    case "missing": return "Data Belum Lengkap";
    default: return trust;
  }
}

export function getHealthDimensionTone(dim: HealthDimension): "brand" | "lime" | "sky" | "amber" {
  switch (dim) {
    case "nutrition": return "lime";
    case "activity": return "brand";
    case "sleep": return "sky";
    case "hydration": return "sky";
    case "weight": return "amber";
    case "consistency": return "amber";
    default: return "brand";
  }
}

export function formatHealthPulseChange(change: number): string {
  if (change > 0) return `+${change.toFixed(1)}`;
  if (change < 0) return `${change.toFixed(1)}`;
  return "0.0";
}

export function getHealthPulseById(id: string): HealthPulseSnapshot | undefined {
  if (id === "health-pulse-current") return currentSnapshot;
  if (id === "health-pulse-previous") return previousSnapshot;
  return undefined;
}

export function getStrongestDimensionLabel(snapshot: HealthPulseSnapshot): string {
  return getHealthDimensionLabel(snapshot.strongestDimension);
}

export function getFocusDimensionLabel(snapshot: HealthPulseSnapshot): string {
  return getHealthDimensionLabel(snapshot.focusDimension);
}

export function getPrimaryHealthPulseReason(snapshot: HealthPulseSnapshot): string {
  return snapshot.reasons[0] || "Belum ada aktivitas tercatat hari ini.";
}

export function getHealthPulseAccessibleSummary(snapshot: HealthPulseSnapshot): string {
  return `Skor Health Pulse Anda adalah ${snapshot.score.toFixed(1)} dari 100 (${getHealthPulseStatusLabel(snapshot.status)}). Perubahan sebesar ${formatHealthPulseChange(snapshot.change)} dibanding sebelumnya, dengan tren ${getHealthPulseTrendLabel(snapshot.trend)}. Area terkuat adalah ${getStrongestDimensionLabel(snapshot)} dan fokus saat ini adalah ${getFocusDimensionLabel(snapshot)}.`;
}
