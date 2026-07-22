"use client";

import { ArrowLeft, AlertTriangle, Info } from "lucide-react";
import Link from "next/link";
import { currentWeeklyLetter } from "@/features/companion/data";
import { useCompanionName } from "@/hooks/useCompanionName";

export default function WeeklyLetterPage() {
  const { displayName } = useCompanionName();
  const startStr = currentWeeklyLetter.periodStart.split("T")[0];
  const endStr = currentWeeklyLetter.periodEnd.split("T")[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
      {/* Back button */}
      <div>
        <Link 
          href="/companion" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-brand transition"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Nora
        </Link>
      </div>

      {/* Page Header */}
      <div className="border-b border-line/40 pb-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="pill bg-brand-soft text-brand text-[10px] font-bold uppercase tracking-wider">
            Laporan Mingguan
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {startStr} &mdash; {endStr}
          </span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {currentWeeklyLetter.title}
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Refleksi tenang mengenai pola kesehatan yang terbentuk sepanjang minggu Anda.
        </p>
      </div>

      {/* Letter Body Card */}
      <div className="card card-pad bg-gradient-to-br from-card to-secondary/35 border-line/60 space-y-6">
        {/* Greetings */}
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            {currentWeeklyLetter.greeting}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {currentWeeklyLetter.opening}
          </p>
        </div>

        {/* Weekly Metrics Dashboard Summary Grid */}
        <div className="border-t border-b border-line/45 py-4 space-y-3">
          <h3 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Ringkasan Mingguan</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-card p-3 text-center">
              <p className="text-[9px] text-muted-foreground font-semibold">RENTANG PULSE</p>
              <p className="text-xs font-bold text-foreground mt-1">76.8 &rarr; 78.0</p>
            </div>
            <div className="rounded-xl border border-line bg-card p-3 text-center">
              <p className="text-[9px] text-muted-foreground font-semibold">POLA STREAK</p>
              <p className="text-xs font-bold text-brand mt-1">7 Hari</p>
            </div>
            <div className="rounded-xl border border-line bg-card p-3 text-center">
              <p className="text-[9px] text-muted-foreground font-semibold">CATATAN UTAMA</p>
              <p className="text-xs font-bold text-foreground mt-1">Jalan 1,4 km</p>
            </div>
            <div className="rounded-xl border border-line bg-card p-3 text-center">
              <p className="text-[9px] text-muted-foreground font-semibold">JURNAL HARI INI</p>
              <p className="text-xs font-bold text-brand mt-1">64%</p>
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="space-y-3">
          <h3 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Sorotan Mingguan</h3>
          <ul className="space-y-2">
            {currentWeeklyLetter.highlights.map((hl, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground leading-normal">
                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[9px] font-bold text-brand">
                  {idx + 1}
                </span>
                <span>{hl}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Area */}
        <div className="space-y-2">
          <h3 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Hal yang Dapat Ditingkatkan</h3>
          <div className="rounded-xl border border-line bg-card/50 p-3.5 text-xs text-muted-foreground leading-relaxed">
            {currentWeeklyLetter.growthArea}
          </div>
        </div>

        {/* Next Week's Focus */}
        <div className="space-y-2">
          <h3 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Fokus Minggu Depan</h3>
          <p className="text-xs text-foreground font-semibold bg-brand-soft/20 rounded-xl p-3 border border-brand/10 leading-relaxed">
            {currentWeeklyLetter.nextWeekFocus}
          </p>
        </div>

        {/* Closing */}
        <div className="space-y-2 pt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {currentWeeklyLetter.closing}
          </p>
          <p className="text-xs font-bold text-foreground mt-2">
            {displayName}, Pendamping NutriVerse
          </p>
        </div>
      </div>

      {/* Informational disclaimers */}
      <div className="space-y-3">
        <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-xs text-muted-foreground border border-line/30">
          <Info className="h-4.5 w-4.5 shrink-0 text-muted-foreground mt-0.5" />
          <p>
            Surat mingguan ini merangkum pola data kebiasaan dan tidak memberikan diagnosis atau saran pengobatan.
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-line p-4 text-[10px] text-muted-foreground/80 bg-card">
          <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <p>
            Konten pendamping pada MVP masih berupa simulasi terstruktur untuk memperagakan pengalaman yang direncanakan.
          </p>
        </div>
      </div>
    </div>
  );
}
