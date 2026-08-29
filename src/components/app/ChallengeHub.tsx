"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bike,
  Check,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Footprints,
  Heart,
  Info,
  Moon,
  Plus,
  Salad,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import {
  CATEGORY_META,
  TIER_STYLE,
  type Challenge,
  type ChallengeCategory,
  type ChallengePeriod,
  type ChallengeTier,
} from "@/lib/challenges";
import type { ProgressChallenge } from "@/features/progress/types";
import { notifyDataChanged } from "@/lib/data-sync";
import { useProgressData } from "@/providers/ProgressDataProvider";

const ICONS: Record<string, typeof Droplets> = {
  droplet: Droplets,
  run: Footprints,
  walk: Footprints,
  bike: Bike,
  moon: Moon,
  salad: Salad,
  target: Target,
  trophy: Trophy,
  activity: Activity,
  dumbbell: Dumbbell,
  heart: Heart,
};

type Filter = "semua" | ChallengePeriod;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "harian", label: "Harian" },
  { key: "mingguan", label: "Mingguan" },
  { key: "bulanan", label: "Bulanan" },
];

function challengePeriod(type: ProgressChallenge["type"]): ChallengePeriod {
  if (type === "DAILY") return "harian";
  if (type === "MONTHLY") return "bulanan";
  return "mingguan";
}

function challengeTier(challenge: ProgressChallenge): ChallengeTier {
  const reward = challenge.bonusXp + challenge.bonusHp;
  if (reward >= 900) return "High";
  if (reward >= 250) return "Medium";
  return "Low";
}

function categoryFor(value: string): ChallengeCategory {
  const category = value.toLowerCase();
  if (
    category === "cardio" ||
    category === "strength" ||
    category === "mobility" ||
    category === "nutrition" ||
    category === "recovery" ||
    category === "habit"
  ) {
    return category;
  }
  return "habit";
}

function iconFor(challenge: ProgressChallenge) {
  if (challenge.activityType === "RUN") return "run";
  if (challenge.activityType === "WALK") return "walk";
  if (challenge.activityType === "BIKE") return "bike";
  return CATEGORY_META[categoryFor(challenge.category)].icon;
}

function toDisplayChallenge(challenge: ProgressChallenge): Challenge {
  return {
    id: challenge.id,
    title: challenge.title,
    desc: challenge.description,
    period: challengePeriod(challenge.type),
    tier: challengeTier(challenge),
    category: categoryFor(challenge.category),
    source:
      challenge.trustLevel === "GPS_VERIFIED_ONLY" ? "gps" : "manual",
    metric:
      challenge.metric === "DURATION_SECONDS"
        ? "menit"
        : challenge.metric === "ACTIVE_DAY_COUNT"
          ? "hari_aktif"
        : challenge.metric === "VERIFIED_ACTIVITY_COUNT"
          ? "sesi"
          : "aktivitas_km",
    icon: iconFor(challenge),
    goal: challenge.targetValue,
    unit: challenge.unit,
    xp: challenge.bonusXp,
    hp: challenge.bonusHp,
  };
}

function CategoryChip({ category }: { category: Challenge["category"] }) {
  const meta = CATEGORY_META[category];
  const Icon = ICONS[meta.icon] ?? Activity;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {meta.label}
    </span>
  );
}

