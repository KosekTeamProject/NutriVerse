"use client";

import Link from "next/link";
import { Sparkles, Target, ChevronRight, CheckCircle2, Circle } from "lucide-react";
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
