"use client";

import Link from "next/link";
import { Sparkles, Target, ChevronRight, CheckCircle2, Circle, CalendarCheck2, TrendingUp, ShieldCheck, ScanLine, Activity, UsersRound, Database } from "lucide-react";
import { dailyPicks, currentProgress } from "@/lib/challenges";
import { useAuthSession } from "@/hooks/useAuthSession";

/**
 * Motivasi ditampilkan sebagai widget. Pada Fase 5, teks ini berasal dari Gemini
 * (business logic merakit konteks pengguna -> Gemini -> diproses -> ditampilkan).
 */
const MOTIVASI = "Ritmemu minggu ini konsisten. Satu aktivitas kecil hari ini cukup untuk menjaga streak-mu tetap hidup.";

export function DashboardStarter() {
  const session = useAuthSession();
  const quickActions = [
    { href: "/aktivitas", label: "Mulai aktivitas GPS", note: "Sumber XP terverifikasi", icon: Activity },
    { href: "/scan", label: "Catat makanan", note: "Informasi, tanpa XP", icon: ScanLine },
    { href: "/companion", label: `Tanya ${session?.companionName ?? "AI Companion"}`, note: "Satu saran yang relevan", icon: Sparkles },
    { href: "/komunitas", label: "Lihat komunitas", note: "Event dan peringkat", icon: UsersRound },
  ];
  return (
    <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="card card-pad">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Mulai dari sini</p><h2 className="mt-1 font-display text-lg font-bold">Apa yang ingin kamu lakukan?</h2></div><span className="pill bg-brand-soft text-[10px] font-bold text-brand">AKSI CEPAT</span></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{quickActions.map((action) => { const Icon = action.icon; return <Link key={action.href} href={action.href} className="group flex items-center gap-3 rounded-2xl border border-line p-3 transition hover:border-brand/35 hover:bg-brand-soft/20"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-brand group-hover:bg-card"><Icon className="h-5 w-5" /></span><span className="min-w-0"><span className="block text-xs font-bold text-foreground">{action.label}</span><span className="block text-[10px] text-muted-foreground">{action.note}</span></span><ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" /></Link>; })}</div>
      </div>
      <div className="card card-pad bg-secondary/30">
        <div className="flex items-center gap-2"><Database className="h-4 w-4 text-brand" /><h2 className="text-xs font-bold uppercase tracking-wider">Konteks personal</h2></div>
        {session?.baseline ? <><p className="mt-4 text-sm font-bold text-foreground">Baseline registrasi aktif</p><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl bg-card p-3"><p className="text-[9px] text-muted-foreground">BMI AWAL</p><p className="font-display text-xl font-extrabold">{session.baseline.bmi}</p></div><div className="rounded-xl bg-card p-3"><p className="text-[9px] text-muted-foreground">ESTIMASI ENERGI</p><p className="font-display text-xl font-extrabold">{session.baseline.estimatedDailyCalories}</p></div></div><p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Berasal dari data onboarding dan dapat diperbarui melalui profil.</p></> : <><p className="mt-4 text-sm font-bold text-foreground">Baseline belum lengkap</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Akun demo memakai rekomendasi umum sampai data dasar ditambahkan.</p><Link href="/pengaturan" className="btn btn-outline btn-xs mt-4">Lengkapi profil</Link></>}
      </div>
    </section>
  );
}

export function DashboardWidgets() {
  const daily = dailyPicks();
  const done = daily.filter((c) => currentProgress(c, {}) >= c.goal).length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Daily Goals */}
      <div className="card card-pad">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand"><Target className="h-5 w-5" /></span>
            <h2 className="font-display text-base font-bold">Daily Goals</h2>
          </div>
          <Link href="/challenge" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">Semua <ChevronRight className="h-4 w-4" /></Link>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{done} dari {daily.length} misi hari ini selesai</p>
        <div className="mt-3 space-y-2">
          {daily.map((c) => {
            const complete = currentProgress(c, {}) >= c.goal;
            return (
              <div key={c.id} className="flex items-center gap-2.5">
                {complete ? <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <span className={`text-sm ${complete ? "text-muted-foreground line-through" : "font-medium"}`}>{c.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivasi */}
      <div className="card card-pad bg-gradient-to-br from-sky/10 to-brand-soft">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white"><Sparkles className="h-5 w-5" /></span>
          <h2 className="font-display text-base font-bold">Motivasi hari ini</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground">{MOTIVASI}</p>
        <p className="mt-3 text-xs text-muted-foreground">Pesan dari AI Health Coach</p>
      </div>
    </div>
  );
}

export function HealthyHabitSummary() {
  const metrics = [
    { icon: CalendarCheck2, value: "4 / 7", label: "Hari aktif tervalidasi", note: "minggu ini" },
    { icon: TrendingUp, value: "+2 hari", label: "Peningkatan konsistensi", note: "dibanding baseline" },
    { icon: ShieldCheck, value: "3 sesi", label: "Aktivitas tepercaya", note: "tanpa sinyal risiko" },
  ];

  return (
    <section className="card card-pad border-brand/20 bg-gradient-to-br from-card to-brand-soft/35">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Kualitas kebiasaan</p>
          <h2 className="mt-1 font-display text-lg font-bold text-foreground">Progres sehatmu minggu ini</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Fokus utama adalah hari aktif dan konsistensi; total XP hanya konteks tambahan.</p>
        </div>
        <Link href="/journey" className="btn btn-outline btn-xs">Buka Perjalanan &amp; Jurnal <ChevronRight className="h-4 w-4" /></Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-2xl border border-line bg-card p-4">
              <Icon className="h-5 w-5 text-brand" />
              <p className="stat-num mt-3 text-2xl font-extrabold text-foreground">{metric.value}</p>
              <p className="mt-1 text-xs font-bold text-foreground">{metric.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{metric.note}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">Data dashboard masih simulasi sampai sinkronisasi database dan verifikasi server tersedia.</p>
    </section>
  );
}
