"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Pencil, 
  Zap, 
  Heart, 
  MapPin, 
  Activity, 
  Flame, 
  Target, 
  Compass, 
  Lock, 
  Eye, 
  Info,
  Utensils,
  Droplets,
  Moon
} from "lucide-react";
import { RankCrest } from "@/components/brand/RankCrest";
import { ProfileCollection } from "@/components/app/ProfileCollection";
import { tierBySlug } from "@/lib/tiers";

const STORIES_POOL = [
  "You've maintained healthy habits for 148 days. Every small step continues building your healthier future.",
  "Recovery focuses on today's light walking activity to restore energy for the upcoming challenge steps.",
  "Protein intake reached 70% target consistency. Hydration balance remains the clearest growth opportunity."
];

function RadialProgress({ 
  value, 
  target, 
  unit, 
  label, 
  color, 
  icon: Icon 
}: { 
  readonly value: number; 
  readonly target: number; 
  readonly unit: string; 
  readonly label: string; 
  readonly color: string; 
  readonly icon: typeof Utensils; 
}) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 400);
    return () => clearTimeout(t);
  }, []);

  const pct = Math.min(100, Math.round((value / target) * 100));
  const dashOffset = active ? c * (1 - pct / 100) : c;

  return (
    <div className="rounded-2xl border border-line bg-card p-4 flex items-center gap-4 hover:border-brand/35 transition hover:shadow-soft">
      <div className="relative grid place-items-center shrink-0">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke="var(--secondary)" strokeWidth="4.5" />
          <circle 
            cx="28" 
            cy="28" 
            r={r} 
            fill="none" 
            stroke={color} 
            strokeWidth="4.5" 
            strokeLinecap="round" 
            strokeDasharray={c} 
            className="transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ strokeDashoffset: dashOffset }} 
          />
        </svg>
        <Icon className="absolute h-4.5 w-4.5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-display text-sm font-extrabold text-foreground">{value} / {target} <span className="text-[10px] font-normal text-muted-foreground">{unit}</span></p>
        <p className="text-[10px] text-muted-foreground">{pct}% target</p>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  accent 
}: { 
  readonly icon: typeof Zap; 
  readonly label: string; 
  readonly value: string; 
  readonly accent: "amber" | "brand" | "sky" | "lime";
}) {
  const accentStyles = {
    amber: "text-amber bg-amber/10 border-amber/15",
    brand: "text-brand bg-brand-soft border-brand/20",
    sky: "text-sky bg-sky/10 border-sky/15",
    lime: "text-lime bg-lime/10 border-lime/15"
  }[accent];

  return (
    <div className="card card-pad border-line bg-card space-y-3 hover:border-brand/35 hover:-translate-y-0.5 transition hover:shadow-soft duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-xl ${accentStyles}`}>
          <Icon className="h-4.5 w-4.5 animate-[float_6s_ease-in-out_infinite]" />
        </span>
      </div>
      <p className="stat-num text-xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}

export default function ProfilPage() {
  const tier = tierBySlug("radiant");
  const [storyIndex, setStoryIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStoryIndex((prev) => (prev + 1) % STORIES_POOL.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up-premium">
      {/* profile header */}
      <div className="card overflow-hidden border-line relative">
        {/* Animated cover background */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-brand via-brand-bright to-lime opacity-90 overflow-hidden">
          <div className="absolute inset-0 grid-dots opacity-20" />
          <div className="absolute -left-10 top-0 h-24 w-24 rounded-full bg-white/20 blur-xl animate-pulse" />
        </div>

        <div className="card-pad relative mt-16 pt-0">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {/* Floating Avatar with rotating status ring */}
              <div className="relative group shrink-0">
                <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-tr from-brand to-lime opacity-75 blur-sm animate-pulse duration-3000" />
                <div className="relative grid h-24 w-24 place-items-center rounded-3xl border-4 border-card bg-gradient-to-br from-brand to-lime font-display text-3xl font-extrabold text-white shadow-soft transition duration-300 group-hover:scale-105">
                  FM
                </div>
              </div>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">Fathan Mubarak</h1>
                <p className="text-sm text-muted-foreground">@fathan.mubarak &middot; Traveler</p>
              </div>
            </div>
            <Link href="/pengaturan" className="btn btn-outline btn-sm font-bold"><Pencil className="h-4 w-4" /> Edit Preferences</Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-line px-3 py-2 bg-secondary/35">
              <RankCrest id="profil" from={tier.from} to={tier.to} size={28} />
              <div className="leading-tight">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Rank Division</p>
                <p className="font-display text-sm font-bold text-foreground">{tier.name} &middot; Divisi II</p>
              </div>
            </div>
            <span className="pill bg-amber/15 text-amber font-bold"><Zap className="h-3.5 w-3.5" /> 12.450 XP</span>
            <span className="pill bg-brand-soft text-brand font-bold"><Heart className="h-3.5 w-3.5 text-brand fill-brand" /> 3.280 HP</span>
            <span className="pill bg-secondary text-muted-foreground font-semibold text-xs">Day 148 on Journey</span>
          </div>

          {/* Dynamic Profile Story Card */}
          <div className="mt-5 rounded-2xl bg-secondary/45 border border-line/45 p-4 transition-all duration-500 ease-in-out">
            <p className="text-[9px] font-bold text-brand uppercase tracking-wider select-none">Traveler Progress Story</p>
            <p className="text-xs text-foreground font-medium mt-1 leading-relaxed">
              &ldquo;{STORIES_POOL[storyIndex]}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Zap} label="Progress XP" value="12.450" accent="amber" />
        <StatCard icon={MapPin} label="Jarak total" value="128 km" accent="brand" />
        <StatCard icon={Activity} label="Aktivitas" value="42" accent="sky" />
        <StatCard icon={Flame} label="Streak" value="7 hari" accent="lime" />
      </div>

      {/* Daily Targets - Radial Progress Rings */}
      <div className="card card-pad border-line bg-card space-y-4">
        <div className="flex items-center gap-2 border-b border-line/45 pb-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
            <Target className="h-5 w-5" />
          </span>
          <h3 className="font-display text-base font-bold text-foreground">Target Konsistensi Harian</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RadialProgress value={2050} target={2200} unit="kkal" label="Kalori" color="var(--brand)" icon={Utensils} />
          <RadialProgress value={56} target={80} unit="g" label="Protein" color="var(--brand-bright)" icon={Zap} />
          <RadialProgress value={1.1} target={2.0} unit="L" label="Air" color="var(--sky)" icon={Droplets} />
          <RadialProgress value={7.5} target={8.0} unit="jam" label="Tidur" color="var(--amber)" icon={Moon} />
        </div>
      </div>

      {/* Wellness Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Health Pulse Card */}
        <div className="card card-pad border-line bg-card space-y-4 hover:border-brand/35 transition duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-line/45">
            <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-brand" /> Health Pulse Snapshot
            </h3>
            <span className="pill bg-brand-soft text-brand font-bold text-xs">Flourishing</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pulse Wellness Score</span>
            <span className="stat-num text-2xl font-extrabold text-foreground">78 / 100</span>
          </div>
          <p className="text-xs text-muted-foreground leading-normal">
            Your wellness pulse is overall healthy. Activity and hydration patterns are showing improvement.
          </p>
        </div>

        {/* Active Challenge Card */}
        <div className="card card-pad border-line bg-card space-y-4 hover:border-brand/35 transition duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-line/45">
            <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-4 w-4 text-brand" /> Active Challenge
            </h3>
            <span className="pill bg-amber/10 text-amber border border-amber/15 text-[10px] font-bold">Medium</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground">Light Cardio Journey</p>
            <p className="text-xs text-muted-foreground">Progress: 7.2 / 10.0 km (72%)</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-brand" style={{ width: "72%" }} />
          </div>
        </div>
      </div>

      {/* Collection */}
      <ProfileCollection />

      {/* Privacy Summary Card */}
      <div className="card card-pad border-line bg-card space-y-4">
        <div className="flex items-center gap-2 border-b border-line/45 pb-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
            <Lock className="h-5 w-5" />
          </span>
          <h3 className="font-display text-base font-bold text-foreground">Privacy &amp; Sharing Profile</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20">
            <span className="text-muted-foreground font-semibold">Profile Visibility</span>
            <span className="pill bg-secondary text-muted-foreground font-bold">Circle-Only</span>
          </div>

          <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20">
            <span className="text-muted-foreground font-semibold">Pulse Score Share</span>
            <span className="pill bg-secondary text-muted-foreground font-bold">Circle-Only</span>
          </div>

          <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20">
            <span className="text-muted-foreground font-semibold">Activity Summary</span>
            <span className="pill bg-secondary text-muted-foreground font-bold">Circle-Only</span>
          </div>

          <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20">
            <span className="text-muted-foreground font-semibold">Challenge Progress</span>
            <span className="pill bg-secondary text-muted-foreground font-bold">Circle-Only</span>
          </div>

          <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20 col-span-2">
            <span className="text-muted-foreground font-semibold">Nutrition &amp; Recovery Logs</span>
            <span className="pill bg-brand-soft text-brand font-bold flex items-center gap-0.5">
              <Eye className="h-3.5 w-3.5" /> Strictly Private
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-[10px] text-muted-foreground pt-1">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
          <p>
            NutriVerse uses location telemetry only to verify GPS exercise distance automatically. Nutrition, hydration, and sleep logs are logged for consistency and are not exposed.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/pengaturan" className="btn btn-outline w-full py-2.5 text-center flex items-center justify-center gap-1.5 font-bold">
            <Compass className="h-4.5 w-4.5" /> Manage Privacy and Preferences
          </Link>
        </div>
      </div>
    </div>
  );
}
