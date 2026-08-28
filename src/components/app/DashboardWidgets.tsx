"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Target, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  CalendarCheck2, 
  TrendingUp, 
  ShieldCheck, 
  ScanLine, 
  Activity, 
  UsersRound, 
  Database,
  RefreshCw,
  Footprints,
  Droplets,
  Zap
} from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useProgressData } from "@/providers/ProgressDataProvider";

// Contextual AI Smart Motivations
const SMART_AI_MOTIVATIONS = [
  "Streak 7 harimu membuktikan bahwa kebiasaan kecil jika diulang secara rutin menghasilkan transformasi besar.",
  "Langkah kakimu hari ini sudah melampaui target dasar. Pertahankan ritme tubuh yang nyaman!",
  "Nutrisi sehat yang kamu catat siang ini membantu menjaga energi stabil hingga sore hari.",
  "Tidak perlu sempurna setiap hari; yang terpenting adalah kamu terus kembali dan melanjutkan perjalanan.",
  "Seteguk air jernih dan peregangan ringan 1 menit memberi dorongan fokus luar biasa untuk harimu."
];

export function DailyMotivationCard() {
  const session = useAuthSession();
  const [motivationIndex, setMotivationIndex] = useState(0);

  function nextMotivation() {
    setMotivationIndex((prev) => (prev + 1) % SMART_AI_MOTIVATIONS.length);
  }

  const goal = session?.baseline?.goal ?? "Pola Hidup Sehat";

  return (
    <section className="card card-pad relative overflow-hidden border-brand/20 bg-gradient-to-br from-brand-soft/40 via-card to-lime/10 shadow-soft transition-all duration-300 hover:shadow-lift">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white shadow-md">
            <Sparkles className="h-5 w-5 animate-breathe" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Smart AI Motivation &middot; Nora</span>
            <h3 className="font-display text-base font-bold text-foreground">Inspirasi Kebiasaan</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={nextMotivation}
          className="grid h-8 w-8 place-items-center rounded-xl border border-line bg-card text-muted-foreground transition hover:border-brand/40 hover:text-brand"
          title="Ganti motivasi AI"
          aria-label="Ganti motivasi AI"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-brand/10 bg-card/80 p-4 backdrop-blur-sm shadow-sm space-y-2">
        <span className="pill bg-brand-soft/50 text-brand text-[9px] font-extrabold uppercase">
          Fokus Goal: {goal}
        </span>
        <p className="text-sm font-semibold leading-relaxed text-foreground animate-scale-in">
          &ldquo;{SMART_AI_MOTIVATIONS[motivationIndex]}&rdquo;
        </p>
        <p className="mt-2 text-[10px] font-medium text-muted-foreground text-right">
          — Nora AI Companion
        </p>
      </div>
    </section>
  );
}

