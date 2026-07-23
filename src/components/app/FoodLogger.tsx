"use client";

import { useState, useMemo } from "react";
import { Camera, PencilLine, Clock, Trash2, Info, Leaf, Database, X, Check, Filter, Sparkles, Scale } from "lucide-react";
import { FoodScanner, type LoggedFood } from "./FoodScanner";
import { ManualFoodInput } from "./ManualFoodInput";
import { NutritionTrustBadge } from "@/features/nutrition/components/NutritionComponents";
import { AIMenuRecommendation } from "@/features/nutrition/components/AIMenuRecommendation";
import { BodyWeightTracker } from "@/features/body-weight/components/BodyWeightTracker";
import { getHealthIndicator } from "@/lib/food";

type Tab = "scan" | "manual" | "recommendation" | "weight";
type HistoryFilter = "today" | "week" | "month";

type Entry = LoggedFood & { 
  id: number; 
  via: "scan" | "manual"; 
  date: string;
  category?: "Sarapan" | "Makan Siang" | "Makan Malam" | "Camilan";
  periodFilter?: HistoryFilter;
};

// Initial mock entries for demonstrating history filters & summary percentages
const INITIAL_HISTORY: Entry[] = [
  {
    id: 1,
    name: "Nasi Ayam Panggang & Sayur",
    portion: "1x porsi",
    via: "scan",
    date: "Hari ini, 12:30",
    category: "Makan Siang",
    periodFilter: "today",
    nutrition: { kcal: 520, protein: 38, carbs: 58, fat: 12, fiber: 6, sugar: 4, sodium: 640, vitamins: "B3, B12" },
    activityRec: "Jalan santai 15 menit jika kondisi tubuh mendukung.",
    insight: "Tinggi protein padat dan karbohidrat kompleks.",
    trustLevel: "confirmed"
  },
  {
    id: 2,
    name: "Oatmeal Pisang & Telur",
    portion: "1x porsi",
    via: "manual",
    date: "Hari ini, 07:15",
    category: "Sarapan",
    periodFilter: "today",
    nutrition: { kcal: 360, protein: 18, carbs: 48, fat: 10, fiber: 7, sugar: 5, sodium: 220, vitamins: "A, B1" },
    activityRec: "Jalan ringan 10 menit.",
    insight: "Serat lambat cerna yang baik di pagi hari.",
    trustLevel: "self-reported"
  },
  {
    id: 3,
    name: "Salad Buah & Yogurt",
    portion: "1x porsi",
    via: "scan",
    date: "Kemarin, 15:45",
    category: "Camilan",
    periodFilter: "week",
    nutrition: { kcal: 210, protein: 12, carbs: 32, fat: 4, fiber: 4, sugar: 16, sodium: 90, vitamins: "C, Calcium" },
    activityRec: "Aktivitas ringan fleksibel.",
    insight: "Camilan kaya probiotik dan buah segar.",
    trustLevel: "confirmed"
  },
  {
    id: 4,
    name: "Sup Sayuran & Tempe Kukus",
    portion: "1.5x porsi",
    via: "manual",
    date: "4 hari lalu, 19:10",
    category: "Makan Malam",
    periodFilter: "month",
    nutrition: { kcal: 310, protein: 22, carbs: 36, fat: 9, fiber: 8, sugar: 3, sodium: 480, vitamins: "A, C, K" },
    activityRec: "Gerak santai atau pemulihan.",
    insight: "Rendah lemak, kaya serat dan mineral.",
    trustLevel: "self-reported"
  }
];

