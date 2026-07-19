"use client";

import { useState } from "react";
import { Camera, PencilLine, MessageCircle, Clock, Trash2, Info, Leaf } from "lucide-react";
import { FoodScanner, type LoggedFood } from "./FoodScanner";
import { ManualFoodInput } from "./ManualFoodInput";
import { AiChat } from "./AiChat";
import { analyze, FOODS } from "@/lib/food";

type Tab = "scan" | "manual" | "chat";
type Entry = LoggedFood & { id: number; via: "scan" | "manual"; date: string };

function seedEntry(name: string, portionMul: number, via: "scan" | "manual", date: string, id: number): Entry {
  const food = FOODS.find((f) => f.name === name) ?? FOODS[0];
  const a = analyze(food, portionMul);
  return { id, via, date, name: food.name, portion: `${portionMul}x ${food.portion}`, nutrition: a.nutrition, activityRec: a.activityRec, insight: a.insight };
}

const seed: Entry[] = [
  seedEntry("Nasi Goreng", 1, "scan", "Hari ini, 07.20", 1),
  seedEntry("Soto Ayam", 1, "manual", "Kemarin, 12.40", 2),
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
    { key: "scan", label: "Pindai (AI)", icon: Camera },
    { key: "manual", label: "Input manual", icon: PencilLine },
    { key: "chat", label: "AI Chat", icon: MessageCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-secondary p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${tab === t.key ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}>
              <Icon className="h-[18px] w-[18px]" /> <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "scan" && <FoodScanner onAdd={addEntry} />}
      {tab === "manual" && <ManualFoodInput onAdd={addEntry} />}
      {tab === "chat" && <AiChat history={log} />}

      {/* Food History */}
      <div className="card card-pad">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Riwayat makanan</h2>
          <span className="chip"><Clock className="h-3.5 w-3.5" /> {total} kkal hari ini</span>
        </div>

        <div className="mt-4 space-y-3">
          {log.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Belum ada riwayat. Pindai atau catat makananmu.</p>
          ) : (
            log.map((e) => (
              <div key={e.id} className="rounded-2xl border border-line p-3">
                <div className="flex items-start gap-3">
                  {e.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.photo} alt={e.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Leaf className="h-6 w-6" /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{e.name}</p>
                      <button onClick={() => remove(e.id)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.portion} &middot; {e.date} &middot; {e.via === "scan" ? "pindai" : "manual"}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="pill bg-secondary text-muted-foreground">{e.nutrition.kcal} kkal</span>
                      <span className="pill bg-secondary text-muted-foreground">P {e.nutrition.protein}g</span>
                      <span className="pill bg-secondary text-muted-foreground">K {e.nutrition.carbs}g</span>
                      <span className="pill bg-secondary text-muted-foreground">L {e.nutrition.fat}g</span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">Analisis:</span> {e.insight}</p>
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Rekomendasi:</span> {e.activityRec}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-sky/5 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
          <p>Riwayat masih tersimpan sementara di perangkat (dummy). Penyimpanan permanen ke akun aktif pada Fase 3 (database).</p>
        </div>
      </div>
    </div>
  );
}
