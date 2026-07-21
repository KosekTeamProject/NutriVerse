export type ChallengeCategory =
  | "cardio"
  | "strength"
  | "mobility"
  | "nutrition"
  | "recovery"
  | "habit";

export type ChallengeTier = "Low" | "Medium" | "High";
export type ChallengePeriod = "harian" | "mingguan" | "bulanan";
export type ChallengeSource = "gps" | "manual";

export type ChallengeMetric =
  | "lari_km"
  | "sepeda_km"
  | "jalan_km"
  | "aktivitas_km"
  | "hari_aktif"
  | "sesi"
  | "menit";

export type ChallengeTrustLevel = "verified" | "partially-verified" | "self-reported" | "simulated" | "mixed" | "missing";
export type ChallengeSourceMode = "automatic-activity" | "automatic-system" | "manual-confirmation" | "optional-selection" | "simulated";
export type ChallengeCompletionMode = "automatic" | "manual-confirmation" | "optional" | "preview-only";

export type Challenge = {
  id: string;
  title: string;
  desc: string;
  period: ChallengePeriod;
  tier: ChallengeTier;
  category: ChallengeCategory;
  /** "gps" = tercentang otomatis dari aktivitas; "manual" = ditandai sendiri */
  source: ChallengeSource;
  metric: ChallengeMetric;
  icon: string;
  goal: number;
  unit: string;
  /** hanya aktivitas terverifikasi GPS (cardio/jalan) yang memberi XP; lainnya 0 */
  xp: number;
  hp: number;
  optional?: boolean;

  // Upgrade compatibility fields
  trustLevel?: ChallengeTrustLevel;
  sourceMode?: ChallengeSourceMode;
  completionMode?: ChallengeCompletionMode;
  explanation?: string;
  actionLabel?: string;
  actionHref?: string;
  isMock?: boolean;
  version?: string;
};

export const TIER_STYLE: Record<ChallengeTier, string> = {
  Low: "bg-brand-soft text-brand border-brand/20",
  Medium: "bg-amber/10 text-amber border-amber/20",
  High: "bg-sky/10 text-sky border-sky/20",
};

export const CATEGORY_META: Record<
  ChallengeCategory,
  { label: string; icon: string; earnsXp: boolean }
> = {
  cardio: { label: "Cardio", icon: "activity", earnsXp: true },
  mobility: { label: "Mobility", icon: "walk", earnsXp: true },
  strength: { label: "Strength", icon: "dumbbell", earnsXp: false },
  nutrition: { label: "Nutrition", icon: "salad", earnsXp: false },
  recovery: { label: "Recovery", icon: "moon", earnsXp: false },
  habit: { label: "Healthy Habit", icon: "droplet", earnsXp: false },
};

/** Akumulasi aktivitas periode berjalan (DUMMY - nanti dari database). */
export const AUTO_PROGRESS: Record<ChallengeMetric, number> = {
  lari_km: 8.2,
  sepeda_km: 12,
  jalan_km: 7.2, // Aligns with the 7.2 km progress of Light Cardio Journey
  aktivitas_km: 24.7,
  hari_aktif: 4,
  sesi: 0,
  menit: 0,
};

