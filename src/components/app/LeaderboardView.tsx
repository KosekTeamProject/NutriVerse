"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Minus, Crown, Flame, ShieldCheck, CalendarDays, MapPinOff } from "lucide-react";
import { RankCrest } from "@/components/brand/RankCrest";
import { tierBySlug, tierForXp, nextTier } from "@/lib/tiers";

type Entry = { 
  rank: number; 
  name: string; 
  xp: number; 
  tier: string; 
  delta: number; 
  you?: boolean; 
  consistencyDays: number;
  healthyDays: number;
};
type Scope = "liga" | "teman" | "lokal";

const DATA: Record<Scope, Entry[]> = {
  liga: [
    { rank: 1, name: "Dinda Puspita", xp: 14280, tier: "radiant", delta: 1, consistencyDays: 8, healthyDays: 6 },
    { rank: 2, name: "Nadia Pramesti", xp: 13740, tier: "radiant", delta: 0, consistencyDays: 6, healthyDays: 5 },
    { rank: 3, name: "Fathan Mubarak", xp: 12450, tier: "radiant", delta: 2, you: true, consistencyDays: 7, healthyDays: 4 },
    { rank: 4, name: "Ilham Razaq", xp: 11870, tier: "radiant", delta: -1, consistencyDays: 5, healthyDays: 4 },
    { rank: 5, name: "Putri Maharani", xp: 10920, tier: "radiant", delta: 1, consistencyDays: 4, healthyDays: 3 },
    { rank: 6, name: "Rafi Adiputra", xp: 10100, tier: "radiant", delta: -1, consistencyDays: 3, healthyDays: 3 },
    { rank: 7, name: "Aulia Rahma", xp: 9640, tier: "vital", delta: 0, consistencyDays: 4, healthyDays: 3 },
  ],
  lokal: [
    { rank: 1, name: "Dinda Puspita", xp: 28500, tier: "elite", delta: 0, consistencyDays: 8, healthyDays: 7 },
    { rank: 2, name: "Yoga Adyatma", xp: 21900, tier: "peak", delta: 1, consistencyDays: 12, healthyDays: 10 },
    { rank: 3, name: "Fathan Mubarak", xp: 12450, tier: "radiant", delta: 2, you: true, consistencyDays: 7, healthyDays: 4 },
    { rank: 4, name: "Ilham Razaq", xp: 11870, tier: "radiant", delta: -1, consistencyDays: 5, healthyDays: 4 },
    { rank: 5, name: "Rafi Adiputra", xp: 8100, tier: "vital", delta: 0, consistencyDays: 2, healthyDays: 1 },
    { rank: 6, name: "Aulia Rahma", xp: 6400, tier: "vital", delta: 1, consistencyDays: 4, healthyDays: 3 },
    { rank: 7, name: "Bagus Prasetyo", xp: 4200, tier: "bloom", delta: -2, consistencyDays: 1, healthyDays: 1 },
  ],
  teman: [
    { rank: 1, name: "Ilham Razaq", xp: 11870, tier: "radiant", delta: 0, consistencyDays: 5, healthyDays: 4 },
    { rank: 2, name: "Fathan Mubarak", xp: 12450, tier: "radiant", delta: 1, you: true, consistencyDays: 7, healthyDays: 4 },
    { rank: 3, name: "Rafi Adiputra", xp: 8100, tier: "vital", delta: -1, consistencyDays: 2, healthyDays: 1 },
    { rank: 4, name: "Aulia Rahma", xp: 6400, tier: "vital", delta: 0, consistencyDays: 4, healthyDays: 3 },
  ],
};

const SCOPES: { key: Scope; label: string }[] = [
  { key: "liga", label: "Liga" },
  { key: "teman", label: "Teman" },
  { key: "lokal", label: "Lokal" },
];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Delta({ v }: { readonly v: number }) {
  if (v > 0) return <span className="inline-flex items-center text-xs font-bold text-brand"><ChevronUp className="h-3.5 w-3.5" />{v}</span>;
  if (v < 0) return <span className="inline-flex items-center text-xs font-bold text-destructive"><ChevronDown className="h-3.5 w-3.5" />{Math.abs(v)}</span>;
  return <span className="inline-flex items-center text-xs text-muted-foreground"><Minus className="h-3.5 w-3.5" /></span>;
}

function Podium({ e, place }: { readonly e: Entry; readonly place: 1 | 2 | 3 }) {
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
      <div className={`mt-2 grid ${place === 1 ? "h-12 w-12" : "h-10 w-10"} place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-sm font-bold text-white shadow-sm`}>
        {initials(e.name)}
      </div>
      <p className="mt-1.5 max-w-[6rem] truncate text-center text-xs font-bold text-foreground">{e.name.split(" ")[0]}</p>
      <p className="stat-num text-xs text-muted-foreground flex items-center gap-0.5"><Flame className="h-3 w-3 text-brand" /> {e.consistencyDays}d</p>
      <div className={`mt-2 w-16 rounded-t-xl bg-gradient-to-b ${medal} ${h} flex items-start justify-center pt-1 shadow-soft`}>
        <span className="font-display text-lg font-extrabold text-white">{place}</span>
      </div>
    </div>
  );
}

