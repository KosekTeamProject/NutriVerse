"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Utensils, Sun, Clock, Sunset, Moon, Heart, ChevronRight } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";

export type MenuItem = {
  mealSlot: "Sarapan" | "Makan Siang" | "Snack" | "Makan Malam";
  icon: typeof Sun;
  title: string;
  desc: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  reason: string;
};

const MENU_SETS: MenuItem[][] = [
  [
    {
      mealSlot: "Sarapan",
      icon: Sun,
      title: "Oatmeal Pisang & Telur Rebus",
      desc: "Oatmeal dengan topping pisang segar dan 1 butir telur rebus.",
      kcal: 360,
      protein: 18,
      carbs: 48,
      fat: 10,
      reason: "Serat lambat cerna dan protein berkualitas tinggi untuk menjaga kenyang lebih lama."
    },
    {
      mealSlot: "Makan Siang",
      icon: Clock,
      title: "Nasi Merah & Ayam Panggang Dada",
      desc: "Nasi merah hangat dengan dada ayam panggang ramah rempah dan tumis brokoli.",
      kcal: 520,
      protein: 38,
      carbs: 55,
      fat: 12,
      reason: "Tinggi protein padat untuk pemulihan otot dan karbohidrat kompleks pemberi energi."
    },
    {
      mealSlot: "Snack",
      icon: Sunset,
      title: "Yogurt Yunani & Buah Bluberi",
      desc: "1 cup greek yogurt tawar dengan taburan bluberi segar.",
      kcal: 180,
      protein: 14,
      carbs: 22,
      fat: 3,
      reason: "Probiotik alami untuk saluran cerna dan antioksidan segar penahan lapar sore."
    },
    {
      mealSlot: "Makan Malam",
      icon: Moon,
      title: "Sup Sayuran & Pepes Tahu Tempe",
      desc: "Kuah kaldu sayuran hangat disajikan bersama pepes tahu tempe kukus.",
      kcal: 320,
      protein: 20,
      carbs: 32,
      fat: 11,
      reason: "Rendah beban pencernaan sebelum tidur dengan asupan protein nabati yang tenang."
    }
  ],
  [
    {
      mealSlot: "Sarapan",
      icon: Sun,
      title: "Roti Gandum Alpukat & Telur Mata Sapi",
      desc: "2 tangkup roti gandum utuh dengan lumatan alpukat segar dan 1 telur.",
      kcal: 390,
      protein: 16,
      carbs: 42,
      fat: 16,
      reason: "Lemak baik tak jenuh dari alpukat menjaga stamina otak di pagi hari."
    },
    {
      mealSlot: "Makan Siang",
      icon: Clock,
      title: "Gado-Gado Kurang Minyak & Telur Rebus",
      desc: "Sayuran kukus segar dengan bumbu kacang tipis dan telur rebus.",
      kcal: 440,
      protein: 22,
      carbs: 45,
      fat: 18,
      reason: "Kaya serat alami, kalium, serta vitamin alami dari beraneka sayuran."
    },
    {
      mealSlot: "Snack",
      icon: Sunset,
      title: "Potongan Apel & 10 Biji Almond",
      desc: "Apel Fuji segar renyah dipadukan dengan kacang almond panggang.",
      kcal: 160,
      protein: 4,
      carbs: 24,
      fat: 7,
      reason: "Kombinasi serat pektin dan vitamin E pemberi fokus di sore hari."
    },
    {
      mealSlot: "Makan Malam",
      icon: Moon,
      title: "Ikan Panggang Herb & Tumis Buncis",
      desc: "Fillet ikan panggang perasan jeruk nipis dengan tumis buncis jagung.",
      kcal: 350,
      protein: 32,
      carbs: 24,
      fat: 12,
      reason: "Kaya Omega-3 untuk meredakan inflamasi fisik setelah beraktivitas harian."
    }
  ]
];

export function AIMenuRecommendation() {
  const session = useAuthSession();
  const [setIndex, setSetIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  const currentMenu = MENU_SETS[setIndex];

  function rotateMenu() {
    setIsRotating(true);
    setTimeout(() => {
      setSetIndex((prev) => (prev + 1) % MENU_SETS.length);
      setIsRotating(false);
    }, 300);
  }

  return (
    <section className="card card-pad space-y-5 border-brand/25 bg-gradient-to-br from-card via-card to-brand-soft/20 shadow-soft">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line/40 pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand to-lime text-white shadow-md">
            <Sparkles className="h-6 w-6 animate-breathe" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow bg-brand-soft/50 border-brand/20 text-brand text-[10px] py-0.5 px-2">
                Rekomendasi AI &middot; Personal
              </span>
            </div>
            <h3 className="font-display text-lg font-extrabold text-foreground">Menu Harian Terpilih</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={rotateMenu}
          disabled={isRotating}
          className="btn btn-outline btn-sm inline-flex items-center gap-2 self-start sm:self-center font-bold text-xs hover:border-brand/40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRotating ? "animate-spin text-brand" : ""}`} />
          <span>Ganti Rekomendasi Menu</span>
        </button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Disusun berdasarkan target <span className="font-bold text-brand">{session?.baseline?.goal ?? "Pola Hidup Sehat"}</span> dan aktivitas harianmu untuk menjaga gizi seimbang tanpa rasa tertekan.
      </p>

      {/* 4 Meal Slots Grid */}
      <div className={`grid gap-3 sm:grid-cols-2 transition-all duration-300 ${isRotating ? "opacity-30 scale-95" : "opacity-100 scale-100"}`}>
        {currentMenu.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.mealSlot}
              className="group relative flex flex-col justify-between rounded-2xl border border-line bg-card/90 p-4 transition-all duration-300 hover:border-brand/35 hover:shadow-lift hover:scale-[1.01]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-line/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-xl bg-brand-soft text-brand">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-extrabold text-foreground">{item.mealSlot}</span>
                  </div>
                  <span className="stat-num text-xs font-extrabold text-brand bg-brand-soft/30 px-2 py-0.5 rounded-full">
                    {item.kcal} kcal
                  </span>
                </div>

                <h4 className="font-display text-sm font-bold text-foreground mt-3 group-hover:text-brand transition">
                  {item.title}
                </h4>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>

                {/* Macros Chips */}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold">
                  <span className="pill bg-secondary text-muted-foreground">P {item.protein}g</span>
                  <span className="pill bg-secondary text-muted-foreground">K {item.carbs}g</span>
                  <span className="pill bg-secondary text-muted-foreground">L {item.fat}g</span>
                </div>
              </div>

              {/* AI Reason */}
              <div className="mt-3 pt-2.5 border-t border-line/30 flex items-start gap-1.5 text-[10px] text-muted-foreground italic">
                <Heart className="h-3 w-3 shrink-0 text-brand mt-0.5" />
                <span>{item.reason}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
