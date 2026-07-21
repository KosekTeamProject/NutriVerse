"use client";

import { useState } from "react";
import { Camera, PencilLine, Clock, Trash2, Info, Leaf } from "lucide-react";
import { FoodScanner, type LoggedFood } from "./FoodScanner";
import { ManualFoodInput } from "./ManualFoodInput";
import { deterministicFoodEntries } from "@/features/nutrition/data";
import { NutritionProgressSummary, NutritionTrustBadge } from "@/features/nutrition/components/NutritionComponents";

type Tab = "scan" | "manual";
type Entry = LoggedFood & { id: number; via: "scan" | "manual"; date: string };

const seed: Entry[] = [
  {
    id: 1,
    via: "scan",
    date: "Hari ini, 07.20",
    name: "Balanced Breakfast",
    portion: "1x porsi",
    nutrition: deterministicFoodEntries[0].nutrition,
    activityRec: deterministicFoodEntries[0].activityRec,
    insight: deterministicFoodEntries[0].insight,
    trustLevel: "simulated"
  },
  {
    id: 2,
    via: "manual",
    date: "Kemarin, 12.40",
    name: "Grilled Chicken Rice Bowl",
    portion: "1x porsi",
    nutrition: deterministicFoodEntries[1].nutrition,
    activityRec: deterministicFoodEntries[1].activityRec,
    insight: deterministicFoodEntries[1].insight,
    trustLevel: "confirmed"
  }
];

export function FoodLogger() {
  const [tab, setTab] = useState<Tab>("scan");
  const [log, setLog] = useState<Entry[]>(seed);

  function addEntry(entry: LoggedFood) {
    const now = new Date();
    const date = `Hari ini, ${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}`;
    setLog((prev) => [{ ...entry, id: Date.now() + Math.random(), via: tab === "manual" ? "manual" : "scan", date }, ...prev]);
  }
  const remove = (id: number) => setLog((prev) => prev.filter((e) => e.id !== id));
  const total = log.reduce((s, e) => s + e.nutrition.kcal, 0);

  const tabs: { key: Tab; label: string; icon: typeof Camera }[] = [
    { key: "scan", label: "Pindai Makanan", icon: Camera },
    { key: "manual", label: "Input Manual", icon: PencilLine },
  ];

  return (
    <div className="space-y-6">
      {/* Nutrition Progress Summary */}
      <NutritionProgressSummary />

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${tab === t.key ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}>
              <Icon className="h-[18px] w-[18px]" /> <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "scan" && <FoodScanner onAdd={addEntry} />}
      {tab === "manual" && <ManualFoodInput onAdd={addEntry} />}

      {/* Food History */}
      <div className="card card-pad">
        <div className="flex items-center justify-between pb-3 border-b border-line/45">
          <h2 className="font-display text-lg font-bold text-foreground">Riwayat Makanan</h2>
          <span className="chip text-xs"><Clock className="h-3.5 w-3.5 text-brand" /> {total} kkal hari ini</span>
        </div>

        <div className="mt-4 space-y-3">
          {log.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Belum ada riwayat. Pindai atau catat makananmu.</p>
          ) : (
            log.map((e) => (
              <div key={e.id} className="rounded-2xl border border-line p-4 space-y-3 bg-card hover:border-brand/30 transition">
                <div className="flex items-start gap-3">
                  {e.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.photo} alt={e.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Leaf className="h-6 w-6" /></span>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-foreground">{e.name}</p>
                      <button onClick={() => remove(e.id)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:text-destructive" aria-label="Delete entry"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.portion} &middot; {e.date} &middot; {e.via === "scan" ? "pindai" : "manual"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold">{e.nutrition.kcal} kkal</span>
                      <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold">P {e.nutrition.protein}g</span>
                      <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold">K {e.nutrition.carbs}g</span>
                      <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold">L {e.nutrition.fat}g</span>
                      <NutritionTrustBadge trust={e.trustLevel} />
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 border-t border-line/35 pt-2.5">
                  <p><span className="font-bold text-foreground">Analisis:</span> {e.insight}</p>
                  <p><span className="font-bold text-foreground">Rekomendasi:</span> {e.activityRec}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/50 p-4 text-[10px] text-muted-foreground border border-line/30">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p>Riwayat disimpan sementara di penyimpanan browser lokal. Integrasi database penuh ditangguhkan.</p>
        </div>
      </div>
    </div>
  );
}
