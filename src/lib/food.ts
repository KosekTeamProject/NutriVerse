export type Nutrition = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number; // mg
  vitamins: string;
};

export type Food = Nutrition & {
  name: string;
  portion: string;
};

// Upgraded types for trust and analysis
export type NutritionTrustLevel = "confirmed" | "estimated" | "self-reported" | "simulated" | "missing";
export type FoodAnalysisStatus = "ready" | "analyzing" | "completed" | "needs-confirmation" | "unavailable" | "error";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type NutritionSourceMode = "image-upload" | "camera" | "manual-entry" | "deterministic-demo" | "legacy-local" | "server-analysis";
export type NutritionPrivacy = "private" | "circle" | "public-summary";

export interface UpgradedFoodEntry {
  readonly id: string;
  readonly title: string;
  readonly foods: readonly string[];
  readonly mealType: MealType;
  readonly status: FoodAnalysisStatus;
  readonly sourceMode: NutritionSourceMode;
  readonly trustLevel: NutritionTrustLevel;
  readonly nutrition: Nutrition;
  readonly burn: { run: number; bike: number; walk: number };
  readonly activityRec: string;
  readonly insight: string;
  readonly hydrationContext?: string;
  readonly summary: string;
  readonly limitation: string;
  readonly privacy: NutritionPrivacy;
  readonly date: string;
  readonly portion: string;
  readonly isMock?: boolean;
  readonly version?: string;
}

export const FOODS: Food[] = [
  { name: "Nasi Goreng", kcal: 333, protein: 9, carbs: 44, fat: 12, fiber: 2, sugar: 3, sodium: 640, vitamins: "B1, B3", portion: "1 piring" },
  { name: "Ayam Geprek + Nasi", kcal: 620, protein: 34, carbs: 58, fat: 28, fiber: 3, sugar: 4, sodium: 980, vitamins: "B6, B12", portion: "1 porsi" },
  { name: "Gado-gado", kcal: 295, protein: 12, carbs: 30, fat: 15, fiber: 6, sugar: 8, sodium: 520, vitamins: "A, C, K", portion: "1 porsi" },
  { name: "Soto Ayam", kcal: 240, protein: 18, carbs: 20, fat: 9, fiber: 2, sugar: 3, sodium: 720, vitamins: "A, B3", portion: "1 mangkuk" },
  { name: "Bakso", kcal: 330, protein: 20, carbs: 30, fat: 14, fiber: 1, sugar: 2, sodium: 900, vitamins: "B12", portion: "1 mangkuk" },
  { name: "Mie Goreng", kcal: 380, protein: 10, carbs: 52, fat: 14, fiber: 3, sugar: 5, sodium: 850, vitamins: "B1", portion: "1 piring" },
  { name: "Rendang + Nasi", kcal: 680, protein: 30, carbs: 55, fat: 36, fiber: 4, sugar: 3, sodium: 760, vitamins: "B12, Zat besi", portion: "1 porsi" },
  { name: "Salad Buah", kcal: 180, protein: 4, carbs: 34, fat: 4, fiber: 5, sugar: 26, sodium: 60, vitamins: "A, C", portion: "1 mangkuk" },
  { name: "Nasi Padang", kcal: 640, protein: 24, carbs: 70, fat: 28, fiber: 5, sugar: 4, sodium: 900, vitamins: "A, B12", portion: "1 porsi" },
  { name: "Sate Ayam + Lontong", kcal: 450, protein: 26, carbs: 40, fat: 18, fiber: 2, sugar: 6, sodium: 780, vitamins: "B3, B6", portion: "10 tusuk" },
  { name: "Pecel Lele + Nasi", kcal: 520, protein: 28, carbs: 48, fat: 22, fiber: 3, sugar: 3, sodium: 700, vitamins: "D, B12", portion: "1 porsi" },
  { name: "Nasi Uduk", kcal: 350, protein: 8, carbs: 50, fat: 12, fiber: 2, sugar: 2, sodium: 560, vitamins: "B1", portion: "1 porsi" },
  { name: "Telur Dadar", kcal: 150, protein: 10, carbs: 2, fat: 11, fiber: 0, sugar: 1, sodium: 210, vitamins: "A, D, B12", portion: "1 butir" },
  { name: "Tempe Goreng", kcal: 120, protein: 8, carbs: 6, fat: 8, fiber: 3, sugar: 1, sodium: 180, vitamins: "B2, B12", portion: "2 potong" },
  { name: "Pisang", kcal: 90, protein: 1, carbs: 23, fat: 0, fiber: 3, sugar: 12, sodium: 1, vitamins: "B6, C", portion: "1 buah" },
];

