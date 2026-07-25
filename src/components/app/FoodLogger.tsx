"use client";

import { useEffect, useState, useMemo } from "react";
import { Camera, PencilLine, Clock, Trash2, Info, Leaf, Database, X, Check, Filter, Sparkles, Scale, ChevronDown } from "lucide-react";
import { FoodScanner, type LoggedFood } from "./FoodScanner";
import { ManualFoodInput } from "./ManualFoodInput";
import { NutritionTrustBadge } from "@/features/nutrition/components/NutritionComponents";
import { AIMenuRecommendation } from "@/features/nutrition/components/AIMenuRecommendation";
import { BodyWeightTracker } from "@/features/body-weight/components/BodyWeightTracker";
import { getHealthIndicator } from "@/lib/food";
import { notifyDataChanged } from "@/lib/data-sync";
import { useProgressData } from "@/providers/ProgressDataProvider";

type Tab = "scan" | "manual" | "recommendation" | "weight";
type HistoryFilter = "today" | "week" | "month";

type Entry = LoggedFood & { 
  id: string; 
  via: "scan" | "manual"; 
  date: string;
  loggedAt: string;
  category?: "Sarapan" | "Makan Siang" | "Makan Malam" | "Camilan";
};

type StoredNutritionEntry = {
  id: string;
  foodName: string;
  portionGrams: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodiumMg: number;
  mealType: string | null;
  source: string;
  isUserConfirmed: boolean;
  confidenceScore: number;
  imageUrl: string | null;
  recommendationText: string | null;
  loggedAt: string;
};

function mealTypeFor(date: Date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "Sarapan";
  if (hour >= 11 && hour < 16) return "Makan Siang";
  if (hour >= 16 && hour < 21) return "Makan Malam";
  return "Camilan";
}

function storedEntry(entry: StoredNutritionEntry): Entry {
  const loggedAt = new Date(entry.loggedAt);
  return {
    id: entry.id,
    name: entry.foodName,
    portion: entry.portionGrams ? `${entry.portionGrams} g` : "Porsi tercatat",
    photo: entry.imageUrl ?? undefined,
    via: entry.source === "SCAN" ? "scan" : "manual",
    date: loggedAt.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    loggedAt: entry.loggedAt,
    category: (entry.mealType as Entry["category"]) ?? mealTypeFor(loggedAt),
    nutrition: {
      kcal: roundedNutrition(entry.calories),
      protein: roundedNutrition(entry.protein),
      carbs: roundedNutrition(entry.carbs),
      fat: roundedNutrition(entry.fat),
      fiber: roundedNutrition(entry.fiber),
      sugar: roundedNutrition(entry.sugar),
      sodium: roundedNutrition(entry.sodiumMg),
      vitamins: "",
    },
    activityRec:
      entry.recommendationText ?? "Aktivitas ringan dapat disesuaikan dengan kondisi tubuh.",
    insight: "Catatan nutrisi tersimpan dan ikut dihitung dalam progres harian.",
    trustLevel:
      entry.source === "SCAN" && entry.isUserConfirmed
        ? "confirmed"
        : "self-reported",
  };
}

function roundedNutrition(value: number) {
  return Math.round(value * 10) / 10;
}

