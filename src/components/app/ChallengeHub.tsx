"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Droplets, Footprints, Bike, Moon, Salad, Flame, Target, Trophy,
  Zap, Heart, Check, CheckCircle2, Sparkles, Activity, Dumbbell, Info, Plus,
} from "lucide-react";
import {
  CATEGORY_META, TIER_STYLE, WEEKLY, MONTHLY, dailyPicks, currentProgress,
  type Challenge, type ChallengePeriod,
} from "@/lib/challenges";

const ICONS: Record<string, typeof Droplets> = {
  droplet: Droplets, run: Footprints, walk: Footprints, bike: Bike, moon: Moon,
  salad: Salad, flame: Flame, target: Target, trophy: Trophy,
  activity: Activity, dumbbell: Dumbbell, heart: Heart,
};

type Filter = "semua" | ChallengePeriod;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "harian", label: "Harian" },
  { key: "mingguan", label: "Mingguan" },
  { key: "bulanan", label: "Bulanan" },
];

function CategoryChip({ category }: { category: Challenge["category"] }) {
  const meta = CATEGORY_META[category];
  const Icon = ICONS[meta.icon] ?? Activity;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {meta.label}
    </span>
  );
}

function ChallengeCard({ c, now, onMark }: { c: Challenge; now: number; onMark: (id: string) => void }) {
  const Icon = ICONS[c.icon] ?? Target;
  const pct = Math.min(100, Math.round((now / c.goal) * 100));
  const done = now >= c.goal;
  const auto = c.source === "gps";

  const trustLabel = auto ? "Terverifikasi" : "Catatan Mandiri";
  const sourceLabel = auto ? "Progres Otomatis" : "Catatan Mandiri";

  return (
    <div className="card card-pad card-hover flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${TIER_STYLE[c.tier]}`}>
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/challenge/${c.id}`} className="hover:text-brand transition flex-1 min-w-0">
                <h3 className="truncate font-display text-base font-bold">{c.title}</h3>
              </Link>
              <span className={`pill text-[10px] uppercase font-bold ${TIER_STYLE[c.tier]}`}>{c.tier}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-normal">{c.desc}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <CategoryChip category={c.category} />
              <span className="pill bg-secondary text-muted-foreground text-[9px] font-bold uppercase">{trustLabel}</span>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="capitalize">{c.period}</span>
            <span>{now % 1 === 0 ? now : now.toFixed(1)} / {c.goal} {c.unit} ({pct}%)</span>
          </div>
          <div className="chart-progress mt-1.5 h-2 overflow-hidden rounded-full">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${done ? "bg-brand" : "bg-gradient-to-r from-brand to-lime"}`} 
              style={{ width: `${pct}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-line/40 pt-4 space-y-3">
        {/* Source info notice */}
        <p className="text-[10px] text-muted-foreground italic leading-normal">
          {auto 
            ? "Hanya aktivitas GPS tervalidasi yang sesuai dengan jenis tantangan ini yang menambah progres."
            : "Tantangan ini menggunakan konfirmasi pengguna sebagai data kebiasaan suportif."
          }
        </p>

        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Potential Reward Previews */}
          <div className="flex flex-wrap gap-2 text-[10px]">
            {c.xp > 0 && (
              <span className="pill bg-amber/10 text-amber font-bold flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" /> +{c.xp} Bonus XP
              </span>
            )}
            <span className="pill bg-brand-soft text-brand font-bold flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> +{c.hp} HP Potensial
            </span>
          </div>

          {done ? (
            <span className="pill bg-brand-soft text-brand font-bold flex items-center gap-1 text-[11px] self-end sm:self-center">
              <CheckCircle2 className="h-3.5 w-3.5" /> {auto ? "Tercapai otomatis" : "Selesai"}
            </span>
          ) : auto ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-semibold self-end sm:self-center">
              <Activity className="h-3.5 w-3.5 text-brand" /> {sourceLabel}
            </span>
          ) : (
            <button onClick={() => onMark(c.id)} className="btn btn-primary btn-xs font-bold self-end sm:self-center">
              <Check className="h-3.5 w-3.5" /> Tandai selesai
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChallengeHub() {
  const [filter, setFilter] = useState<Filter>("semua");
  const [manualDone, setManualDone] = useState<Record<string, boolean>>({});
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  const daily = useMemo(() => dailyPicks(), []);
  const required = useMemo(() => [...daily, ...WEEKLY, ...MONTHLY].filter((c) => !c.optional), [daily]);
  const optional = useMemo(() => [...WEEKLY, ...MONTHLY].filter((c) => c.optional), []);

  const list = filter === "semua" ? required : required.filter((c) => c.period === filter);
  const dailyDone = daily.filter((c) => currentProgress(c, manualDone) >= c.goal).length;

  const mark = (id: string) => setManualDone((p) => ({ ...p, [id]: true }));
  const follow = (id: string) => setFollowed((p) => ({ ...p, [id]: true }));

  return (
    <div className="space-y-6">
      {/* ringkasan misi harian */}
      <div className="card card-pad bg-gradient-to-br from-brand to-lime text-white shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20"><Sparkles className="h-6 w-6" /></span>
          <div className="flex-1">
            <p className="font-display text-lg font-bold">Misi harian hari ini</p>
            <p className="text-sm text-white/85">{dailyDone} dari {daily.length} misi selesai &middot; dipilih otomatis untukmu</p>
          </div>
        </div>
        <div className="chart-progress mt-4 h-2 overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${(dailyDone / daily.length) * 100}%` }} />
        </div>
      </div>

      {/* penjelasan XP vs HP */}
      <div className="flex items-start gap-2 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-sky" />
        <div>
          <p className="font-bold text-foreground mb-0.5">XP Aktivitas dan Bonus XP Challenge</p>
          <p>
            Kategori <span className="font-semibold text-foreground">Kardio &amp; Mobilitas</span> (lari/sepeda/jalan) terisi
            otomatis dari aktivitas GPS tervalidasi dan dapat memberi <span className="font-semibold text-amber">bonus XP challenge</span> di atas XP dasar aktivitas. Bonus hanya diberikan sekali setelah target lolos validasi. Kategori lain (Strength,
            Nutrisi, Pemulihan, Kebiasaan) ditandai manual dan hanya memberi <span className="font-semibold text-brand">HP</span>.
            Semua hadiah di bawah ini bersifat estimasi/preview dan tunduk pada aturan keamanan sistem.
          </p>
        </div>
      </div>

      {/* filter periode (track record) */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-line/20">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              filter === f.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* daftar challenge */}
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((c) => (
          <ChallengeCard key={c.id} c={c} now={currentProgress(c, manualDone)} onMark={mark} />
        ))}
      </div>

      {/* challenge opsional (autonomy / SDT) */}
      {optional.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-line/30">
          <div>
            <h2 className="font-display text-lg font-bold">Tantangan opsional</h2>
            <p className="text-sm text-muted-foreground">Ingin tantangan ekstra? Ikuti yang kamu mau - sepenuhnya pilihanmu.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {optional.map((c) => {
              if (followed[c.id]) {
                return <ChallengeCard key={c.id} c={c} now={currentProgress(c, manualDone)} onMark={mark} />;
              }
              const Icon = ICONS[c.icon] ?? Target;
              return (
                <div key={c.id} className="card card-pad flex flex-col items-stretch justify-between gap-4 card-hover sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${TIER_STYLE[c.tier]}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/challenge/${c.id}`} className="hover:text-brand transition block">
                        <h3 className="truncate font-display text-base font-bold">{c.title}</h3>
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{c.desc}</p>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        <CategoryChip category={c.category} />
                        <span className="pill bg-secondary text-muted-foreground text-[9px] font-bold uppercase">Opsional</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => follow(c.id)} className="btn btn-outline btn-xs font-bold shrink-0 w-full sm:w-auto">
                    <Plus className="h-3.5 w-3.5" /> Ikuti
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
