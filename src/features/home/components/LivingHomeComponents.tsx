"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  Flame, 
  Footprints,
  Calendar
} from "lucide-react";
import { 
  DemoTraveler, 
  ChallengePreview 
} from "../../demo/types";
import { JourneyRecord } from "../../journey/types";
import { CompanionWeeklyLetter } from "../../companion/types";
import { useCompanionName } from "@/hooks/useCompanionName";
import { useAuthSession } from "@/hooks/useAuthSession";

// 1. LivingHomeHeader
export function LivingHomeHeader({ traveler }: { traveler: DemoTraveler }) {
  const session = useAuthSession();
  const displayName = session?.name ?? traveler.name;
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-line/40 pb-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Halo, {displayName}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tindakan kecil mulai menjadi bagian dari perjalanan Anda.
        </p>
      </div>
      <div className="flex items-center gap-2.5 self-start md:self-center">
        <span className="eyebrow bg-brand-soft/30 border-brand/20 text-brand">
          <Calendar className="h-3.5 w-3.5" /> Hari ke-{traveler.journeyDay}
        </span>
        <span className="pill bg-amber/15 text-amber font-semibold">
          <Flame className="h-3.5 w-3.5" /> Streak {traveler.currentStreak} Hari
        </span>
      </div>
    </div>
  );
}

// 5. RecentJourneyCard
export function RecentJourneyCard({ record }: { record: JourneyRecord }) {
  const distanceMetric = record.metrics.find((m) => m.label === "Distance") || record.metrics[0];

  return (
    <div className="card card-pad space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold">Perjalanan Terbaru</h3>
        <p className="text-xs text-muted-foreground mt-1">Segmen aktivitas fisik terakhirmu</p>
      </div>

      <div className="rounded-2xl border border-line/50 p-4 bg-card space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-display text-base font-bold text-foreground">{record.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{record.summary}</p>
          </div>
          {distanceMetric && (
            <span className="pill bg-brand-soft text-brand font-semibold flex shrink-0 items-center gap-1 text-[11px]">
              <Footprints className="h-3.5 w-3.5" /> {distanceMetric.value}
            </span>
          )}
        </div>

        {record.healthPulseAfter !== undefined && record.healthPulseBefore !== undefined && (
          <div className="flex items-center gap-3 py-1 bg-secondary/30 rounded-xl px-3 border border-line/20 justify-between">
            <span className="text-xs text-muted-foreground font-medium">Perubahan Pulse</span>
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span className="text-muted-foreground font-normal line-through">{record.healthPulseBefore.toFixed(1)}</span>
              <ArrowRight className="h-3 w-3 text-brand" />
              <span className="text-brand">{record.healthPulseAfter.toFixed(1)}</span>
            </span>
          </div>
        )}

        <div className="text-xs text-muted-foreground italic leading-relaxed border-l-2 border-brand/35 pl-3">
          &ldquo;{record.meaning}&rdquo;
        </div>
      </div>

    </div>
  );
}

// 6. WeeklyReflectionCard
export function WeeklyReflectionCard({ letter }: { readonly letter: CompanionWeeklyLetter }) {
  const { displayName } = useCompanionName();
  return (
    <div className="card card-pad flex flex-col justify-between space-y-4 bg-gradient-to-br from-card to-secondary/30">
      <div>
        <span className="pill bg-brand-soft text-brand text-[9px] font-bold uppercase tracking-wider">Refleksi Mingguan {displayName}</span>
        <h3 className="font-display text-base font-bold text-foreground mt-1.5">{letter.title} Preview</h3>
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed italic">
        &ldquo;{letter.opening}&rdquo;
      </p>
      <div className="pt-2 border-t border-line/40 flex items-center justify-between">
        <span className="pill bg-brand-soft text-brand text-[10px] font-bold">Siap Dibaca</span>
        <Link 
          href="/companion/weekly-letter" 
          className="btn btn-outline btn-sm text-xs font-bold leading-none inline-flex items-center gap-1"
        >
          Baca Surat Mingguan <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// 7. ActiveChallengeCard
export function ActiveChallengeCard({ challenge }: { challenge: ChallengePreview }) {
  const pct = Math.min(100, Math.round((challenge.progress / challenge.target) * 100));

  return (
    <div className="card card-pad space-y-4 border-line/60 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="eyebrow bg-amber/10 border-amber/20 text-amber text-[10px]">Tantangan Aktif</span>
          <h3 className="font-display text-lg font-bold text-foreground mt-2">{challenge.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0 max-w-[42%]">
          <span className="pill bg-secondary text-muted-foreground font-semibold whitespace-normal text-right leading-tight text-[11px]">
            {challenge.status === "in-progress" ? "Sedang Berjalan" : challenge.status}
          </span>
          <span className="pill bg-brand-soft text-brand text-[9px] font-bold uppercase whitespace-normal text-right leading-tight">
            Progres Otomatis
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Perkembangan Total</span>
          <span className="stat-num text-foreground">{challenge.progress} / {challenge.target} {challenge.unit} ({pct}%)</span>
        </div>
        <div className="chart-progress h-2 overflow-hidden rounded-full">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-amber to-brand transition-all duration-500" 
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-line/50 p-3 bg-secondary/20 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Estimasi Hadiah</span>
          <span className="font-bold text-amber text-xs">
            +{challenge.potentialReward.xp} XP Potensial &middot; +{challenge.potentialReward.hp} HP Potensial
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight italic">
          * Hadiah potensial diberikan setelah penyelesaian tervalidasi. Hanya aktivitas tepercaya yang berkontribusi.
        </p>
      </div>

      <div className="pt-1">
        <Link href="/challenge/challenge-light-cardio" className="btn btn-outline w-full text-center text-sm font-semibold justify-center">
          Lihat Tantangan
        </Link>
      </div>
    </div>
  );
}