export function LeaderboardView() {
  const [scope, setScope] = useState<Scope>("liga");
  const list = DATA[scope];
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);
  const me = list.find((e) => e.you);
  const meTier = me ? tierForXp(me.xp) : null;
  const nxt = me ? nextTier(me.xp) : null;

  return (
    <div className="space-y-6">
      <div className="card card-pad border-brand/20 bg-gradient-to-br from-brand-soft to-sky/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <p className="font-display text-base font-bold text-foreground">Kompetisi yang setara</p>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Kamu dipasangkan dengan traveler pada rentang progres serupa. Aktivitas tervalidasi dan konsistensi mingguan membentuk posisi musim ini.
            </p>
          </div>
          <span className="pill border border-brand/20 bg-card text-[10px] font-bold text-brand">LIGA RADIANT</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-muted-foreground">
          <span className="pill bg-card"><CalendarDays className="h-3.5 w-3.5" /> Musim 03 · 5 hari tersisa</span>
          <span className="pill bg-card"><ShieldCheck className="h-3.5 w-3.5" /> Hanya aktivitas tervalidasi</span>
          <span className="pill bg-card"><MapPinOff className="h-3.5 w-3.5" /> Tanpa rute presisi</span>
        </div>
      </div>

      {/* scope tabs */}
      <div className="flex w-full overflow-x-auto rounded-full bg-secondary p-1 sm:inline-flex sm:w-auto">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            onClick={() => setScope(s.key)}
            className={`min-w-[6rem] flex-1 rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-wider transition sm:flex-none ${
              scope === s.key ? "bg-card text-brand shadow-soft" : "text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* my rank */}
      {me && meTier && (
        <div className="card card-pad border-line/65">
          <div className="flex items-center gap-4">
            <RankCrest id="me" from={meTier.from} to={meTier.to} size={48} />
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">Peringkatmu ({SCOPES.find((s) => s.key === scope)?.label})</p>
              <p className="font-display text-2xl font-extrabold text-foreground mt-0.5">#{me.rank} <span className="text-sm font-bold text-muted-foreground">· {meTier.name}</span></p>
            </div>
            <div className="text-right">
              <p className="stat-num text-lg font-extrabold text-brand flex items-center justify-end gap-1"><Flame className="h-4.5 w-4.5" /> {me.consistencyDays} Hari</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Consistency Streak</p>
            </div>
          </div>
          {nxt && (
            <p className="mt-3 text-xs text-muted-foreground leading-normal border-t border-line/45 pt-2">
              {(nxt.minXp - me.xp).toLocaleString("id-ID")} Progress XP lagi menuju <span className="font-semibold text-foreground">{nxt.name}</span>
            </p>
          )}
        </div>
      )}

      {/* podium */}
      <div className="card card-pad bg-card border-line">
        <div className="flex items-end justify-center gap-4 sm:gap-8 pt-6">
          {top3[1] && <Podium e={top3[1]} place={2} />}
          {top3[0] && <Podium e={top3[0]} place={1} />}
          {top3[2] && <Podium e={top3[2]} place={3} />}
        </div>
      </div>

      {/* rest of list */}
      <div className="card card-pad border-line">
        <div className="space-y-1">
          {rest.map((e) => {
            const t = tierBySlug(e.tier);
            return (
              <div key={e.rank} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${e.you ? "bg-brand-soft border border-brand/20 shadow-sm" : "hover:bg-secondary/40"}`}>
                <span className="stat-num w-6 text-center text-xs font-bold text-muted-foreground">{e.rank}</span>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-xs font-bold text-white shadow-sm">{initials(e.name)}</div>
                <RankCrest id={`row-${scope}-${e.rank}`} from={t.from} to={t.to} size={22} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-xs ${e.you ? "font-bold text-brand" : "font-semibold text-foreground"}`}>{e.name}{e.you ? " (kamu)" : ""}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.name}</p>
                </div>
                <Delta v={e.delta} />
                <div className="text-right">
                  <p className="stat-num w-20 text-right text-xs font-bold text-foreground flex items-center justify-end gap-1">
                    <Flame className="h-3.5 w-3.5 text-brand" /> {e.consistencyDays}d
                  </p>
                  <p className="text-[9px] text-muted-foreground">{e.xp.toLocaleString("id-ID")} XP</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fair and Supportive Ranking disclaimer */}
      <div className="card card-pad bg-secondary/35 border-line/65 space-y-3">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-4.5 w-4.5 text-brand" /> Peringkat yang adil dan suportif
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed leading-normal">
          Catatan mandiri tetap tersimpan sebagai riwayat pribadi, tetapi tidak memberi poin kompetitif. Peringkat bukan diagnosis kesehatan atau ukuran nilai diri. Data dan musim pada MVP ini masih simulasi; sinkronisasi serta segmentasi produksi memerlukan server.
        </p>
      </div>
    </div>
  );
}
