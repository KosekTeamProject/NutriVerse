export type RewardCategory = "Badge" | "Frame" | "Voucher" | "Merch";

export type Reward = {
  id: string;
  name: string;
  desc: string;
  category: RewardCategory;
  hp: number;
  icon: string;
  partner?: string;
};

export const REWARDS: Reward[] = [
  { id: "b1", name: "Badge Iron Streak", desc: "Lencana koleksi untuk konsistensi", category: "Badge", hp: 300, icon: "award" },
  { id: "b2", name: "Gelar Nutrition Guardian", desc: "Title eksklusif di profilmu", category: "Badge", hp: 500, icon: "crown" },
  { id: "f1", name: "Frame Emerald", desc: "Bingkai foto profil hijau khas", category: "Frame", hp: 400, icon: "frame" },
  { id: "f2", name: "Frame Animasi Legend", desc: "Bingkai animasi premium tier atas", category: "Frame", hp: 1200, icon: "sparkles" },
  { id: "v1", name: "Makan Sehat Kampus", desc: "Diskon menu di kantin sehat", category: "Voucher", hp: 350, icon: "utensils", partner: "Kantin Sehat AMIKOM" },
  { id: "v2", name: "Voucher Gym 1 Hari", desc: "Akses fitness center gratis", category: "Voucher", hp: 600, icon: "dumbbell", partner: "FitZone" },
  { id: "v3", name: "Diskon 20% Suplemen", desc: "Potongan pembelian di toko mitra", category: "Voucher", hp: 800, icon: "ticket", partner: "NutriShop" },
  { id: "m1", name: "Botol Minum NutriVerse", desc: "Tumbler branded 750 ml", category: "Merch", hp: 900, icon: "bottle" },
  { id: "m2", name: "Kaos Olahraga NutriVerse", desc: "Jersey dryfit edisi season", category: "Merch", hp: 1500, icon: "shirt" },
];

export const CAT_STYLE: Record<RewardCategory, string> = {
  Badge: "bg-amber/15 text-amber",
  Frame: "bg-sky/10 text-sky",
  Voucher: "bg-brand-soft text-brand",
  Merch: "bg-chart-5/15 text-chart-5",
};