export function searchFoods(query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOODS;
  return FOODS.filter((f) => f.name.toLowerCase().includes(q));
}

export type Verdict = { label: string; tone: "brand" | "amber" | "destructive" };

export function verdict(kcal: number): Verdict {
  if (kcal <= 300) return { label: "Ringan", tone: "brand" };
  if (kcal <= 550) return { label: "Sedang", tone: "amber" };
  return { label: "Tinggi kalori", tone: "destructive" };
}

export function burnMinutes(kcal: number): { run: number; bike: number; walk: number } {
  return {
    run: Math.max(1, Math.round(kcal / 10)),
    bike: Math.max(1, Math.round(kcal / 7)),
    walk: Math.max(1, Math.round(kcal / 4)),
  };
}

export type HealthIndicatorLevel = "sangat-baik" | "baik" | "cukup" | "perlu-diperhatikan" | "kurang-sehat";

export type HealthIndicator = {
  level: HealthIndicatorLevel;
  label: string;
  badgeClass: string;
  reasons: string[];
  nutritionInsight: string;
  healthyAlternative: string;
  portionAdvice: string;
};

export function getHealthIndicator(nutrition: Nutrition): HealthIndicator {
  const { protein, carbs, fat, fiber, sugar, sodium, kcal } = nutrition;
  const reasons: string[] = [];

  // Determine specific reasons
  if (protein >= 20) reasons.push("Protein sangat baik.");
  if (fiber >= 5) reasons.push("Serat melimpah.");
  if (sugar > 18) reasons.push("Tinggi gula sederhana.");
  else if (sugar <= 5) reasons.push("Rendah gula sederhana.");
  if (sodium > 750) reasons.push("Sodium cukup tinggi.");
  if (fat > 25) reasons.push("Lemak jenuh cukup tinggi.");
  if (fiber < 3 && carbs > 40) reasons.push("Serat masih rendah.");

  // Determine level
  if (sugar <= 10 && protein >= 18 && fiber >= 4 && fat <= 18) {
    return {
      level: "sangat-baik",
      label: "Sangat Baik",
      badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
      reasons: reasons.length ? reasons : ["Gizi seimbang & kaya nutrisi."],
      nutritionInsight: "Makanan ini sangat cocok dikonsumsi sebelum atau setelah olahraga untuk pemulihan otot.",
      healthyAlternative: "Pilihan sudah sangat baik! Bisa ditambahkan potongan buah segar atau biji-bijian untuk variasi.",
      portionAdvice: "Porsi saat ini sudah ideal untuk kebutuhan tubuhmu."
    };
  }

  if (sugar <= 15 && (protein >= 12 || fiber >= 3) && fat <= 22) {
    return {
      level: "baik",
      label: "Baik",
      badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
      reasons: reasons.length ? reasons : ["Makronutrisi seimbang."],
      nutritionInsight: "Memberikan energi stabil untuk aktivitas harian tanpa memicu lonjakan gula darah drastis.",
      healthyAlternative: "Bisa dipadukan dengan sayuran hijau untuk menambah serat dan mikronutrisi harian.",
      portionAdvice: "Porsi saat ini sudah sesuai."
    };
  }

  if (sugar <= 22 && fat <= 28 && kcal <= 550) {
    return {
      level: "cukup",
      label: "Cukup",
      badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
      reasons: reasons.length ? reasons : ["Karbohidrat cukup dominan.", "Serat masih bisa ditingkatkan."],
      nutritionInsight: "Menyediakan sumber energi cepat. Disarankan untuk mendukung aktivitas harian yang aktif.",
      healthyAlternative: "Nasi putih dapat diganti sebagian dengan nasi merah atau gandum utuh.",
      portionAdvice: "Porsi saat ini sudah sesuai untuk aktivitas harianmu."
    };
  }

  if (sugar > 22 || sodium > 800 || fat > 28) {
    return {
      level: "perlu-diperhatikan",
      label: "Masih ada ruang untuk berkembang",
      badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
      reasons: reasons.length ? reasons : ["Tinggi gula sederhana atau sodium."],
      nutritionInsight: "Tidak apa-apa menikmati makanan ini! Cukup imbangi dengan minum 1-2 gelas air putih segar.",
      healthyAlternative: "Coba padukan dengan potongan buah utuh atau infused water untuk menambah kesegaran.",
      portionAdvice: "Bisa dikurangi sedikit porsinya jika ingin energi tubuh terasa lebih stabil."
    };
  }

  return {
    level: "kurang-sehat",
    label: "Masih ada ruang untuk berkembang",
    badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
    reasons: reasons.length ? reasons : ["Tinggi gula & lemak jenuh."],
    nutritionInsight: "Nikmati hidangan ini secara tenang tanpa rasa bersalah. Kamu bisa menyeimbangkannya dengan asupan sayur & hidrasi air sepanjang hari.",
    healthyAlternative: "Pilih versi kukus/rebus pada kesempatan berikutnya atau ganti camilan dengan buah-buahan segar.",
    portionAdvice: "Bisa dinikmati bersama teman atau dikurangi sedikit porsinya agar tetap nyaman di perut."
  };
}

