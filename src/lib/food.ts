export type Food = {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
};

export const FOODS: Food[] = [
  { name: "Nasi Goreng", kcal: 333, protein: 9, carbs: 44, fat: 12, portion: "1 piring" },
  { name: "Ayam Geprek + Nasi", kcal: 620, protein: 34, carbs: 58, fat: 28, portion: "1 porsi" },
  { name: "Gado-gado", kcal: 295, protein: 12, carbs: 30, fat: 15, portion: "1 porsi" },
  { name: "Soto Ayam", kcal: 240, protein: 18, carbs: 20, fat: 9, portion: "1 mangkuk" },
  { name: "Bakso", kcal: 330, protein: 20, carbs: 30, fat: 14, portion: "1 mangkuk" },
  { name: "Mie Goreng", kcal: 380, protein: 10, carbs: 52, fat: 14, portion: "1 piring" },
  { name: "Rendang + Nasi", kcal: 680, protein: 30, carbs: 55, fat: 36, portion: "1 porsi" },
  { name: "Salad Buah", kcal: 180, protein: 4, carbs: 34, fat: 4, portion: "1 mangkuk" },
];

export type Verdict = { label: string; tone: "brand" | "amber" | "destructive" };

export function verdict(kcal: number): Verdict {
  if (kcal <= 300) return { label: "Ringan", tone: "brand" };
  if (kcal <= 550) return { label: "Sedang", tone: "amber" };
  return { label: "Tinggi kalori", tone: "destructive" };
}

export function burnMinutes(kcal: number): { run: number; bike: number } {
  return { run: Math.max(1, Math.round(kcal / 10)), bike: Math.max(1, Math.round(kcal / 7)) };
}
