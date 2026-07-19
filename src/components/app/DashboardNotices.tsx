"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Target, Scale, X, Bell, ChevronRight, Clock, CheckCircle2, Trophy, Sparkles,
} from "lucide-react";

type Notice = {
  id: string;
  icon: typeof Target;
  tone: "brand" | "amber" | "sky" | "lime";
  title: string;
  text: string;
  href: string;
  cta: string;
};

/** Tujuh pemicu notifikasi (Revisi 6). Dibatasi agar tidak berlebihan (anti-fatigue). */
const NOTICES: Notice[] = [
  { id: "move", icon: Clock, tone: "amber", title: "Sudah waktunya bergerak", text: "Kamu belum aktif sejak pagi. Sesi singkat pun berarti.", href: "/aktivitas", cta: "Mulai" },
  { id: "goals", icon: Target, tone: "brand", title: "Goals harianmu siap", text: "3 misi dipilih otomatis untukmu hari ini.", href: "/challenge", cta: "Lihat misi" },
  { id: "almost", icon: Trophy, tone: "lime", title: "Target hampir tercapai", text: "Tinggal 1,8 km lagi untuk menyelesaikan lari mingguan.", href: "/challenge", cta: "Lihat" },
  { id: "done", icon: CheckCircle2, tone: "brand", title: "Challenge selesai", text: "Challenge 'Gowes 8 km' tercapai otomatis. +360 XP.", href: "/challenge", cta: "Detail" },
  { id: "weekly", icon: Trophy, tone: "sky", title: "Mingguan selesai", text: "Kamu menuntaskan misi mingguan Aktif 5 hari.", href: "/challenge", cta: "Lihat" },
  { id: "monthly", icon: Scale, tone: "sky", title: "Reminder bulanan", text: "Perbarui berat badanmu bulan ini agar target tetap akurat.", href: "/pengaturan", cta: "Perbarui" },
  { id: "ai", icon: Sparkles, tone: "brand", title: "Motivasi hari ini", text: "Konsistensimu minggu ini di atas rata-rata. Pertahankan ritmenya.", href: "/dashboard", cta: "" },
];

const toneBox: Record<Notice["tone"], string> = {
  brand: "bg-brand-soft text-brand",
  amber: "bg-amber/15 text-amber",
  sky: "bg-sky/10 text-sky",
  lime: "bg-lime/15 text-lime",
};

const MAX_VISIBLE = 4; // batas anti-fatigue

export function DashboardNotices() {
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const visible = NOTICES.filter((n) => !dismissed[n.id]).slice(0, MAX_VISIBLE);
  if (visible.length === 0) return null;

  return (
    <div className="card card-pad">
      <div className="flex items-center gap-2">
        <Bell className="h-[18px] w-[18px] text-brand" />
        <h2 className="font-display text-base font-bold">Pemberitahuan</h2>
        <span className="pill bg-brand-soft text-brand">{visible.length}</span>
      </div>
      <div className="mt-4 space-y-2">
        {visible.map((n) => {
          const Icon = n.icon;
          return (
            <div key={n.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneBox[n.tone]}`}><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.text}</p>
              </div>
              {n.cta && (
                <Link href={n.href} className="hidden items-center gap-1 text-sm font-medium text-brand hover:underline sm:flex">
                  {n.cta} <ChevronRight className="h-4 w-4" />
                </Link>
              )}
              <button onClick={() => setDismissed((p) => ({ ...p, [n.id]: true }))} aria-label="Tutup" className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