/** Kolam challenge harian - business logic memilih 3 per hari (Revisi 2). */
export const DAILY_POOL: Challenge[] = [
  { id: "d-lari-3", title: "Lari 3 km", desc: "Tempuh 3 km dengan berlari hari ini", period: "harian", tier: "Medium", category: "cardio", source: "gps", metric: "lari_km", icon: "run", goal: 3, unit: "km", xp: 300, hp: 50, trustLevel: "verified", sourceMode: "automatic-activity", completionMode: "automatic", explanation: "Only trusted running activity contributes." },
  { id: "d-sepeda-8", title: "Gowes 8 km", desc: "Bersepeda 8 km hari ini", period: "harian", tier: "Medium", category: "cardio", source: "gps", metric: "sepeda_km", icon: "bike", goal: 8, unit: "km", xp: 360, hp: 50, trustLevel: "verified", sourceMode: "automatic-activity", completionMode: "automatic", explanation: "Only trusted cycling activity contributes." },
  { id: "d-jalan-2", title: "Jalan santai 2 km", desc: "Jalan kaki 2 km - cocok untuk semua", period: "harian", tier: "Low", category: "mobility", source: "gps", metric: "jalan_km", icon: "walk", goal: 2, unit: "km", xp: 120, hp: 25, trustLevel: "verified", sourceMode: "automatic-activity", completionMode: "automatic", explanation: "Only trusted walking activity contributes." },
  { id: "d-gerak-2", title: "Bergerak 2 km", desc: "Kombinasi lari/sepeda/jalan sejauh 2 km", period: "harian", tier: "Low", category: "cardio", source: "gps", metric: "aktivitas_km", icon: "activity", goal: 2, unit: "km", xp: 150, hp: 25, trustLevel: "verified", sourceMode: "automatic-activity", completionMode: "automatic", explanation: "Verified mixed workout data sources." },
  { id: "d-plank", title: "Plank 3 sesi", desc: "Lakukan plank 3 sesi, lalu tandai selesai", period: "harian", tier: "Low", category: "strength", source: "manual", metric: "sesi", icon: "dumbbell", goal: 3, unit: "sesi", xp: 0, hp: 30, trustLevel: "self-reported", sourceMode: "manual-confirmation", completionMode: "manual-confirmation", explanation: "Self-reported strength workouts." },
  { id: "d-pushup", title: "Push-up 3 set", desc: "Selesaikan 3 set push-up", period: "harian", tier: "Medium", category: "strength", source: "manual", metric: "sesi", icon: "dumbbell", goal: 3, unit: "set", xp: 0, hp: 40, trustLevel: "self-reported", sourceMode: "manual-confirmation", completionMode: "manual-confirmation", explanation: "Self-reported strength parameters." },
  { id: "d-stretch", title: "Peregangan 10 menit", desc: "Regangkan tubuh untuk mobilitas", period: "harian", tier: "Low", category: "mobility", source: "manual", metric: "menit", icon: "walk", goal: 10, unit: "menit", xp: 0, hp: 25, trustLevel: "self-reported", sourceMode: "manual-confirmation", completionMode: "manual-confirmation", explanation: "Self-reported recovery action." },
  { id: "d-air", title: "Hydration Rhythm", desc: "Cukupi hidrasi dengan minum 8 gelas air", period: "harian", tier: "Low", category: "habit", source: "manual", metric: "sesi", icon: "droplet", goal: 8, unit: "gelas", xp: 0, hp: 25, trustLevel: "self-reported", sourceMode: "manual-confirmation", completionMode: "manual-confirmation", explanation: "Self-reported hydration logging." },
  { id: "d-tidur", title: "Recovery Balance", desc: "Tidur 7 jam untuk mengistirahatkan tubuh", period: "harian", tier: "Low", category: "recovery", source: "manual", metric: "sesi", icon: "moon", goal: 1, unit: "malam", xp: 0, hp: 20, trustLevel: "self-reported", sourceMode: "manual-confirmation", completionMode: "manual-confirmation", explanation: "Self-reported sleep parameters." },
  { id: "d-sayur", title: "Porsi sayur", desc: "Konsumsi 2 porsi sayur hari ini", period: "harian", tier: "Low", category: "nutrition", source: "manual", metric: "sesi", icon: "salad", goal: 2, unit: "porsi", xp: 0, hp: 20, trustLevel: "partially-verified", sourceMode: "manual-confirmation", completionMode: "manual-confirmation", explanation: "Self-reported nutrition log." },
  { id: "d-protein", title: "Protein Consistency", desc: "Penuhi target protein harianmu", period: "harian", tier: "Medium", category: "nutrition", source: "manual", metric: "sesi", icon: "salad", goal: 1, unit: "hari", xp: 0, hp: 30, trustLevel: "partially-verified", sourceMode: "manual-confirmation", completionMode: "manual-confirmation", explanation: "Requires confirmed nutrition entries." },
  { id: "d-nafas", title: "Latihan napas", desc: "5 menit latihan pernapasan untuk relaksasi", period: "harian", tier: "Low", category: "recovery", source: "manual", metric: "menit", icon: "moon", goal: 5, unit: "menit", xp: 0, hp: 15, trustLevel: "self-reported", sourceMode: "manual-confirmation", completionMode: "manual-confirmation", explanation: "Self-reported relaxation exercise." },
];

