"use client";
/* eslint-disable react-hooks/purity */

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
import { Sparkles } from "lucide-react";
import { useMemo } from "react";

// 1. DashboardHero (Replaces LivingHomeHeader and ProactiveNoraBanner)
export function DashboardHero({ traveler }: { readonly traveler: DemoTraveler }) {
  const session = useAuthSession();
  const { displayName } = useCompanionName();
  const userName = (session?.name ?? traveler.name).split(" ")[0];

  const isReturningUser = useMemo(() => {
    if (!session?.lastLoginTimestamp) return false;
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    return Date.now() - session.lastLoginTimestamp >= twoDaysMs;
  }, [session]);

  const getProactiveContent = () => {
    if (isReturningUser) {
      return {
        title: `Aku sempat khawatir, ${userName}`,
        message: `Senang melihat kamu kembali 😊 Mari kita mulai lagi dari satu tindakan kecil hari ini tanpa tekanan.`,
        actionLabel: "Mulai Aktivitas GPS",
        actionHref: "/aktivitas"
      };
    }

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        title: `Selamat pagi, ${userName}`,
        message: `Aku melihat hari ini cuaca cukup cerah. Bagaimana kalau kita mulai dengan jalan santai 15 menit?`,
        actionLabel: "Mulai Jalan 15m",
        actionHref: "/aktivitas"
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        title: `Selamat siang, ${userName}`,
        message: `Sudah pertengahan hari! Jangan lupa minum 2 gelas air dan selipkan regangan tubuh ringan ya.`,
        actionLabel: "Catat Air Minum",
        actionHref: "/todays-journey"
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        title: `Selamat sore, ${userName}`,
        message: `Waktu yang tepat untuk jalan santai sore atau merenggangkan otot setelah beraktivitas seharian.`,
        actionLabel: "Mulai Aktivitas",
        actionHref: "/aktivitas"
      };
    } else {
      return {
        title: `Selamat malam, ${userName}`,
        message: `Istirahat yang cukup malam ini agar energi dan Health Pulse kamu kembali segar besok pagi.`,
        actionLabel: "Lihat Jurnal Sehat",
        actionHref: "/journey"
      };
    }
  };

  const content = getProactiveContent();

  return (
    <section className="card relative min-w-0 overflow-hidden border-line/60 bg-card shadow-soft animate-fade-up group">
      {/* Background Image for Desktop/Tablet */}
      <div className="absolute inset-x-0 top-0 h-48 sm:h-auto sm:inset-y-0 sm:left-1/3 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-card via-card/70 to-transparent z-10" />
        <img 
          src="/images/dashboard-hero.png" 
          alt="Aktivitas sehat pagi hari" 
          className="h-full w-full object-cover object-[center_30%] opacity-50 sm:opacity-90 mix-blend-overlay sm:mix-blend-normal transition-transform duration-1000 group-hover:scale-105" 
        />
      </div>

      <div className="relative z-20 flex flex-col gap-6 pt-24 pb-6 px-5 sm:p-8 sm:w-[70%]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="eyebrow bg-brand-soft border-brand/20 text-brand text-[10px] py-0.5 px-2.5 backdrop-blur-md">
            Proaktif AI Companion &middot; {displayName}
          </span>
          <span className="pill bg-amber/15 text-amber text-[10px] font-bold shadow-sm backdrop-blur-md">
            <Flame className="h-3 w-3" /> Streak {traveler.currentStreak} Hari
          </span>
          <span className="pill bg-secondary/80 text-foreground text-[10px] font-semibold backdrop-blur-md hidden sm:flex">
            <Calendar className="h-3 w-3" /> Hari ke-{traveler.journeyDay}
          </span>
        </div>

        <div className="space-y-2 max-w-lg">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            {content.title}
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground font-medium">
            {content.message}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link href={content.actionHref} className="btn btn-primary text-xs shadow-soft px-5 py-2.5">
            {content.actionLabel} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/companion" className="btn btn-ghost text-xs bg-secondary/50 hover:bg-secondary border border-line/50 backdrop-blur-md px-5 py-2.5">
            Tanya {displayName}
          </Link>
        </div>
      </div>
    </section>
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
