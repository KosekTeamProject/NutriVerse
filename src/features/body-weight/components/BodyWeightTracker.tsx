"use client";
/* eslint-disable react-hooks/purity */

import { useState, useMemo } from "react";
import { Scale, TrendingDown, Target, Sparkles, Plus, Calendar, ArrowRight, Check } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { updateAuthSession } from "@/features/auth/session";

export type WeightEntry = {
  id: string;
  date: string;
  weightKg: number;
  bmi: number;
  timestamp: number;
};

const INITIAL_WEIGHT_HISTORY: WeightEntry[] = [
  { id: "1", date: "4 Minggu Lalu", weightKg: 68.0, bmi: 23.5, timestamp: Date.now() - 28 * 24 * 60 * 60 * 1000 },
  { id: "2", date: "3 Minggu Lalu", weightKg: 67.2, bmi: 23.2, timestamp: Date.now() - 21 * 24 * 60 * 60 * 1000 },
  { id: "3", date: "2 Minggu Lalu", weightKg: 66.5, bmi: 23.0, timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000 },
  { id: "4", date: "1 Minggu Lalu", weightKg: 65.8, bmi: 22.8, timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 },
];

export function BodyWeightTracker() {
  const session = useAuthSession();
  const [history, setHistory] = useState<WeightEntry[]>(INITIAL_WEIGHT_HISTORY);
  const [newWeight, setNewWeight] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [lastPromptTime, setLastPromptTime] = useState<number>(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const currentWeight = useMemo(() => {
    if (history.length > 0) return history[history.length - 1].weightKg;
    return session?.baseline?.weightKg ?? 65;
  }, [history, session]);

  const targetWeight = session?.baseline?.targetWeightKg ?? 60;
  const heightCm = session?.baseline?.heightCm ?? 170;

  // Calculate days since last update
  const daysSinceLastUpdate = Math.floor((Date.now() - lastPromptTime) / (1000 * 60 * 60 * 24));
  const isSevenDaysPassed = daysSinceLastUpdate >= 7;

  function handleAddWeight(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(newWeight);
    if (!val || val <= 30 || val >= 300) return;

    const bmi = Number((val / ((heightCm / 100) ** 2)).toFixed(1));
    const entry: WeightEntry = {
      id: Date.now().toString(),
      date: "Hari Ini",
      weightKg: val,
      bmi,
      timestamp: Date.now()
    };

    setHistory((prev) => [...prev, entry]);
    setLastPromptTime(Date.now());
    setNewWeight("");
    setShowInput(false);

    if (session?.baseline) {
      updateAuthSession({
        baseline: {
          ...session.baseline,
          weightKg: val,
          bmi
        }
      });
    }
  }

  // Min and max for chart scaling
  const minW = Math.min(...history.map((h) => h.weightKg), targetWeight) - 2;
  const maxW = Math.max(...history.map((h) => h.weightKg), targetWeight) + 2;

  return (
    <section className="card card-pad space-y-6 border-line/60 bg-card transition-all duration-300 hover:shadow-soft">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line/45 pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Scale className="h-6 w-6" />
          </span>
          <div>
            <span className="eyebrow bg-brand-soft/40 border-brand/20 text-brand text-[10px] py-0.5 px-2">
              Body Weight &amp; BMI
            </span>
            <h3 className="font-display text-lg font-extrabold text-foreground">Pemantauan Berat Badan</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInput(!showInput)}
          className="btn btn-primary btn-sm inline-flex items-center gap-1.5 font-bold text-xs"
        >
          <Plus className="h-4 w-4" /> Perbarui Berat
        </button>
      </div>

      {/* 7-Day Nora Reminder Prompt */}
      {isSevenDaysPassed && (
        <div className="rounded-2xl border border-brand/30 bg-brand-soft/30 p-4 flex items-start gap-3 animate-fade-up">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm">
            <Sparkles className="h-5 w-5 animate-breathe" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-bold text-brand uppercase tracking-wider">Pengingat Nora (7 Hari Sekali)</p>
            <p className="text-sm leading-relaxed text-foreground font-medium">
              &ldquo;Halo 👋 Sudah seminggu sejak terakhir kali memperbarui berat badan. Yuk perbarui agar rekomendidku semakin akurat.&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Weight Update Form Modal/Drawer Inset */}
      {showInput && (
        <form onSubmit={handleAddWeight} className="animate-fade-up rounded-2xl border border-brand/30 bg-secondary/30 p-4 space-y-3">
          <p className="text-xs font-bold text-foreground">Masukkan Berat Badan Terbaru (kg)</p>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="input text-sm font-bold flex-1"
              placeholder={`Contoh: ${currentWeight}`}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm px-4">
              Simpan <Check className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {/* Weight Summary Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-card p-3 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Saat Ini</p>
          <p className="stat-num mt-1 text-xl font-extrabold text-foreground">{currentWeight} <span className="text-xs font-normal">kg</span></p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-3 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">BMI Terkini</p>
          <p className="stat-num mt-1 text-xl font-extrabold text-brand">
            {(currentWeight / ((heightCm / 100) ** 2)).toFixed(1)}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-3 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Target</p>
          <p className="stat-num mt-1 text-xl font-extrabold text-sky">{targetWeight} <span className="text-xs font-normal">kg</span></p>
        </div>
      </div>

      {/* Interactive Line & Bar Weight Trend Chart */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground flex items-center gap-1">
            <TrendingDown className="h-4 w-4 text-brand" /> Progres Berat Badan
          </span>
          <span className="text-[10px] text-muted-foreground">Garis Target: {targetWeight} kg</span>
        </div>

        <div className="relative h-40 w-full rounded-2xl border border-line bg-secondary/20 p-4 flex items-end justify-between gap-3">
          {/* Target Line */}
          <div
            className="absolute inset-x-4 border-b-2 border-dashed border-sky/50 z-0 pointer-events-none"
            style={{
              bottom: `${((targetWeight - minW) / (maxW - minW)) * 100}%`
            }}
          >
            <span className="absolute right-0 -top-4 text-[9px] font-bold text-sky bg-card px-1 rounded border border-sky/20">Target</span>
          </div>

          {/* Bar / Node per Entry */}
          {history.map((item) => {
            const heightPct = Math.max(10, Math.min(100, ((item.weightKg - minW) / (maxW - minW)) * 100));
            return (
              <div key={item.id} className="relative z-10 flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="opacity-0 group-hover:opacity-100 transition text-[10px] font-extrabold text-brand bg-card px-1.5 py-0.5 rounded shadow-sm border border-line">
                  {item.weightKg} kg
                </span>
                <div
                  className="w-full max-w-[36px] rounded-t-xl bg-gradient-to-t from-brand to-lime transition-all duration-500 group-hover:scale-105"
                  style={{ height: `${heightPct}%` }}
                />
                <span className="text-[9px] font-bold text-muted-foreground truncate max-w-full">{item.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