export type FoodAnalysis = {
  nutrition: Nutrition;
  burn: { run: number; bike: number; walk: number };
  activityRec: string;
  insight: string;
  healthIndicator: HealthIndicator;
};

export function analyze(food: Food, portion: number): FoodAnalysis {
  const scale = (n: number) => Math.round(n * portion);
  const nutrition: Nutrition = {
    kcal: scale(food.kcal),
    protein: scale(food.protein),
    carbs: scale(food.carbs),
    fat: scale(food.fat),
    fiber: scale(food.fiber),
    sugar: scale(food.sugar),
    sodium: scale(food.sodium),
    vitamins: food.vitamins,
  };
  const burn = burnMinutes(nutrition.kcal);
  const healthIndicator = getHealthIndicator(nutrition);

  let activityRec: string;
  let insight: string;
  if (nutrition.kcal <= 300) {
    activityRec = `Jika tubuh terasa nyaman, jalan santai sekitar ${Math.min(20, burn.walk)} menit dapat menjadi pilihan gerak ringan.`;
    insight = "Porsi relatif ringan. Tetap lihat pola makan secara keseluruhan, bukan satu menu saja.";
  } else if (nutrition.kcal <= 550) {
    activityRec = "Coba jalan santai 10–15 menit atau pilih aktivitas ringan yang kamu sukai jika kondisi tubuh mendukung.";
    insight = "Porsi berada pada rentang menengah. Nikmati secara sadar dan lanjutkan kebiasaan sehat seperti biasa.";
  } else {
    activityRec = "Tidak perlu membayar makanan dengan olahraga. Bila ingin bergerak, mulai dari jalan santai 10–15 menit.";
    insight = "Estimasi energi lebih tinggi. Gunakan informasi ini sebagai konteks, bukan alasan untuk merasa bersalah.";
  }
  return { nutrition, burn, activityRec, insight, healthIndicator };
}