export const WEEKLY: Challenge[] = [
  {
    id: "challenge-light-cardio",
    title: "Light Cardio Journey",
    desc: "Accumulate 10 km of walking or running this week.",
    period: "mingguan",
    tier: "Medium",
    category: "cardio",
    source: "gps",
    metric: "jalan_km",
    icon: "walk",
    goal: 10,
    unit: "km",
    xp: 180,
    hp: 60,
    trustLevel: "verified",
    sourceMode: "automatic-activity",
    completionMode: "automatic",
    explanation: "Only trusted walking or running activity contributes to this Challenge."
  },
  { id: "w-lari-15", title: "Jarak lari mingguan", desc: "Akumulasi lari 15 km minggu ini - cukup lari, terisi otomatis", period: "mingguan", tier: "Medium", category: "cardio", source: "gps", metric: "lari_km", icon: "run", goal: 15, unit: "km", xp: 800, hp: 120, trustLevel: "verified", sourceMode: "automatic-activity", completionMode: "automatic", explanation: "Only trusted running activity contributes." },
  { id: "w-sepeda-40", title: "Gowes jauh", desc: "Bersepeda total 40 km minggu ini", period: "mingguan", tier: "High", category: "cardio", source: "gps", metric: "sepeda_km", icon: "bike", goal: 40, unit: "km", xp: 900, hp: 200, trustLevel: "verified", sourceMode: "automatic-activity", completionMode: "automatic", explanation: "Only trusted cycling activity contributes." },
  { id: "w-aktif-5", title: "Seven-Day Foundation", desc: "Berolahraga minimal 5 hari minggu ini", period: "mingguan", tier: "Medium", category: "cardio", source: "gps", metric: "hari_aktif", icon: "flame", goal: 5, unit: "hari", xp: 400, hp: 100, trustLevel: "verified", sourceMode: "automatic-activity", completionMode: "automatic", explanation: "Only verified active days qualify." },
  { id: "w-strength", title: "Latihan kekuatan", desc: "3 sesi latihan kekuatan minggu ini", period: "mingguan", tier: "Medium", category: "strength", source: "manual", metric: "sesi", icon: "dumbbell", goal: 3, unit: "sesi", xp: 0, hp: 90, optional: true, trustLevel: "self-reported", sourceMode: "optional-selection", completionMode: "manual-confirmation", explanation: "Self-reported strength workouts." },
];

export const MONTHLY: Challenge[] = [
  { id: "m-gerak-80", title: "Jarak bulanan", desc: "Akumulasi 80 km lari + sepeda + jalan bulan ini", period: "bulanan", tier: "High", category: "cardio", source: "gps", metric: "aktivitas_km", icon: "target", goal: 80, unit: "km", xp: 2000, hp: 350, trustLevel: "verified", sourceMode: "automatic-activity", completionMode: "automatic", explanation: "Only trusted active segments qualify." },
  { id: "challenge-weekend-explorer", title: "Weekend Explorer", desc: "Jelajahi rute luar ruangan sepanjang 12 km", period: "bulanan", tier: "High", category: "cardio", source: "gps", metric: "jalan_km", icon: "target", goal: 12, unit: "km", xp: 600, hp: 150, optional: true, trustLevel: "verified", sourceMode: "optional-selection", completionMode: "automatic", explanation: "Only trusted walking activity contributes." },
  { id: "m-recovery", title: "Rutin pemulihan", desc: "12 sesi peregangan/pemulihan bulan ini", period: "bulanan", tier: "Medium", category: "recovery", source: "manual", metric: "sesi", icon: "moon", goal: 12, unit: "sesi", xp: 0, hp: 220, optional: true, trustLevel: "self-reported", sourceMode: "optional-selection", completionMode: "manual-confirmation", explanation: "Self-reported recovery sessions." },
];

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

/** Business logic memilih 3 challenge harian deterministik dari tanggal (Revisi 2). */
export function dailyPicks(date: Date = new Date()): Challenge[] {
  const n = DAILY_POOL.length;
  // Use fixed date component for deterministic selection to avoid client/server hydration drifts
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const start = dayOfYear(utcDate) % n;
  const step = 3;
  const picks: Challenge[] = [];
  const used = new Set<number>();
  let i = start;
  while (picks.length < 3 && used.size < n) {
    if (!used.has(i)) {
      used.add(i);
      picks.push(DAILY_POOL[i]);
    }
    i = (i + step) % n;
  }
  return picks;
}

/** Progres: challenge GPS otomatis dari aktivitas, manual dari tanda selesai (Revisi 14). */
export function currentProgress(c: Challenge, manualDone: Record<string, boolean>): number {
  if (c.source === "gps") return Math.min(c.goal, AUTO_PROGRESS[c.metric] ?? 0);
  return manualDone[c.id] ? c.goal : 0;
}

export function getChallengeById(id: string): Challenge | undefined {
  const all = [...DAILY_POOL, ...WEEKLY, ...MONTHLY];
  return all.find((c) => c.id === id);
}
