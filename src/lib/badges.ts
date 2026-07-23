export type Badge = { id: string; name: string; desc: string; icon: string; earned: boolean };

export const BADGES: Badge[] = [
  { id: "b1", name: "Langkah Pertama", desc: "Selesaikan aktivitas pertamamu", icon: "footprints", earned: true },
  { id: "b2", name: "7 Hari Konsisten", desc: "Aktif 7 hari berturut-turut tanpa terputus", icon: "flame", earned: true },
  { id: "b3", name: "30 Hari Aktif", desc: "Kumpulkan 30 hari aktif tervalidasi", icon: "crown", earned: true },
  { id: "b4", name: "Pertama Kali Lari", desc: "Selesaikan sesi aktivitas lari pertamamu", icon: "bike", earned: true },
  { id: "b5", name: "Pertama Kali Scan", desc: "Pindai & catat gizi makanan pertamamu", icon: "salad", earned: true },
  { id: "b6", name: "Healthy Week", desc: "Capai semua target sehat selama satu minggu", icon: "medal", earned: true },
  { id: "b7", name: "Hydration Hero", desc: "Capai target air 7 hari berturut-turut", icon: "droplets", earned: true },
  { id: "b8", name: "Early Bird", desc: "Berolahraga sebelum jam 7 pagi", icon: "sunrise", earned: true },
];

export type Achievement = { id: string; name: string; desc: string; now: number; goal: number; unit: string };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "a1", name: "7 Hari Konsisten", desc: "Menjaga ritme kebiasaan 7 hari berturut-turut", now: 7, goal: 7, unit: "hari" },
  { id: "a2", name: "30 Hari Aktif", desc: "Mengumpulkan 30 hari aktif tervalidasi", now: 30, goal: 30, unit: "hari" },
  { id: "a3", name: "Pertama Kali Lari", desc: "Mencatat aktivitas lari dengan GPS", now: 1, goal: 1, unit: "sesi" },
  { id: "a4", name: "Pertama Kali Scan", desc: "Menggunakan Pindai Makanan AI", now: 1, goal: 1, unit: "scan" },
  { id: "a5", name: "Healthy Week", desc: "Menyelesaikan seluruh target sehat mingguan", now: 7, goal: 7, unit: "hari" },
];
