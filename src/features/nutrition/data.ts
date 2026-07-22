import { FoodAnalysis, UpgradedFoodEntry } from "@/lib/food";

export const primaryBreakfastAnalysis: FoodAnalysis = {
  nutrition: { kcal: 430, protein: 24, carbs: 49, fat: 15, fiber: 7, sugar: 4, sodium: 320, vitamins: "A, B1, B6, Potassium" },
  burn: { run: 43, bike: 61, walk: 108 },
  activityRec: "Jalan kaki santai selama 108 menit untuk mengimbangi porsi sarapan seimbang ini.",
  insight: "Porsi sarapan seimbang kaya protein dan serat, sangat baik untuk mendukung metabolisme pagi hari."
};

export const chickenRiceAnalysis: FoodAnalysis = {
  nutrition: { kcal: 520, protein: 38, carbs: 58, fat: 12, fiber: 6, sugar: 2, sodium: 640, vitamins: "B3, B12, Iron" },
  burn: { run: 52, bike: 74, walk: 130 },
  activityRec: "Gowes sepeda santai 74 menit atau lari 52 menit untuk mengimbangi porsi makan siang ini.",
  insight: "Sangat tinggi protein kompleks, membantu memulihkan jaringan otot setelah berolahraga."
};

export const vegetableSoupAnalysis: FoodAnalysis = {
  nutrition: { kcal: 220, protein: 8, carbs: 35, fat: 4, fiber: 9, sugar: 5, sodium: 580, vitamins: "A, C, K, Folate" },
  burn: { run: 22, bike: 31, walk: 55 },
  activityRec: "Jalan kaki santai 55 menit sudah cukup untuk membakar kalori sup sayuran ini.",
  insight: "Rendah kalori namun sangat kaya serat dan mikronutrisi penting untuk kesehatan jangka panjang."
};

export const yogurtFruitAnalysis: FoodAnalysis = {
  nutrition: { kcal: 190, protein: 15, carbs: 28, fat: 2, fiber: 2, sugar: 18, sodium: 80, vitamins: "Calcium, Vitamin D" },
  burn: { run: 19, bike: 27, walk: 48 },
  activityRec: "Jalan kaki santai 48 menit untuk membakar kalori cemilan yogurt buah ini.",
  insight: "Kombinasi yang baik antara protein yogurt Yunani dan antioksidan dari buah segar."
};

export const tempehPlateAnalysis: FoodAnalysis = {
  nutrition: { kcal: 380, protein: 22, carbs: 25, fat: 18, fiber: 8, sugar: 3, sodium: 420, vitamins: "B12, Magnesium, Zinc" },
  burn: { run: 38, bike: 54, walk: 95 },
  activityRec: "Lari santai 38 menit atau bersepeda 54 menit untuk membakar kalori sepiring tempe ini.",
  insight: "Menu nabati padat protein kedelai fermentasi dan zat besi untuk memelihara kesehatan tubuh."
};

