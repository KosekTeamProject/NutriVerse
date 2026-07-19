import Link from "next/link";
import {
  HeartPulse, Zap, TrendingUp, Flame, Play, Target,
  Footprints, Bike, Award, ChevronRight, MapPin,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { RankCrest } from "@/components/brand/RankCrest";
import { DashboardNotices } from "@/components/app/DashboardNotices";
import { DashboardWidgets } from "@/components/app/DashboardWidgets";

const WEEK = [
  { d: "Sen", v: 45 }, { d: "Sel", v: 70 }, { d: "Rab", v: 55 },
  { d: "Kam", v: 85 }, { d: "Jum", v: 40 }, { d: "Sab", v: 95 }, { d: "Min", v: 68 },
];

const HEALTH = [
  { label: "Nutrisi", pct: 82, color: "var(--brand)" },
  { label: "Aktivitas", pct: 90, color: "var(--lime)" },
  { label: "Tidur", pct: 74, color: "var(--sky)" },
  { label: "Hidrasi", pct: 88, color: "var(--amber)" },
];

const CHALLENGES = [
  { icon: Footprints, title: "Lari 5 km minggu ini", tag: "Medium", now: 3.2, goal: 5, unit: "km", accent: "brand" },
  { icon: Bike, title: "Bersepeda 20 km", tag: "High", now: 12, goal: 20, unit: "km", accent: "sky" },
  { icon: Target, title: "Aktif 5 hari berturut", tag: "Low", now: 4, goal: 5, unit: "hari", accent: "amber" },
];

const LEADERBOARD = [
  { rank: 1, name: "Dinda P.", xp: "18.920", you: false },
  { rank: 2, name: "Yoga A.", xp: "16.540", you: false },
  { rank: 3, name: "Fatan M.", xp: "15.210", you: false },
  { rank: 4, name: "Rafi A.", xp: "12.450", you: true },
  { rank: 5, name: "Ilham R.", xp: "11.870", you: false },
];

const tagColor: Record<string, string> = {
  Low: "bg-brand-soft text-brand",
  Medium: "bg-amber/15 text-amber",
  High: "bg-sky/10 text-sky",
};

const iconBox: Record<string, string> = {
  brand: "bg-brand-soft text-brand",
  sky: "bg-sky/10 text-sky",
  amber: "bg-amber/15 text-amber",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Selamat datang kembali, Rafi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Catat aktivitasmu hari ini untuk menjaga streak dan naik tier.</p>
        </div>
        <Link href="/aktivitas" className="btn btn-primary"><Play className="h-[18px] w-[18px]" /> Mulai aktivitas</Link>
      </div>

      <DashboardNotices />
      <DashboardWidgets />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={HeartPulse} label="Health Score" value="86" hint="+4 dari kemarin" accent="brand" />
        <StatCard icon={Zap} label="Total XP" value="12.450" hint="Musim ini" accent="amber" />
        <StatCard icon={TrendingUp} label="Peringkat" value="#142" hint="Naik 8 posisi" accent="sky" />
        <StatCard icon={Flame} label="Streak" value="12 hari" hint="Rekor: 21 hari" accent="lime" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card card-pad">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Health Score hari ini</h2>
              <span className="chip">Baik</span>
            </div>
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
              <ProgressRing value={86} label="dari 100" size={140} gradientId="health" />
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                {HEALTH.map((h) => (
                  <div key={h.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">{h.label}</span>
                      <span className="stat-num text-muted-foreground">{h.pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full" style={{ width: `${h.pct}%`, background: h.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">XP dari aktivitas</h2>
              <span className="stat-num text-sm text-brand">+1.240 minggu ini</span>
            </div>
            <div className="mt-6 flex h-40 items-end gap-3">
              {WEEK.map((d) => (
                <div key={d.d} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div className="w-full rounded-lg bg-gradient-to-t from-brand to-brand-bright" style={{ height: `${d.v}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{d.d}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Challenge aktif</h2>
              <Link href="/challenge" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                Lihat semua <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {CHALLENGES.map((c) => {
                const Icon = c.icon;
                const pct = Math.round((c.now / c.goal) * 100);
                return (
                  <div key={c.title} className="flex items-center gap-4 rounded-2xl border border-line p-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconBox[c.accent]}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{c.title}</p>
                        <span className={`pill ${tagColor[c.tag]}`}>{c.tag}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <p className="stat-num shrink-0 text-sm text-muted-foreground">{c.now}/{c.goal} {c.unit}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card card-pad text-center">
            <h2 className="font-display text-lg font-bold">Tier kamu</h2>
            <div className="mt-4 flex flex-col items-center">
              <RankCrest id="dash-radiant" from="#7dd3fc" to="#0ea5e9" size={72} />
              <p className="mt-3 font-display text-xl font-extrabold">Radiant</p>
              <p className="text-xs text-muted-foreground">Divisi II</p>
            </div>
            <div className="mt-5 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">10.000 XP</span>
                <span className="text-muted-foreground">16.000 (Peak)</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-gradient-to-r from-sky to-brand" style={{ width: "68%" }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">1.550 XP lagi menuju <span className="font-semibold text-foreground">Peak</span></p>
            </div>
          </div>

          <div className="card card-pad">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Leaderboard kampus</h2>
              <Award className="h-5 w-5 text-amber" />
            </div>
            <div className="mt-4 space-y-1">
              {LEADERBOARD.map((u) => (
                <div key={u.rank} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${u.you ? "bg-brand-soft" : ""}`}>
                  <span className={`stat-num w-6 text-center text-sm ${u.rank <= 3 ? "text-brand" : "text-muted-foreground"}`}>{u.rank}</span>
                  <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white ${u.you ? "bg-gradient-to-br from-brand to-lime" : "bg-muted-foreground/40"}`}>{u.name.charAt(0)}</div>
                  <p className={`flex-1 truncate text-sm ${u.you ? "font-bold text-brand" : "font-medium"}`}>{u.name}{u.you ? " (kamu)" : ""}</p>
                  <p className="stat-num text-sm text-muted-foreground">{u.xp}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad bg-gradient-to-br from-brand to-lime text-white">
            <MapPin className="h-6 w-6" />
            <p className="mt-3 font-display text-lg font-bold">Belum bergerak hari ini?</p>
            <p className="mt-1 text-sm text-white/90">Mulai lari, jalan, atau bersepeda, biarkan GPS menghitung XP-mu.</p>
            <Link href="/aktivitas" className="btn mt-4 bg-white text-brand hover:bg-white/90">Mulai sekarang</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