export function FoodLogger() {
  const [tab, setTab] = useState<Tab>("scan");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("today");
  const [log, setLog] = useState<Entry[]>(INITIAL_HISTORY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", portion: "" });

  function addEntry(entry: LoggedFood) {
    const now = new Date();
    const date = `Hari ini, ${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}`;
    
    // Assign category based on hour
    const hour = now.getHours();
    let category: "Sarapan" | "Makan Siang" | "Makan Malam" | "Camilan" = "Camilan";
    if (hour >= 5 && hour < 11) category = "Sarapan";
    else if (hour >= 11 && hour < 16) category = "Makan Siang";
    else if (hour >= 16 && hour < 21) category = "Makan Malam";

    const newEntry: Entry = {
      ...entry,
      id: Date.now() + Math.random(),
      via: tab === "manual" ? "manual" : "scan",
      date,
      category,
      periodFilter: "today"
    };

    setLog((prev) => [newEntry, ...prev]);
  }

  const remove = (id: number) => setLog((prev) => prev.filter((e) => e.id !== id));
  const beginEdit = (entry: Entry) => { setEditingId(entry.id); setEditDraft({ name: entry.name, portion: entry.portion }); };
  const saveEdit = () => {
    if (!editingId || !editDraft.name.trim() || !editDraft.portion.trim()) return;
    setLog((entries) => entries.map((entry) => entry.id === editingId ? { ...entry, name: editDraft.name.trim(), portion: editDraft.portion.trim() } : entry));
    setEditingId(null);
  };

  // Filtered log entries
  const filteredEntries = useMemo(() => {
    if (historyFilter === "today") return log.filter((e) => e.periodFilter === "today");
    if (historyFilter === "week") return log.filter((e) => e.periodFilter === "today" || e.periodFilter === "week");
    return log;
  }, [log, historyFilter]);

  // Aggregate totals
  const totals = useMemo(() => {
    return filteredEntries.reduce(
      (acc, item) => ({
        kcal: acc.kcal + item.nutrition.kcal,
        protein: acc.protein + item.nutrition.protein,
        carbs: acc.carbs + item.nutrition.carbs,
        fat: acc.fat + item.nutrition.fat,
        fiber: acc.fiber + item.nutrition.fiber,
        sugar: acc.sugar + item.nutrition.sugar,
        sodium: acc.sodium + item.nutrition.sodium,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );
  }, [filteredEntries]);

  // Daily target percentages
  const targets = { protein: 65, carbs: 220, fiber: 25 };
  const proteinPct = Math.min(150, Math.round((totals.protein / targets.protein) * 100));
  const carbsPct = Math.min(150, Math.round((totals.carbs / targets.carbs) * 100));
  const fiberPct = Math.min(150, Math.round((totals.fiber / targets.fiber) * 100));

  const mainTabs: { key: Tab; label: string; icon: typeof Camera }[] = [
    { key: "scan", label: "Pindai Makanan", icon: Camera },
    { key: "manual", label: "Input Manual", icon: PencilLine },
    { key: "recommendation", label: "Rekomendasi Menu AI", icon: Sparkles },
    { key: "weight", label: "Berat Badan", icon: Scale },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Nutrition Summary Cards */}
      <div className="card card-pad border-brand/20 bg-gradient-to-br from-card via-card to-brand-soft/20 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/45 pb-3">
          <div>
            <span className="eyebrow bg-brand-soft/40 border-brand/20 text-brand text-[10px] py-0.5 px-2">
              NutriVerse Intelligence
            </span>
            <h3 className="font-display text-base font-bold text-foreground mt-1">Ringkasan Pemenuhan Gizi</h3>
          </div>
          <span className="chip text-xs font-bold">
            <Clock className="h-3.5 w-3.5 text-brand" /> {totals.kcal} kcal Terhitung
          </span>
        </div>

        {/* Macro Progress Bars */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {/* Protein */}
          <div className="rounded-2xl border border-line bg-card p-3.5 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-foreground">Protein</span>
              <span className="text-brand stat-num">{proteinPct}%</span>
            </div>
            <div className="chart-progress h-2 overflow-hidden rounded-full">
              <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${Math.min(100, proteinPct)}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">{totals.protein}g / {targets.protein}g target harian</p>
          </div>

          {/* Carbs */}
          <div className="rounded-2xl border border-line bg-card p-3.5 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-foreground">Karbohidrat</span>
              <span className="text-sky stat-num">{carbsPct}%</span>
            </div>
            <div className="chart-progress h-2 overflow-hidden rounded-full">
              <div className="h-full bg-sky rounded-full transition-all duration-500" style={{ width: `${Math.min(100, carbsPct)}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">{totals.carbs}g / {targets.carbs}g target harian</p>
          </div>

          {/* Fiber */}
          <div className="rounded-2xl border border-line bg-card p-3.5 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-foreground">Serat Pangan</span>
              <span className="text-lime stat-num">{fiberPct}%</span>
            </div>
            <div className="chart-progress h-2 overflow-hidden rounded-full">
              <div className="h-full bg-lime rounded-full transition-all duration-500" style={{ width: `${Math.min(100, fiberPct)}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">{totals.fiber}g / {targets.fiber}g target harian</p>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl bg-secondary p-1">
        {mainTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                tab === t.key ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "scan" && <FoodScanner onAdd={addEntry} />}
      {tab === "manual" && <ManualFoodInput onAdd={addEntry} />}
      {tab === "recommendation" && <AIMenuRecommendation />}
      {tab === "weight" && <BodyWeightTracker />}

      {/* Food History Section */}
      <div className="card card-pad space-y-4 border-line/60 bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line/45 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Pencatatan Gizi</span>
            <h2 className="font-display text-lg font-bold text-foreground">Riwayat Makanan</h2>
          </div>

          {/* History Period Filters */}
          <div className="flex items-center gap-1.5 rounded-xl bg-secondary p-1 self-start sm:self-center">
            <Filter className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setHistoryFilter("today")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                historyFilter === "today" ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter("week")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                historyFilter === "week" ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Minggu Ini
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter("month")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                historyFilter === "month" ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bulan Ini
            </button>
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-6 text-center">
              <Database className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-xs font-bold text-foreground">Tidak ada catatan pada periode ini</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Catat makanan pertama menggunakan Pindai Makanan atau Input Manual.</p>
            </div>
          ) : (
            filteredEntries.map((e) => {
              const indicator = getHealthIndicator(e.nutrition);
              return (
                <div key={e.id} className="rounded-2xl border border-line p-4 space-y-3 bg-card hover:border-brand/30 transition-all duration-300 hover:shadow-soft">
                  <div className="flex items-start gap-3">
                    {e.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.photo} alt={e.name} className="h-14 w-14 shrink-0 rounded-2xl object-cover border border-line" />
                    ) : (
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
                        <Leaf className="h-6 w-6" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        {editingId === e.id ? (
                          <input value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} className="input h-8 text-xs" aria-label="Ubah nama makanan" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-foreground">{e.name}</p>
                            {e.category && (
                              <span className="pill bg-secondary text-[9px] font-bold text-muted-foreground">{e.category}</span>
                            )}
                          </div>
                        )}
                        <div className="flex shrink-0 items-center gap-1">
                          {editingId === e.id ? (
                            <>
                              <button onClick={saveEdit} className="grid h-7 w-7 place-items-center rounded-lg text-brand hover:bg-brand-soft" aria-label="Simpan perubahan"><Check className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setEditingId(null)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Batalkan perubahan"><X className="h-3.5 w-3.5" /></button>
                            </>
                          ) : (
                            <button onClick={() => beginEdit(e)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-brand" aria-label="Ubah catatan"><PencilLine className="h-3.5 w-3.5" /></button>
                          )}
                          <button onClick={() => remove(e.id)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:text-destructive" aria-label="Hapus catatan"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>

                      {editingId === e.id ? (
                        <input value={editDraft.portion} onChange={(event) => setEditDraft({ ...editDraft, portion: event.target.value })} className="input h-8 text-xs" aria-label="Ubah porsi makanan" />
                      ) : (
                        <p className="text-xs text-muted-foreground">{e.portion} &middot; {e.date} &middot; sumber: {e.via === "scan" ? "pindai foto" : "input manual"}</p>
                      )}

                      {/* Health Indicator Badge & Macros */}
                      <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                        <span className={`pill text-[9px] font-extrabold uppercase border px-2 ${indicator.badgeClass}`}>
                          ● {indicator.label}
                        </span>
                        <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold">{e.nutrition.kcal} kcal</span>
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
              );
            })
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