function ChallengeCard({
  challenge,
  busy,
  onAction,
}: {
  challenge: ProgressChallenge;
  busy: boolean;
  onAction: (challenge: ProgressChallenge) => void;
}) {
  const c = toDisplayChallenge(challenge);
  const Icon = ICONS[c.icon] ?? Target;
  const done = challenge.isCompleted;
  const auto = c.source === "gps";
  const canClaim =
    done &&
    !challenge.isRewardClaimed &&
    (challenge.bonusXp > 0 || challenge.bonusHp > 0);

  let action: React.ReactNode;
  if (!challenge.isJoined) {
    action = (
      <button
        type="button"
        disabled={busy}
        onClick={() => onAction(challenge)}
        className="btn btn-outline btn-xs font-bold"
      >
        <Plus className="h-3.5 w-3.5" /> Ikuti
      </button>
    );
  } else if (canClaim) {
    action = (
      <button
        type="button"
        disabled={busy}
        onClick={() => onAction(challenge)}
        className="btn btn-primary btn-xs font-bold"
      >
        <Trophy className="h-3.5 w-3.5" /> Klaim hadiah
      </button>
    );
  } else if (done) {
    action = (
      <span className="pill bg-brand-soft text-brand text-[11px] font-bold">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {challenge.isRewardClaimed ? "Hadiah diklaim" : "Selesai"}
      </span>
    );
  } else if (!auto) {
    action = (
      <button
        type="button"
        disabled={busy}
        onClick={() => onAction(challenge)}
        className="btn btn-primary btn-xs font-bold"
      >
        <Check className="h-3.5 w-3.5" /> Tandai selesai
      </button>
    );
  } else {
    action = (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
        <Activity className="h-3.5 w-3.5 text-brand" /> Progres otomatis
      </span>
    );
  }

  return (
    <article className="card card-pad card-hover flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${TIER_STYLE[c.tier]}`}
          >
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/challenge/${c.id}`}
                className="min-w-0 flex-1 transition hover:text-brand"
              >
                <h3 className="truncate font-display text-base font-bold">
                  {c.title}
                </h3>
              </Link>
              <span
                className={`pill text-[10px] font-bold uppercase ${TIER_STYLE[c.tier]}`}
              >
                {c.tier}
              </span>
            </div>
            <p className="mt-1 text-xs leading-normal text-muted-foreground">
              {c.desc}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <CategoryChip category={c.category} />
              <span className="pill bg-secondary text-[9px] font-bold uppercase text-muted-foreground">
                {auto ? "Terverifikasi GPS" : "Catatan mandiri"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="capitalize">{c.period}</span>
            <span>
              {challenge.currentValue} / {challenge.targetValue} {challenge.unit} (
              {challenge.progressPercent}%)
            </span>
          </div>
          <div className="chart-progress mt-1.5 h-2 overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                done ? "bg-brand" : "bg-gradient-to-r from-brand to-lime"
              }`}
              style={{ width: `${challenge.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 border-t border-line/40 pt-4">
        <p className="text-[10px] italic leading-normal text-muted-foreground">
          {auto
            ? "Hanya aktivitas GPS yang lolos validasi server yang menambah progres."
            : "Penyelesaian disimpan sebagai catatan mandiri dan tidak menjadi XP kompetitif."}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2 text-[10px]">
            {c.xp > 0 && (
              <span className="pill flex items-center gap-1 bg-amber/10 font-bold text-amber">
                <Zap className="h-3.5 w-3.5" /> +{c.xp} XP
              </span>
            )}
            {c.hp > 0 && (
              <span className="pill flex items-center gap-1 bg-brand-soft font-bold text-brand">
                <Heart className="h-3.5 w-3.5" /> +{c.hp} HP
              </span>
            )}
          </div>
          {action}
        </div>
      </div>
    </article>
  );
}

export function ChallengeHub() {
  const { overview, loading, refresh } = useProgressData();
  const [filter, setFilter] = useState<Filter>("semua");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const challenges = overview?.challenges ?? [];
  const list =
    filter === "semua"
      ? challenges
      : challenges.filter(
          (challenge) => challengePeriod(challenge.type) === filter,
        );
  const daily = challenges.filter((challenge) => challenge.type === "DAILY");
  const dailyDone = daily.filter((challenge) => challenge.isCompleted).length;

  async function actOnChallenge(challenge: ProgressChallenge) {
    const action = !challenge.isJoined
      ? "join"
      : challenge.isCompleted && !challenge.isRewardClaimed
        ? "claim"
        : "complete";
    setBusyId(challenge.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/challenges/${challenge.id}/${action}`,
        { method: "POST" },
      );
      const result = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;
      if (!response.ok || !result?.success) {
        throw new Error(result?.error ?? "Tantangan belum dapat diperbarui.");
      }
      notifyDataChanged();
      await refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Tantangan belum dapat diperbarui.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card card-pad bg-gradient-to-br from-brand to-lime text-white shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20">
            <Sparkles className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="font-display text-lg font-bold">Misi harian hari ini</p>
            <p className="text-sm text-white/85">
              {dailyDone} dari {daily.length} misi selesai · tersimpan di akunmu
            </p>
          </div>
        </div>
        <div className="chart-progress mt-4 h-2 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{
              width: `${daily.length > 0 ? (dailyDone / daily.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-sky" />
        <p>
          Progres GPS dihitung oleh server dari aktivitas tervalidasi. Catatan
          mandiri tetap tersimpan sebagai kebiasaan suportif, tetapi tidak
          menaikkan XP kompetitif.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-line/20 pb-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-full px-4.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              filter === item.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            busy={busyId === challenge.id}
            onAction={actOnChallenge}
          />
        ))}
      </div>

      {!loading && list.length === 0 && (
        <div className="card card-pad text-center text-sm text-muted-foreground">
          Belum ada tantangan aktif untuk periode ini. Tantangan akan muncul
          setelah diterbitkan melalui database.
        </div>
      )}
    </div>
  );
}
