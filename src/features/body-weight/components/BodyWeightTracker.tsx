"use client";
/* eslint-disable react-hooks/purity */

import { useEffect, useState, useMemo } from "react";
import { Scale, TrendingDown, Sparkles, Plus, Check } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { updateAuthSession } from "@/features/auth/session";
import { notifyDataChanged } from "@/lib/data-sync";

export type WeightEntry = {
  id: string;
  date: string;
  weightKg: number;
  bmi: number;
  timestamp: number;
};

type StoredHealthMetric = {
  id: string;
  weightKg: number | null;
  bmi: number | null;
  recordedAt: string;
};

function formatEntryDate(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Hari Ini";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function BodyWeightTracker() {
  const session = useAuthSession();
  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [lastPromptTime, setLastPromptTime] = useState<number>(Date.now());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/health/metrics?limit=30", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; metrics?: StoredHealthMetric[]; error?: string }
          | null;
        if (!response.ok || !result?.success) {
          throw new Error(result?.error ?? "Riwayat berat belum dapat dimuat.");
        }
        if (!active) return;
        const entries = (result.metrics ?? [])
          .filter(
            (metric): metric is StoredHealthMetric & { weightKg: number } =>
              typeof metric.weightKg === "number",
          )
          .map((metric) => {
            const timestamp = new Date(metric.recordedAt).getTime();
            return {
              id: metric.id,
              date: formatEntryDate(timestamp),
              weightKg: metric.weightKg,
              bmi: metric.bmi ?? 0,
              timestamp,
            };
          })
          .sort((a, b) => a.timestamp - b.timestamp);
        setHistory(entries);
        if (entries.length > 0) {
          setLastPromptTime(entries[entries.length - 1].timestamp);
        } else {
          setLastPromptTime(0);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Riwayat berat belum dapat dimuat.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const currentWeight = useMemo(() => {
    if (history.length > 0) return history[history.length - 1].weightKg;
    return session?.baseline?.weightKg ?? 65;
  }, [history, session]);

  const targetWeight = session?.baseline?.targetWeightKg ?? 60;
  const heightCm = session?.baseline?.heightCm ?? 170;

  // Calculate days since last update
  const daysSinceLastUpdate = Math.floor((Date.now() - lastPromptTime) / (1000 * 60 * 60 * 24));
  const isSevenDaysPassed = daysSinceLastUpdate >= 7;

  async function handleAddWeight(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(newWeight);
    if (!val || val <= 30 || val >= 300) return;

    const bmi = Number((val / ((heightCm / 100) ** 2)).toFixed(1));
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/health/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: val }),
      });
      const result = (await response.json().catch(() => null)) as
        | { success?: boolean; metric?: StoredHealthMetric; error?: string }
        | null;
      if (!response.ok || !result?.success || !result.metric) {
        throw new Error(result?.error ?? "Berat badan gagal disimpan.");
      }
      const timestamp = new Date(result.metric.recordedAt).getTime();
      const entry: WeightEntry = {
        id: result.metric.id,
        date: formatEntryDate(timestamp),
        weightKg: result.metric.weightKg ?? val,
        bmi: result.metric.bmi ?? bmi,
        timestamp,
      };
      setHistory((prev) => [...prev, entry].sort((a, b) => a.timestamp - b.timestamp));
      setLastPromptTime(timestamp);
      setNewWeight("");
      setShowInput(false);
      notifyDataChanged();

      if (session?.baseline) {
        updateAuthSession({
          baseline: {
            ...session.baseline,
            weightKg: val,
            bmi,
          },
        });
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Berat badan gagal disimpan.",
      );
    } finally {
      setSaving(false);
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
              {saving ? "Menyimpan..." : "Simpan"} <Check className="h-4 w-4" />
            </button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
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
          {history.length === 0 && (
            <div className="absolute inset-0 grid place-items-center px-8 text-center text-xs text-muted-foreground">
              Belum ada pengukuran. Simpan berat pertama untuk membentuk grafik.
            </div>
          )}
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
