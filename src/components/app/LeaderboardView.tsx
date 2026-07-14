"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Minus, Crown } from "lucide-react";
import { RankCrest } from "@/components/brand/RankCrest";
import { tierBySlug, tierForXp, nextTier } from "@/lib/tiers";

type Entry = { rank: number; name: string; xp: number; tier: string; delta: number; you?: boolean };
type Scope = "global" | "kampus" | "teman";

const DATA: Record<Scope, Entry[]> = {
  global: [
    { rank: 1, name: "Bima Saputra", xp: 52400, tier: "legend", delta: 0 },
    { rank: 2, name: "Nadia Pramesti", xp: 41200, tier: "apex", delta: 1 },
    { rank: 3, name: "Reza Firmansyah", xp: 33800, tier: "elite", delta: -1 },
    { rank: 4, name: "Dinda Puspita", xp: 28500, tier: "elite", delta: 2 },
    { rank: 5, name: "Yoga Adyatma", xp: 21900, tier: "peak", delta: 0 },
    { rank: 6, name: "Sarah Wijaya", xp: 18300, tier: "peak", delta: -2 },
    { rank: 7, name: "Rafi Adiputra", xp: 12450, tier: "radiant", delta: 3, you: true },
    { rank: 8, name: "Ilham Razaq", xp: 11870, tier: "radiant", delta: 1 },
    { rank: 9, name: "Putri Maharani", xp: 9200, tier: "vital", delta: -1 },
    { rank: 10, name: "Fatan Mubarak", xp: 8100, tier: "vital", delta: 0 },
  ],
  kampus: [
    { rank: 1, name: "Dinda Puspita", xp: 28500, tier: "elite", delta: 0 },
    { rank: 2, name: "Yoga Adyatma", xp: 21900, tier: "peak", delta: 1 },
    { rank: 3, name: "Rafi Adiputra", xp: 12450, tier: "radiant", delta: 2, you: true },
    { rank: 4, name: "Ilham Razaq", xp: 11870, tier: "radiant", delta: -1 },
    { rank: 5, name: "Fatan Mubarak", xp: 8100, tier: "vital", delta: 0 },
    { rank: 6, name: "Aulia Rahma", xp: 6400, tier: "vital", delta: 1 },
    { rank: 7, name: "Bagus Prasetyo", xp: 4200, tier: "bloom", delta: -2 },
  ],
  teman: [
    { rank: 1, name: "Ilham Razaq", xp: 11870, tier: "radiant", delta: 0 },
    { rank: 2, name: "Rafi Adiputra", xp: 12450, tier: "radiant", delta: 1, you: true },
    { rank: 3, name: "Fatan Mubarak", xp: 8100, tier: "vital", delta: -1 },
    { rank: 4, name: "Aulia Rahma", xp: 6400, tier: "vital", delta: 0 },
  ],
};

const SCOPES: { key: Scope; label: string }[] = [
  { key: "global", label: "Global" },
  { key: "kampus", label: "Kampus" },
  { key: "teman", label: "Teman" },
];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Delta({ v }: { v: number }) {
  if (v > 0) return <span className="inline-flex items-center text-xs font-semibold text-brand"><ChevronUp className="h-3.5 w-3.5" />{v}</span>;
  if (v < 0) return <span className="inline-flex items-center text-xs font-semibold text-destructive"><ChevronDown className="h-3.5 w-3.5" />{Math.abs(v)}</span>;
  return <span className="inline-flex items-center text-xs text-muted-foreground"><Minus className="h-3.5 w-3.5" /></span>;
}

function Podium({ e, place }: { e: Entry; place: 1 | 2 | 3 }) {
  const t = tierBySlug(e.tier);
  const h = place === 1 ? "h-28" : place === 2 ? "h-20" : "h-16";
  const size = place === 1 ? 60 : 48;
  const medal = place === 1 ? "from-amber to-chart-3" : place === 2 ? "from-muted-foreground/50 to-muted-foreground/30" : "from-chart-3/70 to-amber/60";
  return (
    <div className={`flex flex-col items-center ${place === 1 ? "-mt-4" : ""}`}>
      <div className="relative">
        {place === 1 && <Crown className="absolute -top-5 left-1/2 h-5 w-5 -translate-x-1/2 text-amber" />}
        <RankCrest id={`podium-${place}`} from={t.from} to={t.to} size={size} />
      </div>
      <div className={`mt-2 grid ${place === 1 ? "h-12 w-12" : "h-10 w-10"} place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-sm font-bold text-white`}>
        {initials(e.name)}
      </div>
      <p className="mt-1.5 max-w-[6rem] truncate text-center text-xs font-semibold">{e.name.split(" ")[0]}</p>
      <p className="stat-num text-xs text-muted-foreground">{e.xp.toLocaleString("id-ID")}</p>
      <div className={`mt-2 w-16 rounded-t-xl bg-gradient-to-b ${medal} ${h} flex items-start justify-center pt-1`}>
        <span className="font-display text-lg font-extrabold text-white">{place}</span>
      </div>
    </div>
  );
}

export function LeaderboardView() {
  const [scope, setScope] = useState<Scope>("global");
  const list = DATA[scope];
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);
  const me = list.find((e) => e.you);
  const meTier = me ? tierForXp(me.xp) : null;
  const nxt = me ? nextTier(me.xp) : null;

  return (
    <div className="space-y-6">
      {/* scope tabs */}
      <div className="inline-flex rounded-full bg-secondary p-1">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            onClick={() => setScope(s.key)}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${
              scope === s.key ? "bg-card text-brand shadow-sm" : "text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* my rank */}
      {me && meTier && (
        <div className="card card-pad">
          <div className="flex items-center gap-4">
            <RankCrest id="me" from={meTier.from} to={meTier.to} size={48} />
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">Peringkatmu ({SCOPES.find((s) => s.key === scope)?.label})</p>
              <p className="font-display text-2xl font-extrabold">#{me.rank} <span className="text-base font-bold text-muted-foreground">· {meTier.name}</span></p>
            </div>
            <div className="text-right">
              <p className="stat-num text-xl text-amber">{me.xp.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
          </div>
          {nxt && (
            <p className="mt-3 text-xs text-muted-foreground">
              {(nxt.minXp - me.xp).toLocaleString("id-ID")} XP lagi menuju <span className="font-semibold text-foreground">{nxt.name}</span>
            </p>
          )}
        </div>
      )}

      {/* podium */}
      <div className="card card-pad">
        <div className="flex items-end justify-center gap-4 sm:gap-8">
          {top3[1] && <Podium e={top3[1]} place={2} />}
          {top3[0] && <Podium e={top3[0]} place={1} />}
          {top3[2] && <Podium e={top3[2]} place={3} />}
        </div>
      </div>

      {/* rest of list */}
      <div className="card card-pad">
        <div className="space-y-1">
          {rest.map((e) => {
            const t = tierBySlug(e.tier);
            return (
              <div key={e.rank} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${e.you ? "bg-brand-soft" : ""}`}>
                <span className="stat-num w-6 text-center text-sm text-muted-foreground">{e.rank}</span>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-xs font-bold text-white">{initials(e.name)}</div>
                <RankCrest id={`row-${scope}-${e.rank}`} from={t.from} to={t.to} size={22} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${e.you ? "font-bold text-brand" : "font-medium"}`}>{e.name}{e.you ? " (kamu)" : ""}</p>
                  <p className="text-[11px] text-muted-foreground">{t.name}</p>
                </div>
                <Delta v={e.delta} />
                <p className="stat-num w-20 text-right text-sm text-muted-foreground">{e.xp.toLocaleString("id-ID")}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
