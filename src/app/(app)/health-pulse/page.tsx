"use client";

import { useState } from "react";
import { Info, ArrowRight, Database, Footprints, Utensils, Droplets, Moon, Check } from "lucide-react";
import Link from "next/link";
import { 
  HealthPulseCard, 
  HealthPulseHistoryChart,
  HealthPulseTrendLineChart
} from "@/features/health-pulse/components/HealthPulseComponents";
import { HealthPulseDimensionChart } from "@/features/health-pulse/components/HealthPulseDimensionChart";
import { getPrimaryCompanionInsight } from "@/features/companion/helpers";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";
import { useCompanionName } from "@/hooks/useCompanionName";
import { useProgressData } from "@/providers/ProgressDataProvider";
import { notifyDataChanged } from "@/lib/data-sync";

function DailyCheckIn() {
  const { refresh } = useProgressData();
  const [sleepHours, setSleepHours] = useState("");
  const [waterMl, setWaterMl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const sleep = Number(sleepHours);
    const water = Number(waterMl);
    if ((!sleep || sleep <= 0) && (!water || water <= 0)) return;
    setSaving(true);
    setMessage(null);
    try {
      const requests: Promise<Response>[] = [];
      if (water > 0) {
        requests.push(
          fetch("/api/nutrition/water", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ volumeMl: water }),
          }),
        );
      }
      if (sleep > 0) {
        requests.push(
          fetch("/api/health/pulse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sleepHours: sleep }),
          }),
        );
      }
      const responses = await Promise.all(requests);
      if (responses.some((response) => !response.ok)) {
        throw new Error("Check-in belum dapat disimpan.");
      }
      setSleepHours("");
      setWaterMl("");
      setMessage("Check-in tersimpan dan semua grafik sudah diperbarui.");
      notifyDataChanged();
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Check-in belum dapat disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card card-pad space-y-4">
      <div>
        <h3 className="font-display text-base font-bold">Check-in harian</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Catat tidur dan air minum; Health Pulse serta ring progres akan
          dihitung ulang dari database.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold">
          Tidur terakhir (jam)
          <input
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            value={sleepHours}
            onChange={(event) => setSleepHours(event.target.value)}
            className="input mt-1 w-full"
            placeholder="Contoh: 7.5"
          />
        </label>
        <label className="text-xs font-bold">
          Tambah air (ml)
          <input
            type="number"
            min="1"
            max="5000"
            step="50"
            value={waterMl}
            onChange={(event) => setWaterMl(event.target.value)}
            className="input mt-1 w-full"
            placeholder="Contoh: 250"
          />
        </label>
      </div>
      <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
        <Check className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan check-in"}
      </button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </form>
  );
}

