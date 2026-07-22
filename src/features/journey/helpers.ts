import { JourneyRecord, HealthStoryDisplayData, HealthStoryEligibility, JourneyCategory } from "./types";
import { journeyRecords } from "./data";

export function getJourneyCategoryLabel(cat: JourneyCategory): string {
  switch (cat) {
    case "activity": return "Kardio & Mobilitas";
    case "nutrition": return "Nutrisi & Pola Makan";
    case "recovery": return "Pemulihan & Tidur";
    case "consistency": return "Streak Konsistensi";
    case "challenge": return "Tantangan Aktif";
    case "health-pulse": return "Health Pulse";
    case "reflection": return "Refleksi Pribadi";
    case "lifestyle": return "Kebiasaan Sehat";
    default: return "Lainnya";
  }
}

export function getJourneyTrustLabel(trust: string): string {
  switch (trust) {
    case "verified": return "Terverifikasi";
    case "partially-verified": return "Identitas Dikonfirmasi";
    case "self-reported": return "Dilaporkan Pengguna";
    case "simulated": return "Simulasi";
    case "unverified": return "Belum Terverifikasi";
    default: return trust;
  }
}

export function getJourneyVisibilityLabel(visibility: string): string {
  switch (visibility) {
    case "private": return "Privat";
    case "circle": return "Lingkaran Sehat";
    case "public": return "Aman Publik";
    default: return visibility;
  }
}

export function getJourneyVisibilityDescription(visibility: string): string {
  switch (visibility) {
    case "private": return "Hanya Anda yang dapat melihat catatan Perjalanan ini.";
    case "circle": return "Dapat dibagikan kepada anggota Lingkaran Sehat dengan rincian yang aman.";
    case "public": return "Dapat dibagikan menggunakan template progres publik.";
    default: return "";
  }
}

export function getJourneyCategoryTone(cat: JourneyCategory): "brand" | "lime" | "sky" | "amber" {
  switch (cat) {
    case "activity": return "brand";
    case "nutrition": return "lime";
    case "recovery": return "sky";
    case "reflection": return "sky";
    case "consistency": return "amber";
    case "challenge": return "amber";
    case "health-pulse": return "brand";
    case "lifestyle": return "brand";
    default: return "brand";
  }
}

export function getJourneyById(id: string): JourneyRecord | undefined {
  return journeyRecords.find((r) => r.id === id);
}

export function getRecentJourneyRecords(count: number = 3): readonly JourneyRecord[] {
  return sortJourneyRecordsNewestFirst(journeyRecords).slice(0, count);
}

export function sortJourneyRecordsNewestFirst(records: readonly JourneyRecord[]): readonly JourneyRecord[] {
  return [...records].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export function getHealthStoryEligibility(record: JourneyRecord): HealthStoryEligibility {
  const reasons: string[] = [];
  if (record.visibility === "private") {
    reasons.push("Catatan privat tidak dapat dibagikan kepada publik.");
  }
  if (!record.shareEligible) {
    reasons.push("Kategori catatan ini tidak boleh dibagikan kepada publik.");
  }
  return {
    eligible: reasons.length === 0,
    reasons
  };
}

export function toHealthStoryDisplayData(record: JourneyRecord, travelerName: string): HealthStoryDisplayData {
  const eligibility = getHealthStoryEligibility(record);
  const primaryMetric = record.metrics[0];

  // Helper for static ISO formatting
  const formattedDate = record.occurredAt.split("T")[0];

  return {
    title: record.title,
    subtitle: record.summary,
    categoryLabel: getJourneyCategoryLabel(record.category),
    dateLabel: formattedDate,
    primaryMetricLabel: primaryMetric?.label || "",
    primaryMetricValue: primaryMetric?.value || "",
    healthPulseBefore: record.healthPulseBefore,
    healthPulseAfter: record.healthPulseAfter,
    healthPulseChange: record.healthPulseChange,
    safeReflection: record.reflection,
    consistencyLabel: "Hari ke-148",
    travelerDisplayName: travelerName,
    visibility: record.visibility,
    shareEligible: eligibility.eligible,
    blockedReasons: eligibility.reasons,
    containsSimulatedData: record.containsSimulatedData
  };
}

export function sanitizeHealthStoryFilename(title: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `nutriverse-${cleanTitle || "journey"}-story.png`;
}
