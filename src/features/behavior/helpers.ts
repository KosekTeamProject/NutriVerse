import { GoalCategory, GoalStatus, GoalTrustLevel, GoalSourceType, GoalPrivacy, HealthyDayStatus, StreakStatus, BehaviorGoal, HealthyDayHistoryPoint } from "./types";

export function getGoalCategoryLabel(cat: GoalCategory): string {
  switch (cat) {
    case "activity": return "Cardio & Activity";
    case "nutrition": return "Nutrition & Meal";
    case "hydration": return "Hydration & Water";
    case "recovery": return "Rest & Recovery";
    case "consistency": return "Habit Streak";
    case "lifestyle": return "Healthy Habit";
    case "challenge": return "Challenge Goal";
    default: return cat;
  }
}

export function getGoalStatusLabel(status: GoalStatus): string {
  switch (status) {
    case "not-started": return "Belum Dimulai";
    case "in-progress": return "Sedang Berjalan";
    case "completed": return "Selesai";
    case "still-growing": return "Masih Terbentuk";
    case "paused": return "Dijeda";
    case "unavailable": return "Tidak Tersedia";
    default: return status;
  }
}

export function getGoalTrustLabel(trust: GoalTrustLevel): string {
  switch (trust) {
    case "verified": return "Terverifikasi";
    case "partially-verified": return "Identitas Dikonfirmasi";
    case "self-reported": return "Dilaporkan Pengguna";
    case "simulated": return "Simulasi";
    case "missing": return "Data Belum Lengkap";
    default: return trust;
  }
}

export function getGoalSourceLabel(src: GoalSourceType): string {
  switch (src) {
    case "activity": return "Sensor & GPS Activity Tracker";
    case "food-entry": return "Catatan Pindai Nutrisi Terstruktur";
    case "hydration-log": return "Pencatat Hidrasi Mandiri Pengguna";
    case "recovery-log": return "Catatan Pemulihan Mandiri Pengguna";
    case "habit-log": return "Validasi mesin konsistensi";
    case "challenge": return "Metrik tantangan aktif";
    case "streak": return "Koordinat streak konsistensi";
    case "system": return "Modul validasi inti NutriVerse";
    case "manual-confirmation": return "Validasi penyelesaian manual pengguna";
    default: return src;
  }
}

export function getGoalPrivacyLabel(privacy: GoalPrivacy): string {
  switch (privacy) {
    case "private": return "Catatan Privat";
    case "circle": return "Healthy Circle";
    case "public": return "Aman Publik";
    default: return privacy;
  }
}

export function getHealthyDayStatusLabel(status: HealthyDayStatus): string {
  switch (status) {
    case "forming": return "Masih Terbentuk";
    case "achieved": return "Healthy Day Tercapai";
    case "recovery-day": return "Hari Pemulihan";
    case "incomplete-data": return "Data Belum Lengkap";
    default: return status;
  }
}

export function getStreakStatusLabel(status: StreakStatus): string {
  switch (status) {
    case "active": return "Aktif";
    case "protected": return "Dilindungi Pemulihan";
    case "paused": return "Dijeda";
    case "forming": return "Terbentuk";
    default: return status;
  }
}

export function getGoalCategoryTone(cat: GoalCategory): "brand" | "lime" | "sky" | "amber" {
  switch (cat) {
    case "activity": return "brand";
    case "nutrition": return "lime";
    case "hydration": return "sky";
    case "recovery": return "sky";
    case "consistency": return "amber";
    case "lifestyle": return "brand";
    case "challenge": return "amber";
    default: return "brand";
  }
}

export function sortGoalsByPriority(goals: readonly BehaviorGoal[]): readonly BehaviorGoal[] {
  // Deterministic order:
  // 1. in-progress with primary action
  // 2. other in-progress
  // 3. not-started
  // 4. still-growing
  // 5. completed
  // 6. paused
  // 7. unavailable
  const val: Record<GoalStatus, number> = {
    "in-progress": 1,
    "not-started": 3,
    "still-growing": 4,
    "completed": 5,
    "paused": 6,
    "unavailable": 7
  };

  return [...goals].sort((a, b) => {
    // If one is in-progress and has a primary action target, rank higher
    const aHasAction = a.status === "in-progress" && !!a.actionHref ? 0 : 1;
    const bHasAction = b.status === "in-progress" && !!b.actionHref ? 0 : 1;
    if (aHasAction !== bHasAction) return aHasAction - bHasAction;

    return val[a.status] - val[b.status];
  });
}

export function getHealthyDayAccessibleLabel(pt: HealthyDayHistoryPoint): string {
  const dateParts = pt.date.split("-");
  const yr = dateParts[0];
  const mo = dateParts[1];
  const dy = dateParts[2];
  const formattedDate = `${dy}/${mo}/${yr}`;

  switch (pt.status) {
    case "achieved":
      return `${formattedDate}: Healthy Day achieved with ${pt.meaningfulActionCount} meaningful actions.`;
    case "recovery-day":
      return `${formattedDate}: Recovery Day with ${pt.meaningfulActionCount} meaningful actions.`;
    case "forming":
      return `${formattedDate}: Day still forming with ${pt.meaningfulActionCount} meaningful actions.`;
    case "incomplete-data":
      return `${formattedDate}: More data needed, ${pt.dataCompleteness} percent complete.`;
    default:
      return `${formattedDate}: Status is ${pt.status}.`;
  }
}