export default function HealthPulseDetailPage() {
  const { displayName } = useCompanionName();
  const { overview } = useProgressData();
  const noraInsight = getPrimaryCompanionInsight("health-pulse");
  if (!overview) {
    return (
      <div className="card card-pad mx-auto max-w-5xl text-center text-sm text-muted-foreground">
        Menghitung Health Pulse dari data akun...
      </div>
    );
  }
  const current = overview.healthPulse.current;
  const previous = overview.healthPulse.previous;
  const history = overview.healthPulse.history;

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 animate-fade-up-premium">
      {/* 1. Page Header */}
      <div className="border-b border-line/40 pb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Health Pulse
        </h1>
        <p className="mt-1.5 text-muted-foreground text-sm font-medium">
          Tampilan jelas mengenai perkembangan kebiasaan kebugaran Anda pada Nutrisi, Aktivitas, Tidur, Hidrasi, dan Manajemen Berat.
        </p>
      </div>

      <div className="card card-pad">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand"><Database className="h-4 w-4" /> Asal data hari ini</p><p className="mt-1 text-xs text-muted-foreground">Setiap skor dapat dilacak kembali ke jenis inputnya.</p></div>
          <span className="pill self-start bg-secondary text-[10px] font-bold text-muted-foreground">{current.dataCompleteness}% DATA TERISI</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 min-[480px]:grid-cols-4">
          {[{ icon: Footprints, label: "Aktivitas", source: "GPS terverifikasi" }, { icon: Utensils, label: "Nutrisi", source: "Pindai & manual" }, { icon: Droplets, label: "Hidrasi", source: "Catatan mandiri" }, { icon: Moon, label: "Tidur", source: "Catatan mandiri" }].map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-2xl border border-line bg-secondary/30 p-3"><Icon className="h-4 w-4 text-brand" /><p className="mt-2 text-xs font-bold text-foreground">{item.label}</p><p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{item.source}</p></div>; })}
        </div>
      </div>

      <DailyCheckIn />

      {/* Grid: Main details + Sidebar actions */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        {/* Main Columns: Detailed card + Nora interpretation + Chart */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Detailed Health Pulse Card */}
          <div data-tour="health-pulse-score">
            <HealthPulseCard 
              snapshot={current} 
              variant="detailed" 
              showReasons={true} 
              showTrustIndicators={true} 
              maxReasons={3} 
            />
          </div>

          {/* Grouped Vertical Bar Comparison Chart */}
          <div className="card card-pad space-y-3">
            <h3 className="font-display text-base font-bold text-foreground">Perbandingan Dimensi Health Pulse</h3>
            <p className="text-xs text-muted-foreground">Perbandingan skor 5 dimensi utama hari ini vs sebelumnya</p>
            <HealthPulseDimensionChart 
              current={current.dimensions} 
              previous={previous.dimensions} 
              compact={false}
              showLegend={true}
            />
          </div>

          {/* Companion compact interpretation */}
          {noraInsight && (
            <div className="space-y-3">
              <h3 className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider">Interpretasi dari {displayName}</h3>
              <CompanionCard insight={noraInsight} variant="compact" showPriority={true} />
            </div>
          )}

          {/* Interactive Line Chart Trend (Hari Ini / 7 Hari / 30 Hari) */}
          <HealthPulseTrendLineChart history={history} />

          {/* 14-Day History Trend Chart */}
          <HealthPulseHistoryChart history={history} />
        </div>

        {/* Sidebar details */}
        <div className="min-w-0 space-y-6">
          {/* Data Completeness Explanation */}
          <div className="card card-pad space-y-3">
            <div>
              <h3 className="font-display text-base font-bold text-foreground">Kelengkapan Data</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Penilaian metrik kesehatan hari ini</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">{current.dataCompleteness}%</span>
              <span className="text-xs text-muted-foreground font-semibold">Siap</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Health Pulse Anda didasarkan pada sebagian besar data aktivitas harian Anda.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold italic">
              * Data yang terlewat tidak dianggap sebagai kebiasaan tidak sehat.
            </p>
          </div>

          {/* Wellness Disclaimer */}
          <div className="card card-pad bg-secondary/30 border-line/60 space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <Info className="h-5 w-5 shrink-0 text-muted-foreground" />
              <h3 className="font-display text-sm font-bold">Panduan Kebugaran, Bukan Diagnosis Medis</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Health Pulse membantu Anda memahami pola kebiasaan harian Anda. Indikator ini tidak mendiagnosis kondisi medis atau menggantikan nasihat profesional medis.
            </p>
          </div>

          {/* Safe Next Action Widget */}
          <div className="card card-pad border border-brand/20 bg-brand-soft/5 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-foreground">Penyelarasan Harian</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Saran target berdasarkan area fokus</p>
            </div>
            <p className="text-xs text-foreground font-semibold">
              &ldquo;Jalan santai untuk pemulihan dapat membantu menyeimbangkan progres hari ini.&rdquo;
            </p>
            <Link href="/aktivitas" className="btn btn-primary btn-sm w-full inline-flex items-center justify-center gap-1 text-xs">
              Lanjutkan Journey <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
