"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Minus, Check, Sparkles, Info, ArrowLeft, Globe, Database } from "lucide-react";
import { searchFoods, analyze, type Food } from "@/lib/food";
import type { LoggedFood } from "./FoodScanner";
import { FoodSearchPanel } from "@/features/nutrition/components/FoodSearchPanel";

type Step = "search" | "detail";
type Mode = "online" | "demo";
const PORTIONS = [0.5, 1, 1.5, 2];

export function ManualFoodInput({ onAdd }: { onAdd?: (entry: LoggedFood) => void }) {
  const [mode, setMode] = useState<Mode>("online");
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [portion, setPortion] = useState(1);
  const [qty, setQty] = useState(1);

  const results = useMemo(() => searchFoods(query), [query]);

  function choose(food: Food) {
    setSelected(food);
    setPortion(1);
    setQty(1);
    setStep("detail");
  }

  function submit() {
    if (!selected) return;
    const a = analyze(selected, portion * qty);
    onAdd?.({
      name: selected.name,
      portion: `${qty}x (${portion} porsi) ${selected.portion}`,
      nutrition: a.nutrition,
      activityRec: a.activityRec,
      insight: a.insight,
      trustLevel: "self-reported"
    });
    setSelected(null);
    setQuery("");
    setStep("search");
  }

  if (step === "detail" && selected) {
    const preview = analyze(selected, portion * qty);
    return (
      <div className="card card-pad">
        <button onClick={() => setStep("search")} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Ganti makanan
        </button>

        <div className="rounded-2xl bg-secondary p-4 text-center">
          <p className="font-display text-xl font-extrabold">{selected.name}</p>
          <p className="text-xs text-muted-foreground">Dasar {selected.kcal} kkal &middot; {selected.portion}</p>
        </div>

        <p className="mt-4 mb-2 text-xs font-medium text-muted-foreground">Ukuran porsi</p>
        <div className="grid grid-cols-4 gap-2">
          {PORTIONS.map((p) => (
            <button key={p} onClick={() => setPortion(p)} className={`rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition ${portion === p ? "border-brand bg-brand-soft text-brand" : "border-line text-muted-foreground hover:bg-secondary"}`}>{p}x</button>
          ))}
        </div>

        <p className="mt-4 mb-2 text-xs font-medium text-muted-foreground">Jumlah</p>
        <div className="flex items-center gap-3">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center rounded-xl bg-secondary transition hover:bg-line/60"><Minus className="h-4 w-4" /></button>
          <span className="stat-num w-8 text-center text-lg">{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} className="grid h-9 w-9 place-items-center rounded-xl bg-secondary transition hover:bg-line/60"><Plus className="h-4 w-4" /></button>
          <span className="ml-auto text-sm text-muted-foreground">Estimasi <span className="stat-num text-foreground">{preview.nutrition.kcal}</span> kkal</span>
        </div>

        <button onClick={submit} className="btn btn-primary mt-5 w-full"><Sparkles className="h-[18px] w-[18px]" /> Simpan Catatan Makanan</button>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-sky/5 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
          <p>Input manual dipakai saat foto makanan kurang jelas atau untuk mencatat porsi khusus.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-pad space-y-4">
      {/* Mode Sub-tabs */}
      <div className="flex items-center justify-center gap-2 p-1 rounded-xl bg-secondary text-xs">
        <button
          onClick={() => setMode("online")}
          className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
            mode === "online" ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="h-3.5 w-3.5" /> Cari Online (USDA)
        </button>
        <button
          onClick={() => setMode("demo")}
          className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
            mode === "demo" ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Database className="h-3.5 w-3.5" /> Contoh Makanan Demo
        </button>
      </div>

      {mode === "online" ? (
        <FoodSearchPanel
          onConfirmFood={(summary) => {
            onAdd?.({
              name: summary.name,
              portion: summary.portionLabel,
              nutrition: summary.scaled.nutrition,
              activityRec: "Jalan kaki santai 60 menit untuk mengimbangi porsi ini.",
              insight: `Informasi nutrisi bersumber dari ${summary.sourceLabel} dan disesuaikan porsi.`,
              trustLevel: "confirmed",
            });
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ketik nama makanan demo, mis. nasi goreng" className="input pl-10 text-sm" />
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {results.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Tidak ada makanan demo yang cocok.</p>
            ) : (
              results.map((f) => (
                <button key={f.name} onClick={() => choose(f)} className="flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left transition hover:bg-secondary">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.portion} &middot; {f.kcal} kkal</p>
                  </div>
                  <Check className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-sky/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
            <p>Pilih makanan dari daftar demo bawaan bila koneksi internet terbatas.</p>
          </div>
        </div>
      )}
    </div>
  );
}
