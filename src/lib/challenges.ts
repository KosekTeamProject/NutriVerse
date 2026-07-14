export type ChallengeTier = "Low" | "Medium" | "High";
export type ChallengePeriod = "harian" | "mingguan" | "bulanan";

export type Challenge = {
  id: string;
  title: string;
  desc: string;
  period: ChallengePeriod;
  tier: ChallengeTier;
  icon: string;
  now: number;
  goal: number;
  unit: string;
  xp: number;
  hp: number;
};

export const CHALLENGES: Challenge[] = [
  { id: "d1", title: "Hidrasi harian", desc: "Minum 8 gelas air hari ini", period: "harian", tier: "Low", icon: "droplet", now: 5, goal: 8, unit: "gelas", xp: 15, hp: 25 },
  { id: "d2", title: "Lari pagi", desc: "Tempuh 3 km dengan berlari", period: "harian", tier: "Medium", icon: "run", now: 3, goal: 3, unit: "km", xp: 30, hp: 50 },
  { id: "d3", title: "Tidur cukup", desc: "Tidur minimal 7 jam malam ini", period: "harian", tier: "Low", icon: "moon", now: 0, goal: 1, unit: "malam", xp: 15, hp: 20 },
  { id: "w1", title: "Jarak mingguan", desc: "Lari total 15 km minggu ini", period: "mingguan", tier: "Medium", icon: "run", now: 8.2, goal: 15, unit: "km", xp: 80, hp: 120 },
  { id: "w2", title: "Protein Master", desc: "Cukupi target protein 4 hari", period: "mingguan", tier: "Medium", icon: "salad", now: 2, goal: 4, unit: "hari", xp: 60, hp: 100 },
  { id: "w3", title: "Gowes jauh", desc: "Bersepeda total 40 km minggu ini", period: "mingguan", tier: "High", icon: "bike", now: 12, goal: 40, unit: "km", xp: 120, hp: 200 },
  { id: "m1", title: "Konsistensi bulanan", desc: "Aktif berolahraga 20 hari", period: "bulanan", tier: "High", icon: "target", now: 12, goal: 20, unit: "hari", xp: 200, hp: 350 },
  { id: "m2", title: "Perfect Week", desc: "Selesaikan semua target dalam 2 minggu penuh", period: "bulanan", tier: "High", icon: "trophy", now: 1, goal: 2, unit: "minggu", xp: 150, hp: 300 },
  { id: "m3", title: "Streak 30 hari", desc: "Jaga streak aktif selama sebulan", period: "bulanan", tier: "High", icon: "flame", now: 12, goal: 30, unit: "hari", xp: 250, hp: 500 },
];

export const TIER_STYLE: Record<ChallengeTier, string> = {
  Low: "bg-brand-soft text-brand",
  Medium: "bg-amber/15 text-amber",
  High: "bg-sky/10 text-sky",
};
