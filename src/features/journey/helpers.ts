import { JourneyRecord, HealthStoryDisplayData, HealthStoryEligibility, JourneyCategory } from "./types";
import { journeyRecords } from "./data";

export function getJourneyCategoryLabel(cat: JourneyCategory): string {
  switch (cat) {
    case "activity": return "Cardio & Mobility";
    case "nutrition": return "Nutrition & Eating";
    case "recovery": return "Recovery & Sleep";
    case "consistency": return "Consistency Streak";
    case "challenge": return "Active Challenge";
    case "health-pulse": return "Health Pulse";
    case "reflection": return "Personal Reflection";
    case "lifestyle": return "Healthy Habit";
    default: return "Other";
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
    case "circle": return "Healthy Circle";
    case "public": return "Aman Publik";
    default: return visibility;
  }
}

export function getJourneyVisibilityDescription(visibility: string): string {
  switch (visibility) {
    case "private": return "Hanya Anda yang dapat melihat catatan Journey ini.";
    case "circle": return "Bagikan ke anggota Healthy Circle Anda menggunakan rincian yang aman.";
    case "public": return "Layak dibagikan sebagai format Health Story publik.";
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
    reasons.push("Private records cannot be shared publicly.");
  }
  if (!record.shareEligible) {
    reasons.push("This record category is restricted from public sharing.");
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
    consistencyLabel: "Day 148",
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
