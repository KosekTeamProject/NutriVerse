"use client";

import { 
  Info, 
  Droplet, 
  Sparkles 
} from "lucide-react";
import { NutritionTrustLevel } from "@/lib/food";
import { preparedNutritionSummary } from "../data";

export function getTrustLevelLabel(trust: NutritionTrustLevel): string {
  switch (trust) {
    case "confirmed": return "Identitas Dikonfirmasi";
    case "estimated": return "Nilai Nutrisi Diestimasi";
    case "self-reported": return "Dilaporkan Pengguna";
    case "simulated": return "Simulasi";
    case "missing": return "Data Belum Lengkap";
    default: return trust;
  }
}

export function getTrustLevelDescription(trust: NutritionTrustLevel): string {
  switch (trust) {
    case "confirmed": return "Identitas makanan telah dikonfirmasi, tetapi nilai nutrisi tetap merupakan estimasi berdasarkan jenis, porsi, dan cara pengolahan.";
    case "estimated": return "Nilai nutrisi tetap merupakan estimasi berdasarkan jenis, porsi, dan cara pengolahan.";
    case "self-reported": return "Dilaporkan langsung oleh pengguna.";
    case "simulated": return "Simulasi demonstrasi MVP.";
    case "missing": return "Data gizi belum lengkap.";
    default: return "";
  }
}

export function NutritionTrustBadge({ trust }: { readonly trust: NutritionTrustLevel }) {
  const colors = {
    confirmed: "bg-brand-soft text-brand border-brand/20",
    estimated: "bg-secondary text-muted-foreground border-line",
    "self-reported": "bg-secondary text-muted-foreground border-line",
    simulated: "bg-secondary text-muted-foreground border-line",
    missing: "bg-amber/10 text-amber border-amber/15"
  }[trust] || "bg-secondary text-muted-foreground";

  return (
    <span className={`pill text-[9px] font-bold uppercase tracking-wider ${colors}`}>
      {getTrustLevelLabel(trust)}
    </span>
  );
}

export function NutritionLimitationCard() {
  return (
    <div className="card card-pad bg-secondary/40 border-line/65 space-y-3">
      <h4 className="font-display text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
        <Info className="h-4 w-4 text-muted-foreground" /> ESTIMASI, BUKAN KLINIS
      </h4>
      <p className="text-[11px] text-muted-foreground leading-normal">
        Identitas makanan telah dikonfirmasi, tetapi nilai nutrisi tetap merupakan estimasi berdasarkan jenis, porsi, dan cara pengolahan. Pengalaman ini tidak mendiagnosis masalah kesehatan atau menggantikan nasihat profesional medis.
      </p>
    </div>
  );
}

export function NutritionProgressSummary() {
  const s = preparedNutritionSummary;
  const proteinPct = Math.min(100, Math.round((s.proteinCurrent / s.proteinTarget) * 100));

  return (
    <div className="card card-pad space-y-4 border-line/60 bg-card">
      <div className="flex items-start justify-between border-b border-line/45 pb-3">
        <div>
          <span className="pill bg-secondary text-muted-foreground text-[9px] font-bold uppercase tracking-wider">
            Ringkasan Nutrisi Hari Ini
          </span>
          <h3 className="font-display text-base font-bold text-foreground mt-1.5">Verifikasi Asupan</h3>
        </div>
        <span className="pill bg-brand-soft text-brand text-[10px] font-bold uppercase">
          Identitas Dikonfirmasi
        </span>
      </div>

      {/* Protein progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-brand" /> Progres Protein</span>
          <span className="stat-num text-foreground">{s.proteinCurrent} / {s.proteinTarget} g ({proteinPct}%)</span>
        </div>
        <div className="chart-progress h-2 overflow-hidden rounded-full">
          <div className="h-full rounded-full bg-brand" style={{ width: `${proteinPct}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          * Berdasarkan entri terstruktur yang dikonfirmasi (privat).
        </p>
      </div>

      {/* Hydration progress */}
      <div className="space-y-2 border-t border-line/35 pt-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1"><Droplet className="h-3.5 w-3.5 text-sky" /> Hidrasi Harian</span>
          <span className="stat-num text-foreground">{s.hydrationCurrent} / {s.hydrationTarget}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
          <span>Tingkat Kepercayaan: <span className="capitalize font-semibold text-foreground">Dilaporkan Pengguna</span></span>
          <span className="italic">privat</span>
        </div>
      </div>
    </div>
  );
}
