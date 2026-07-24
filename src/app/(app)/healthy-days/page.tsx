"use client";

import { ArrowLeft, Compass, Info, AlertTriangle, ShieldCheck, Flame } from "lucide-react";
import Link from "next/link";
import { HealthyDayHeatmap, StreakSummaryCard } from "@/features/behavior/components/BehaviorComponents";
import { useProgressData } from "@/providers/ProgressDataProvider";

export default function HealthyDaysHistoryPage() {
  const { overview } = useProgressData();
  if (!overview) {
    return (
      <div className="card card-pad mx-auto max-w-4xl text-center text-sm text-muted-foreground">
        Menyusun kalender Hari Sehat dari database...
      </div>
    );
  }
  const journey = overview.todayJourney;
  const history = overview.healthyDays.history;
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      {/* Back button */}
      <div>
        <Link 
          href="/todays-journey" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-brand transition"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Perjalanan Hari Ini
        </Link>
      </div>

      {/* 1. Page Header */}
      <div className="border-b border-line/40 pb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Riwayat Hari Sehat
        </h1>
        <p className="mt-1.5 text-muted-foreground text-sm font-medium">
          Lihat bagaimana aktivitas, nutrisi, pemulihan, dan kebiasaan sehari-hari membangun konsistensi.
        </p>
      </div>

      {/* 2. Streak Summary Card */}
      <StreakSummaryCard summary={journey.streak} />

      {/* 3. 28-day Heatmap Widget */}
      <HealthyDayHeatmap history={history} />

      {/* 4. Consistency Summary Metrics */}
      <div className="card card-pad space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Ringkasan Konsistensi</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Metrik ringkas dari siklus 28 hari terakhir.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
          <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Hari Tercapai</p>
            <p className="text-lg font-extrabold text-foreground">{overview?.healthyDays.achievedDays ?? 0}</p>
          </div>

          <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Hari Pemulihan</p>
            <p className="text-lg font-extrabold text-sky">{overview?.healthyDays.recoveryDays ?? 0}</p>
          </div>

          <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Streak Aktif</p>
            <p className="text-lg font-extrabold text-brand flex items-center justify-center gap-1">
              <Flame className="h-4.5 w-4.5" /> {journey.streak.currentDays}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Rata-rata Kelengkapan</p>
            <p className="text-lg font-extrabold text-foreground">{overview?.healthyDays.averageCompleteness ?? 0}%</p>
          </div>
        </div>
      </div>

      {/* 5. Recovery Protects Progress Card */}
      <div className="card card-pad bg-gradient-to-br from-card to-secondary/35 border-line space-y-3">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-4.5 w-4.5 text-brand" /> Pemulihan Menjaga Progres
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed leading-normal">
          Istirahat, peregangan, tidur, dan aktivitas ringan dapat mendukung Hari Sehat saat pemulihan menjadi fokus. Konsistensi tidak menuntut olahraga berat setiap hari.
        </p>
      </div>

      {/* 6. Data Completeness Explanation Box */}
      <div className="card card-pad bg-secondary/35 border-line/65 space-y-3">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
          <Info className="h-4.5 w-4.5 text-muted-foreground" /> Aturan Kelengkapan Sumber Data
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed leading-normal">
          Sebagian hari memiliki data terverifikasi, sebagian berupa catatan mandiri, dan sebagian masih membutuhkan informasi. Data yang kosong tidak dianggap sebagai perilaku tidak sehat.
        </p>
      </div>

      {/* 7. Bottom Navigation CTA */}
      <div className="pt-2">
        <Link href="/todays-journey" className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
          <Compass className="h-5 w-5" /> Lanjutkan Perjalanan Hari Ini
        </Link>
      </div>

      {/* 8. MVP Transparency Note */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-[10px] text-muted-foreground border border-line/30">
        <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p>
          Kalender dan ringkasan pada halaman ini dihitung dari data harian yang tersimpan pada akunmu.
        </p>
      </div>
    </div>
  );
}