export function FoodLogger() {
  const { overview } = useProgressData();
  const [filterNow] = useState(() => Date.now());
  const [tab, setTab] = useState<Tab>("scan");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("today");
  const [log, setLog] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", portion: "" });

  useEffect(() => {
    const from = new Date(Date.now() - 31 * 24 * 60 * 60_000).toISOString();
    fetch(`/api/nutrition/entries?limit=200&from=${encodeURIComponent(from)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; entries?: StoredNutritionEntry[]; error?: string }
          | null;
        if (!response.ok || !result?.success) {
          throw new Error(result?.error ?? "Riwayat makanan gagal dimuat.");
        }
        setLog((result.entries ?? []).map(storedEntry));
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : "Riwayat makanan gagal dimuat.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function addEntry(entry: LoggedFood) {
    const now = new Date();
    const category = mealTypeFor(now);
    setMessage("Menyimpan catatan makanan...");
    let imageUrl: string | undefined;
    if (entry.photoFile) {
      const form = new FormData();
      form.set("bucket", "post-images");
      form.set("file", entry.photoFile);
      const uploadResponse = await fetch("/api/storage/upload", {
        method: "POST",
        body: form,
      });
      const upload = (await uploadResponse.json().catch(() => null)) as
        | { success?: boolean; publicUrl?: string; error?: string }
        | null;
      if (!uploadResponse.ok || !upload?.success || !upload.publicUrl) {
        setMessage(upload?.error ?? "Foto makanan gagal diunggah.");
        return;
      }
      imageUrl = upload.publicUrl;
    }
    const response = await fetch("/api/nutrition/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        foodName: entry.name,
        calories: entry.nutrition.kcal,
        protein: entry.nutrition.protein,
        carbs: entry.nutrition.carbs,
        fat: entry.nutrition.fat,
        fiber: entry.nutrition.fiber,
        sugar: entry.nutrition.sugar,
        sodiumMg: entry.nutrition.sodium,
        mealType: category,
        source: tab === "scan" ? "SCAN" : "MANUAL",
        isUserConfirmed: entry.trustLevel === "confirmed",
        confidenceScore: entry.trustLevel === "confirmed" ? 1 : 0,
        imageUrl,
        recommendationText: entry.activityRec,
        loggedAt: now.toISOString(),
      }),
    });
    const result = (await response.json().catch(() => null)) as
      | { success?: boolean; entry?: StoredNutritionEntry; error?: string }
      | null;
    if (!response.ok || !result?.success || !result.entry) {
      setMessage(result?.error ?? "Catatan makanan gagal disimpan.");
      return;
    }
    setLog((previous) => [storedEntry(result.entry!), ...previous]);
    setMessage("Catatan tersimpan dan seluruh progres telah diperbarui.");
    notifyDataChanged();
  }

  const remove = async (id: string) => {
    const response = await fetch(`/api/nutrition/entries/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setMessage("Catatan makanan gagal dihapus.");
      return;
    }
    setLog((previous) => previous.filter((entry) => entry.id !== id));
    setMessage("Catatan dihapus dan progres dihitung ulang.");
    notifyDataChanged();
  };
  const beginEdit = (entry: Entry) => { setEditingId(entry.id); setEditDraft({ name: entry.name, portion: entry.portion }); };
  const saveEdit = async () => {
    if (!editingId || !editDraft.name.trim() || !editDraft.portion.trim()) return;
    const portionGrams = Number.parseFloat(editDraft.portion.replace(",", "."));
    if (!Number.isFinite(portionGrams) || portionGrams <= 0) {
      setMessage("Porsi makanan harus berupa angka lebih dari nol.");
      return;
    }
    const response = await fetch(`/api/nutrition/entries/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        foodName: editDraft.name.trim(),
        portionGrams,
      }),
    });
    if (!response.ok) {
      setMessage("Perubahan catatan gagal disimpan.");
      return;
    }
    const result = (await response.json().catch(() => null)) as
      | { success?: boolean; entry?: StoredNutritionEntry }
      | null;
    setLog((entries) =>
      entries.map((entry) =>
        entry.id === editingId && result?.entry
          ? storedEntry(result.entry)
          : entry,
      ),
    );
    setEditingId(null);
    setMessage("Perubahan tersimpan.");
    notifyDataChanged();
  };

  // Filtered log entries
  const filteredEntries = useMemo(() => {
    const now = filterNow;
    if (historyFilter === "today") {
      const today = new Date(now).toDateString();
      return log.filter(
        (entry) => new Date(entry.loggedAt).toDateString() === today,
      );
    }
    const windowMs =
      historyFilter === "week"
        ? 7 * 24 * 60 * 60_000
        : 31 * 24 * 60 * 60_000;
    return log.filter(
      (entry) => now - new Date(entry.loggedAt).getTime() <= windowMs,
    );
  }, [filterNow, log, historyFilter]);

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
  const periodDays =
    historyFilter === "today" ? 1 : historyFilter === "week" ? 7 : 31;
  const targets = {
    protein: (overview?.daily.protein.target ?? 80) * periodDays,
    carbs: (overview?.daily.carbs.target ?? 220) * periodDays,
    fiber: (overview?.daily.fiber.target ?? 25) * periodDays,
  };
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
      {/* Main Tab Navigation - Progressive Disclosure */}
      <div className="relative z-20">
        <details className="group relative">
          <summary className="flex cursor-pointer select-none items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4 shadow-sm outline-none transition hover:bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                {(() => {
                  const Icon = mainTabs.find((t) => t.key === tab)?.icon ?? Camera;
                  return <Icon className="h-5 w-5" />;
                })()}
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">Mode Navigasi</p>
                <p className="font-display text-sm font-extrabold text-foreground">{mainTabs.find(t => t.key === tab)?.label}</p>
              </div>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground">
               <ChevronDown className="h-4 w-4 transition duration-300 group-open:rotate-180" />
            </div>
          </summary>
          <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-line bg-card p-2 shadow-xl opacity-0 invisible group-open:opacity-100 group-open:visible transition-all duration-200">
            {mainTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={(e) => {
                    setTab(t.key);
                    e.currentTarget.closest('details')?.removeAttribute('open');
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${tab === t.key ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-bold">{t.label}</span>
                  {tab === t.key && <Check className="ml-auto h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </details>
      </div>

      {/* Tab Content */}
      {tab === "scan" && <FoodScanner onAdd={addEntry} />}
      {tab === "manual" && <ManualFoodInput onAdd={addEntry} />}
      {tab === "recommendation" && <AIMenuRecommendation />}
      {tab === "weight" && <BodyWeightTracker />}

      {/* Nutrition Summary Cards - Progressive Disclosure */}
      <details className="group rounded-3xl border border-line bg-card shadow-sm open:pb-4 transition-all duration-300">
        <summary className="flex cursor-pointer items-center justify-between p-4 outline-none select-none">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-extrabold text-foreground">Ringkasan Pemenuhan Gizi</p>
              <p className="text-xs text-muted-foreground">{totals.kcal} kcal Terhitung Hari Ini</p>
            </div>
          </div>
          <span className="text-brand text-xs font-bold group-open:hidden px-3 py-1.5 rounded-full bg-brand-soft">Lihat Detail</span>
        </summary>
        
        <div className="px-4 mt-2 grid gap-3 sm:grid-cols-3">
          {/* Protein */}
          <div className="rounded-2xl border border-line bg-secondary/30 p-3.5 space-y-1.5 shadow-sm">
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
          <div className="rounded-2xl border border-line bg-secondary/30 p-3.5 space-y-1.5 shadow-sm">
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
          <div className="rounded-2xl border border-line bg-secondary/30 p-3.5 space-y-1.5 shadow-sm">
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
      </details>

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
          {loading ? (
            <div className="rounded-2xl border border-dashed border-line p-6 text-center">
              <Database className="mx-auto h-6 w-6 animate-pulse text-brand" />
              <p className="mt-2 text-xs font-bold text-foreground">Memuat data makanan...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
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
          <p>{message ?? "Riwayat, makro, dan seluruh grafik terkait tersinkron langsung dengan database."}</p>
        </div>
      </div>
    </div>
  );
}
