"use client";

import { useEffect, useState } from "react";
import { Footprints, Flame, Droplets, Sunrise, Salad, Bike, Medal, Crown, Lock, Award } from "lucide-react";
import { useProgressData } from "@/providers/ProgressDataProvider";

const ICONS: Record<string, typeof Award> = {
  footprints: Footprints, flame: Flame, droplets: Droplets, sunrise: Sunrise,
  salad: Salad, bike: Bike, medal: Medal, crown: Crown,
};

export function ProfileCollection() {
  const { overview } = useProgressData();
  const [tab, setTab] = useState<"badge" | "achievement">("badge");
  const [badges, setBadges] = useState<
    Array<{
      id: string;
      code: string;
      name: string;
      description: string;
      earned: boolean;
      progress: { current: number; target: number; percentage: number };
    }>
  >([]);

  useEffect(() => {
    void fetch("/api/badges", { cache: "no-store" })
      .then((response) => response.json())
      .then(
        (result: {
          success?: boolean;
          badges?: Array<{
            id: string;
            code: string;
            name: string;
            description: string;
            earned: boolean;
            progress: { current: number; target: number; percentage: number };
          }>;
        }) => {
          if (result.success) setBadges(result.badges ?? []);
        },
      )
      .catch(() => undefined);
  }, []);

  const achievements = [
    {
      id: "streak",
      name: "7 Hari Konsisten",
      desc: "Menjaga ritme aktivitas terverifikasi",
      now: overview?.economy.streakDays ?? 0,
      goal: 7,
      unit: "hari",
    },
    {
      id: "activity",
      name: "30 Aktivitas Tepercaya",
      desc: "Mengumpulkan sesi aktivitas yang lolos validasi",
      now: overview?.profile.verifiedActivityCount ?? 0,
      goal: 30,
      unit: "sesi",
    },
    {
      id: "distance",
      name: "100 Kilometer",
      desc: "Akumulasi jarak aktivitas terverifikasi",
      now: overview?.profile.totalDistanceKm ?? 0,
      goal: 100,
      unit: "km",
    },
    {
      id: "healthy-days",
      name: "Healthy Month",
      desc: "Hari sehat yang terbentuk dalam 28 hari terakhir",
      now: overview?.healthyDays.achievedDays ?? 0,
      goal: 28,
      unit: "hari",
    },
  ];
  const earned = badges.filter((badge) => badge.earned).length;

  return (
    <div className="card card-pad">
      <div className="inline-flex rounded-full bg-secondary p-1">
        <button
          onClick={() => setTab("badge")}
          className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${tab === "badge" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}
        >
          Badge ({earned}/{badges.length})
        </button>
        <button
          onClick={() => setTab("achievement")}
          className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${tab === "achievement" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}
        >
          Pencapaian
        </button>
      </div>

      {tab === "badge" ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {badges.map((b) => {
            const code = b.code.toLowerCase();
            const icon = code.includes("streak")
              ? "flame"
              : code.includes("water")
                ? "droplets"
                : code.includes("food")
                  ? "salad"
                  : code.includes("distance")
                    ? "bike"
                    : "footprints";
            const Icon = ICONS[icon] ?? Award;
            return (
              <div key={b.id} className={`flex flex-col items-center rounded-2xl border border-line p-4 text-center ${b.earned ? "" : "opacity-60"}`}>
                <span className={`relative grid h-14 w-14 place-items-center rounded-2xl ${b.earned ? "bg-gradient-to-br from-brand to-lime text-white" : "bg-secondary text-muted-foreground"}`}>
                  <Icon className="h-7 w-7" />
                  {!b.earned && <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-muted-foreground/70 text-white"><Lock className="h-3 w-3" /></span>}
                </span>
                <p className="mt-2 text-xs font-bold leading-tight">{b.name}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{b.description}</p>
                <div className="mt-3 w-full">
                  <div className="flex justify-between text-[9px] font-semibold text-muted-foreground"><span>{b.earned ? "Didapat" : "Progres"}</span><span>{Math.round(b.progress.current).toLocaleString("id-ID")}/{b.progress.target.toLocaleString("id-ID")}</span></div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-brand to-lime" style={{ width: `${b.progress.percentage}%` }} /></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {achievements.map((a) => {
            const pct = Math.min(100, Math.round((a.now / a.goal) * 100));
            return (
              <div key={a.id} className="rounded-2xl border border-line p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{a.name}</p>
                  <span className="stat-num text-xs text-muted-foreground">{a.now}/{a.goal} {a.unit}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.desc}</p>
                <div className="chart-progress mt-2.5 h-2 overflow-hidden rounded-full">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-bright" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
