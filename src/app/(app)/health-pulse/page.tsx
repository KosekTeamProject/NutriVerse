"use client";

import { Info, ArrowRight } from "lucide-react";
import Link from "next/link";
import { currentSnapshot, previousSnapshot, historyPoints } from "@/features/health-pulse/data";
import { 
  HealthPulseCard, 
  HealthPulseHistoryChart 
} from "@/features/health-pulse/components/HealthPulseComponents";
import { HealthPulseDimensionChart } from "@/features/health-pulse/components/HealthPulseDimensionChart";
import { getPrimaryCompanionInsight } from "@/features/companion/helpers";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";
import { useCompanionName } from "@/hooks/useCompanionName";

export default function HealthPulseDetailPage() {
  const { displayName } = useCompanionName();
  const noraInsight = getPrimaryCompanionInsight("health-pulse");

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

      {/* Grid: Main details + Sidebar actions */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        {/* Main Columns: Detailed card + Nora interpretation + Chart */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Detailed Health Pulse Card */}
          <HealthPulseCard 
            snapshot={currentSnapshot} 
            variant="detailed" 
            showReasons={true} 
            showTrustIndicators={true} 
            maxReasons={3} 
          />

          {/* Grouped Vertical Bar Comparison Chart */}
          <div className="card card-pad space-y-3">
            <h3 className="font-display text-base font-bold text-foreground">Perbandingan Dimensi Health Pulse</h3>
            <p className="text-xs text-muted-foreground">Perbandingan skor 5 dimensi utama hari ini vs sebelumnya</p>
            <HealthPulseDimensionChart 
              current={currentSnapshot.dimensions} 
              previous={previousSnapshot.dimensions} 
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

          {/* 14-Day History Trend Chart */}
          <HealthPulseHistoryChart history={historyPoints} />
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
              <span className="text-3xl font-extrabold text-foreground">{currentSnapshot.dataCompleteness}%</span>
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
