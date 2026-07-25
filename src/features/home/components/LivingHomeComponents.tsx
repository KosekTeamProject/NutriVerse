"use client";
/* eslint-disable react-hooks/purity */

import Link from "next/link";
import { 
  ArrowRight, 
  Flame, 
  Footprints,
  Calendar
} from "lucide-react";
import { ChallengePreview } from "../../demo/types";
import { JourneyRecord } from "../../journey/types";
import { CompanionWeeklyLetter } from "../../companion/types";
import { useCompanionName } from "@/hooks/useCompanionName";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useMemo, useState, useEffect } from "react";
import { useProgressData } from "@/providers/ProgressDataProvider";
import { Users2, Megaphone } from "lucide-react";
import type { CommunityOverview } from "@/features/progress/types";

// 1. DashboardHero (Replaces LivingHomeHeader and ProactiveNoraBanner)
export function DashboardHero() {
  const session = useAuthSession();
  const { overview } = useProgressData();
  const { displayName } = useCompanionName();
  const userName = (overview?.identity.name ?? session?.name ?? "Pengguna").split(" ")[0];

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
            <Flame className="h-3 w-3" /> Streak {overview?.economy.streakDays ?? 0} Hari
          </span>
          <span className="pill bg-secondary/80 text-foreground text-[10px] font-semibold backdrop-blur-md hidden sm:flex">
            <Calendar className="h-3 w-3" /> {overview?.healthyDays.achievedDays ?? 0} hari sehat / 28 hari
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
    <div className="group relative overflow-hidden rounded-[2rem] border border-line bg-card p-6 shadow-sm transition-all hover:shadow-soft hover:-translate-y-1">
      {/* Gamified Background Elements */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber/10 blur-2xl transition-transform group-hover:scale-125" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-brand/10 blur-xl transition-transform group-hover:scale-125" />
      
      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber ring-1 ring-amber/20">
              <Flame className="h-3.5 w-3.5" /> Tantangan Aktif
            </span>
            <h3 className="font-display mt-3 text-xl font-extrabold text-foreground">{challenge.title}</h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="inline-flex rounded-xl bg-secondary/80 px-2.5 py-1 text-[11px] font-bold text-muted-foreground backdrop-blur-sm">
              {challenge.status === "in-progress" ? "Sedang Berjalan" : challenge.status}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-muted-foreground">Progres Misi</span>
            <span className="text-foreground">{challenge.progress} / {challenge.target} {challenge.unit} <span className="ml-1 text-brand">({pct}%)</span></span>
          </div>
          <div className="chart-progress h-3 overflow-hidden rounded-full bg-secondary shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber to-brand transition-all duration-1000 ease-out" 
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/40 bg-card/60 p-4 backdrop-blur-md">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Potensi Hadiah</span>
            <span className="mt-0.5 block text-sm font-extrabold text-amber">
              +{challenge.potentialReward.xp} XP &middot; +{challenge.potentialReward.hp} HP
            </span>
          </div>
          <Link href="/challenge/challenge-light-cardio" className="btn btn-primary rounded-xl px-5 py-2 text-xs shadow-sm transition hover:scale-105 active:scale-95">
            Lanjutkan Misi
          </Link>
        </div>
      </div>
    </div>
  );
}

// 8. DashboardCommunityHighlight
export function DashboardCommunityHighlight() {
  const [overview, setOverview] = useState<CommunityOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/community/overview", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.success && data.overview) {
          setOverview(data.overview);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !overview || overview.events.length === 0) return null;

  const firstEvent = overview.events[0];
  const participants = firstEvent.participants;
  const capacity = firstEvent.capacity;
  const progress = capacity > 0 ? Math.min(100, Math.round((participants / capacity) * 100)) : 0;

  return (
    <div className="card border-line/60 bg-gradient-to-br from-card via-card to-brand-soft/20 shadow-sm animate-fade-up">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="pill bg-brand text-[9px] font-bold text-white uppercase flex items-center gap-1">
              <Megaphone className="h-3 w-3" /> Event Komunitas
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Users2 className="h-3 w-3" /> {participants} bergabung
            </span>
          </div>
          <h3 className="font-display text-base font-bold text-foreground truncate">
            {firstEvent.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
            Berlangsung di {firstEvent.location || "Lokasi menyusul"}
          </p>
          
          <div className="mt-3 sm:hidden">
            {/* Mobile progress bar */}
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Kuota terpenuhi</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        
        <Link href="/komunitas" className="btn btn-primary btn-sm shrink-0 w-full sm:w-auto mt-2 sm:mt-0 justify-center">
          Lihat Komunitas
        </Link>
      </div>
    </div>
  );
}
