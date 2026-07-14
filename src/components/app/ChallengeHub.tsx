"use client";

import { useState } from "react";
import {
  Droplets, Footprints, Bike, Moon, Salad, Flame, Target, Trophy,
  Zap, Heart, Check, Sparkles,
} from "lucide-react";
import { CHALLENGES, TIER_STYLE, type Challenge, type ChallengePeriod } from "@/lib/challenges";

const ICONS: Record<string, typeof Droplets> = {
  droplet: Droplets, run: Footprints, bike: Bike, moon: Moon,
  salad: Salad, flame: Flame, target: Target, trophy: Trophy,
};

type Filter = "semua" | ChallengePeriod;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "harian", label: "Harian" },
  { key: "mingguan", label: "Mingguan" },
  { key: "bulanan", label: "Bulanan" },
];

function ChallengeCard({ c, claimed, onClaim }: { c: Challenge; claimed: boolean; onClaim: (id: string) => void }) {
  const Icon = ICONS[c.icon] ?? Target;
  const pct = Math.min(100, Math.round((c.now / c.goal) * 100));
  const done = c.now >= c.goal;
  return (
    <div className="card card-pad card-hover">
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${TIER_STYLE[c.tier]}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-base font-bold">{c.title}</h3>
            <span className={`pill ${TIER_STYLE[c.tier]}`}>{c.tier}</span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{c.desc}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground capitalize">{c.period}</span>
          <span className="stat-num text-muted-foreground">{c.now}/{c.goal} {c.unit}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
          <div className={`h-full rounded-full ${done ? "bg-brand" : "bg-gradient-to-r from-brand to-brand-bright"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <span className="pill bg-amber/15 text-amber"><Zap className="h-3.5 w-3.5" /> +{c.xp}</span>
          <span className="pill bg-brand-soft text-brand"><Heart className="h-3.5 w-3.5" /> +{c.hp}</span>
        </div>
        {claimed ? (
          <span className="pill bg-brand-soft text-brand"><Check className="h-3.5 w-3.5" /> Diklaim</span>
        ) : done ? (
          <button onClick={() => onClaim(c.id)} className="btn btn-primary btn-sm">Klaim reward</button>
        ) : (
          <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
        )}
      </div>
    </div>
  );
}

export function ChallengeHub() {
  const [filter, setFilter] = useState<Filter>("semua");
  const [claimed, setClaimed] = useState<Set<string>>(new Set());

  const list = filter === "semua" ? CHALLENGES : CHALLENGES.filter((c) => c.period === filter);
  const daily = CHALLENGES.filter((c) => c.period === "harian");
  const dailyDone = daily.filter((c) => c.now >= c.goal).length;

  function claim(id: string) {
    setClaimed((prev) => new Set(prev).add(id));
  }

  return (
    <div className="space-y-6">
      {/* daily summary */}
      <div className="card card-pad bg-gradient-to-br from-brand to-lime text-white">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20"><Sparkles className="h-6 w-6" /></span>
          <div className="flex-1">
            <p className="font-display text-lg font-bold">Misi harian dari AI</p>
            <p className="text-sm text-white/85">{dailyDone} dari {daily.length} misi selesai hari ini</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white" style={{ width: `${(dailyDone / daily.length) * 100}%` }} />
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((c) => (
          <ChallengeCard key={c.id} c={c} claimed={claimed.has(c.id)} onClaim={claim} />
        ))}
      </div>
    </div>
  );
}