export const deterministicFoodEntries: UpgradedFoodEntry[] = [
  {
    id: "food-analysis-balanced-breakfast",
    title: "Sarapan Seimbang",
    foods: ["telur", "roti gandum", "pisang", "air"],
    mealType: "breakfast",
    status: "completed",
    sourceMode: "deterministic-demo",
    trustLevel: "simulated",
    nutrition: primaryBreakfastAnalysis.nutrition,
    burn: primaryBreakfastAnalysis.burn,
    activityRec: primaryBreakfastAnalysis.activityRec,
    insight: primaryBreakfastAnalysis.insight,
    hydrationContext: "Air putih disertakan bersama makanan.",
    summary: "Sarapan menyediakan kombinasi protein, karbohidrat, dan serat yang seimbang.",
    limitation: "Nilai gizi merupakan estimasi dan dapat berubah sesuai porsi serta cara memasak.",
    privacy: "private",
    date: "Hari ini, 07:20",
    portion: "1x porsi",
    isMock: true,
    version: "1.0.0"
  },
  {
    id: "food-analysis-chicken-rice",
    title: "Nasi Ayam Panggang",
    foods: ["ayam panggang", "nasi merah", "brokoli", "wortel"],
    mealType: "lunch",
    status: "completed",
    sourceMode: "deterministic-demo",
    trustLevel: "simulated",
    nutrition: chickenRiceAnalysis.nutrition,
    burn: chickenRiceAnalysis.burn,
    activityRec: chickenRiceAnalysis.activityRec,
    insight: chickenRiceAnalysis.insight,
    hydrationContext: "Teh hijau disertakan bersama makanan.",
    summary: "Menu tinggi protein dengan karbohidrat kompleks untuk mendukung pemulihan.",
    limitation: "Nilai gizi berupa perkiraan berdasarkan porsi standar.",
    privacy: "private",
    date: "Kemarin, 12:40",
    portion: "1x porsi",
    isMock: true,
    version: "1.0.0"
  },
  {
    id: "food-analysis-vegetable-soup",
    title: "Sup Sayuran",
    foods: ["sayuran campur", "kaldu sayur", "kacang merah"],
    mealType: "dinner",
    status: "completed",
    sourceMode: "deterministic-demo",
    trustLevel: "simulated",
    nutrition: vegetableSoupAnalysis.nutrition,
    burn: vegetableSoupAnalysis.burn,
    activityRec: vegetableSoupAnalysis.activityRec,
    insight: vegetableSoupAnalysis.insight,
    hydrationContext: "Air putih dicatat bersama sup.",
    summary: "Menu rendah kalori dan tinggi serat dengan beragam mikronutrien.",
    limitation: "Estimasi dapat berubah sesuai kekentalan kaldu.",
    privacy: "private",
    date: "2 hari lalu, 19:15",
    portion: "1.5x porsi",
    isMock: true,
    version: "1.0.0"
  },
  {
    id: "food-analysis-yogurt-fruit",
    title: "Yogurt dan Buah",
    foods: ["yogurt Yunani", "bluberi", "madu"],
    mealType: "snack",
    status: "completed",
    sourceMode: "deterministic-demo",
    trustLevel: "simulated",
    nutrition: yogurtFruitAnalysis.nutrition,
    burn: yogurtFruitAnalysis.burn,
    activityRec: yogurtFruitAnalysis.activityRec,
    insight: yogurtFruitAnalysis.insight,
    hydrationContext: "Belum ada hidrasi yang dicatat.",
    summary: "Camilan yang mendukung keseimbangan pencernaan dan asupan protein.",
    limitation: "Estimasi memakai yogurt Yunani tawar tanpa lemak.",
    privacy: "private",
    date: "3 hari lalu, 15:30",
    portion: "1x porsi",
    isMock: true,
    version: "1.0.0"
  },
  {
    id: "food-analysis-tempeh-plate",
    title: "Sepiring Tempe",
    foods: ["tempe", "bayam", "saus kacang"],
    mealType: "dinner",
    status: "completed",
    sourceMode: "deterministic-demo",
    trustLevel: "simulated",
    nutrition: tempehPlateAnalysis.nutrition,
    burn: tempehPlateAnalysis.burn,
    activityRec: tempehPlateAnalysis.activityRec,
    insight: tempehPlateAnalysis.insight,
    hydrationContext: "Air putih dicatat bersama makanan.",
    summary: "Menu nabati yang kaya protein kedelai dan serat pangan.",
    limitation: "Minyak saat memasak dapat memengaruhi estimasi kalori.",
    privacy: "private",
    date: "4 hari lalu, 18:45",
    portion: "1x porsi",
    isMock: true,
    version: "1.0.0"
  }
];

export interface PreparedNutritionSummary {
  readonly proteinCurrent: number;
  readonly proteinTarget: number;
  readonly proteinProgressPercent: number;
  readonly hydrationCurrent: string;
  readonly hydrationTarget: string;
  readonly hydrationTrust: string;
  readonly foodEntryCount: number;
  readonly dataCompleteness: number;
  readonly isMock: boolean;
}

export const preparedNutritionSummary: PreparedNutritionSummary = {
  proteinCurrent: 56,
  proteinTarget: 80,
  proteinProgressPercent: 70,
  hydrationCurrent: "1.1 L",
  hydrationTarget: "2.0 L",
  hydrationTrust: "self-reported",
  foodEntryCount: 5,
  dataCompleteness: 78,
  isMock: true
};
