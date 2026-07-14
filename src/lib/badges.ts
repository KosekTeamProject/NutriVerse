export type Badge = { id: string; name: string; desc: string; icon: string; earned: boolean };

export const BADGES: Badge[] = [
  { id: "b1", name: "Langkah Pertama", desc: "Selesaikan aktivitas pertamamu", icon: "footprints", earned: true },
  { id: "b2", name: "Streak 7 Hari", desc: "Aktif 7 hari berturut-turut", icon: "flame", earned: true },
  { id: "b3", name: "Hydration Hero", desc: "Capai target air 7 hari", icon: "droplets", earned: true },
  { id: "b4", name: "Early Bird", desc: "Berolahraga sebelum jam 7 pagi", icon: "sunrise", earned: true },
  { id: "b5", name: "Protein Master", desc: "Cukupi protein sepekan penuh", icon: "salad", earned: true },
  { id: "b6", name: "Century Rider", desc: "Bersepeda 100 km total", icon: "bike", earned: false },
  { id: "b7", name: "Marathoner", desc: "Tempuh 42 km lari kumulatif", icon: "medal", earned: false },
  { id: "b8", name: "Legend", desc: "Capai tier tertinggi", icon: "crown", earned: false },
];

export type Achievement = { id: string; name: string; desc: string; now: number; goal: number; unit: string };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "a1", name: "Penjelajah 50K", desc: "Tempuh 50 km lari kumulatif", now: 32, goal: 50, unit: "km" },
  { id: "a2", name: "Penakluk Challenge", desc: "Selesaikan 30 challenge", now: 18, goal: 30, unit: "challenge" },
  { id: "a3", name: "100 Hari Aktif", desc: "Kumpulkan 100 hari aktif", now: 45, goal: 100, unit: "hari" },
  { id: "a4", name: "Ajak Kawan", desc: "Undang 5 teman aktif", now: 3, goal: 5, unit: "teman" },
];
