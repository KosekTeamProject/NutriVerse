"use client";

import Link from "next/link";
import { Sparkles, Target, ChevronRight, CheckCircle2, Circle, CalendarCheck2, TrendingUp, ShieldCheck } from "lucide-react";
import { dailyPicks, currentProgress } from "@/lib/challenges";

/**
 * Motivasi ditampilkan sebagai widget. Pada Fase 5, teks ini berasal dari Gemini
 * (business logic merakit konteks pengguna -> Gemini -> diproses -> ditampilkan).
 */
const MOTIVASI = "Ritmemu minggu ini konsisten. Satu aktivitas kecil hari ini cukup untuk menjaga streak-mu tetap hidup.";

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