export function TodaysFocusCard() {
  const { overview } = useProgressData();
  const steps = overview?.daily.steps;
  const water = overview?.daily.water;
  const calories = overview?.daily.calories;
  const focusItems = [
    {
      id: "steps",
      label:
        (steps?.percent ?? 0) >= 100
          ? "Target langkah tercapai"
          : `${Math.max(0, Math.round((steps?.target ?? 8000) - (steps?.value ?? 0))).toLocaleString("id-ID")} langkah lagi`,
      note: `Target ${(steps?.target ?? 8000).toLocaleString("id-ID")} langkah`,
      completed: (steps?.percent ?? 0) >= 100,
      icon: Footprints,
      href: "/aktivitas",
    },
    {
      id: "water",
      label:
        (water?.percent ?? 0) >= 100
          ? "Target hidrasi tercapai"
          : `Tambah ${Math.max(0, Math.round((water?.target ?? 2000) - (water?.value ?? 0))).toLocaleString("id-ID")} ml air`,
      note: `${Math.round(water?.value ?? 0).toLocaleString("id-ID")} / ${Math.round(water?.target ?? 2000).toLocaleString("id-ID")} ml`,
      completed: (water?.percent ?? 0) >= 100,
      icon: Droplets,
      href: "/health-pulse",
    },
    {
      id: "food",
      label:
        (calories?.value ?? 0) > 0
          ? "Asupan hari ini sudah tercatat"
          : "Catat makanan pertama",
      note: `${Math.round(calories?.value ?? 0).toLocaleString("id-ID")} kkal tercatat`,
      completed: (calories?.value ?? 0) > 0,
      icon: ScanLine,
      href: "/scan",
    },
  ];

  const completedCount = focusItems.filter((item) => item.completed).length;

  return (
    <section className="card card-pad space-y-4 border-line/60 bg-card transition-all duration-300 hover:shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Target className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Prioritas Utama</span>
            <h3 className="font-display text-base font-bold text-foreground">Today&apos;s Focus</h3>
          </div>
        </div>
        <span className="pill bg-brand-soft text-brand text-xs font-bold">
          {completedCount} / 3 Selesai
        </span>
      </div>

      {/* Max 3 Priorities */}
      <div className="space-y-2.5">
        {focusItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all duration-300 ${
                item.completed
                  ? "border-brand/30 bg-brand-soft/20 text-muted-foreground"
                  : "border-line bg-card/90 hover:border-brand/40 hover:bg-secondary/40"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition ${
                  item.completed ? "bg-brand text-white" : "border border-line bg-secondary text-muted-foreground"
                }`}>
                  {item.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{item.note}</p>
                </div>
              </div>

              <Link
                href={item.href}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary text-brand hover:bg-brand-soft"
                title={`Buka ${item.label}`}
              >
                <Icon className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function VisualProgressWidget() {
  const { overview } = useProgressData();
  const steps = overview?.daily.steps;
  const water = overview?.daily.water;
  const activeMinutes = overview?.daily.activeMinutes;
  return (
    <section className="card card-pad space-y-4 border-line/60 bg-gradient-to-br from-card via-card to-secondary/30">
      <div className="flex items-center justify-between border-b border-line/40 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Progres Kebiasaan</span>
          <h3 className="font-display text-base font-bold text-foreground">Visual Ring Harian</h3>
        </div>
        <span className="pill bg-secondary text-muted-foreground font-semibold text-[10px]">
          Hari Ini
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Ring 1: Steps */}
        <div className="flex flex-col items-center text-center p-3 rounded-2xl border border-line bg-card/65 shadow-sm hover:scale-[1.02] transition">
          <ProgressRing progress={steps?.percent ?? 0} size={64} strokeWidth={6} color="var(--brand)">
            <Footprints className="h-5 w-5 text-brand" />
          </ProgressRing>
          <p className="stat-num mt-2 text-sm font-extrabold text-foreground">{Math.round(steps?.value ?? 0).toLocaleString("id-ID")}</p>
          <p className="text-[10px] text-muted-foreground font-semibold">Langkah</p>
          <p className="text-[9px] text-brand font-bold mt-0.5">{steps?.percent ?? 0}%</p>
        </div>

        {/* Ring 2: Water */}
        <div className="flex flex-col items-center text-center p-3 rounded-2xl border border-line bg-card/65 shadow-sm hover:scale-[1.02] transition">
          <ProgressRing progress={water?.percent ?? 0} size={64} strokeWidth={6} color="var(--sky)">
            <Droplets className="h-5 w-5 text-sky" />
          </ProgressRing>
          <p className="stat-num mt-2 text-sm font-extrabold text-foreground">{Math.round((water?.value ?? 0) / 250)} / {Math.max(1, Math.round((water?.target ?? 2000) / 250))}</p>
          <p className="text-[10px] text-muted-foreground font-semibold">Gelas Air</p>
          <p className="text-[9px] text-sky font-bold mt-0.5">{water?.percent ?? 0}%</p>
        </div>

        {/* Ring 3: Active Mins */}
        <div className="flex flex-col items-center text-center p-3 rounded-2xl border border-line bg-card/65 shadow-sm hover:scale-[1.02] transition">
          <ProgressRing progress={activeMinutes?.percent ?? 0} size={64} strokeWidth={6} color="var(--lime)">
            <Zap className="h-5 w-5 text-lime" />
          </ProgressRing>
          <p className="stat-num mt-2 text-sm font-extrabold text-foreground">{Math.round(activeMinutes?.value ?? 0)} mnt</p>
          <p className="text-[10px] text-muted-foreground font-semibold">Aktif</p>
          <p className="text-[9px] text-lime font-bold mt-0.5">{activeMinutes?.percent ?? 0}%</p>
        </div>
      </div>
    </section>
  );
}

export function DashboardStarter() {
  const session = useAuthSession();
  const baselineComplete = session?.onboardingCompleted === true || Boolean(session?.baseline);
  const quickActions = [
    { href: "/aktivitas", label: "Mulai aktivitas GPS", note: "Sumber XP terverifikasi", icon: Activity },
    { href: "/scan", label: "Catat makanan", note: "Informasi, tanpa XP", icon: ScanLine },
    { href: "/companion", label: `Tanya ${session?.companionName ?? "AI Companion"}`, note: "Satu saran yang relevan", icon: Sparkles },
    { href: "/komunitas", label: "Lihat komunitas", note: "Event dan peringkat", icon: UsersRound },
  ];

  return (
    <section className={`grid h-full w-full items-stretch gap-4 ${baselineComplete ? "grid-cols-1" : "lg:grid-cols-[1.3fr_0.7fr]"}`}>
      <div className="card card-pad flex h-full flex-col transition-all duration-300 hover:shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Aksi Cepat</p>
            <h2 className="mt-1 font-display text-lg font-bold">Apa yang ingin kamu lakukan?</h2>
          </div>
          <span className="pill bg-brand-soft text-[10px] font-bold text-brand">AKSI CEPAT</span>
        </div>
        <div className="mt-4 grid flex-1 auto-rows-fr gap-2 sm:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link 
                key={action.href} 
                href={action.href} 
                className="group flex h-full min-h-20 items-center gap-3 rounded-2xl border border-line p-3 transition hover:border-brand/35 hover:bg-brand-soft/20 hover:scale-[1.01]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-brand group-hover:bg-card">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-foreground">{action.label}</span>
                  <span className="block text-[10px] text-muted-foreground">{action.note}</span>
                </span>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
              </Link>
            );
          })}
        </div>
      </div>

      {!baselineComplete && <div className="card card-pad flex h-full flex-col bg-secondary/30">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-brand" />
          <h2 className="text-xs font-bold uppercase tracking-wider">Konteks Personal</h2>
        </div>
        <div className="flex flex-1 flex-col justify-center">
            <p className="mt-4 text-sm font-bold text-foreground">Baseline belum lengkap</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Lengkapi data dasar di profil untuk estimasi presisi.</p>
            <Link href="/pengaturan" className="btn btn-outline btn-xs mt-4">Lengkapi profil</Link>
        </div>
      </div>}
    </section>
  );
}

export function HealthyHabitSummary() {
  const { overview } = useProgressData();
  const metrics = [
    { icon: CalendarCheck2, value: `${overview?.profile.healthyDaysThisWeek ?? 0} / 7`, label: "Hari sehat tercatat", note: "minggu ini" },
    { icon: TrendingUp, value: `${overview?.economy.streakDays ?? 0} hari`, label: "Streak aktivitas", note: "berdasarkan aktivitas tepercaya" },
    { icon: ShieldCheck, value: `${overview?.profile.verifiedActivityCount ?? 0} sesi`, label: "Aktivitas tepercaya", note: "total terverifikasi" },
  ];

  return (
    <section className="card card-pad border-brand/20 bg-gradient-to-br from-card to-brand-soft/35 transition-all duration-300 hover:shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Kualitas Kebiasaan</p>
          <h2 className="mt-1 font-display text-lg font-bold text-foreground">Progres Sehatmu Minggu Ini</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground hidden sm:block">Fokus utama adalah konsistensi gerak; total XP hanya pemanis tambahan.</p>
        </div>
        <Link href="/journey" className="btn btn-outline btn-xs font-bold">
          Buka Perjalanan <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-4 flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible sm:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="min-w-[140px] flex-1 shrink-0 snap-center rounded-2xl border border-line bg-card p-4 hover:scale-[1.01] transition">
              <Icon className="h-5 w-5 text-brand" />
              <p className="stat-num mt-3 text-2xl font-extrabold text-foreground">{metric.value}</p>
              <p className="mt-1 text-xs font-bold text-foreground">{metric.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground truncate">{metric.note}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
