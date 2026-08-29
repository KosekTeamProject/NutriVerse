"use client";

import { useEffect, useState } from "react";
import { Award, Bike, Flame, Footprints, Lock, Trophy } from "lucide-react";

type BadgeItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
  progress: { current: number; target: number; percentage: number };
};

function badgeIcon(code: string) {
  if (code.includes("STREAK")) return Flame;
  if (code.includes("DISTANCE")) return Bike;
  if (code.includes("CHALLENGE")) return Trophy;
  if (code.includes("EVENT")) return Award;
  return Footprints;
}

export function BadgeGallery({ title = "Galeri Badge" }: { title?: string }) {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    void fetch("/api/badges", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error ?? "Badge gagal dimuat.");
        setBadges(result.badges ?? []);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Badge gagal dimuat."));
  }, []);
  const earned = badges.filter((badge) => badge.earned).length;

  return (
    <section className="card card-pad">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="font-display text-lg font-extrabold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">Badge bersifat permanen. Progres menunjukkan jarak menuju badge berikutnya.</p></div>
        <span className="pill bg-brand-soft text-xs font-bold text-brand">{earned}/{badges.length} terbuka</span>
      </div>
      {error && <p className="mt-4 text-xs text-muted-foreground">{error}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {badges.map((badge) => {
          const Icon = badgeIcon(badge.code);
          return (
            <article key={badge.id} className={`rounded-2xl border p-4 ${badge.earned ? "border-brand/25 bg-brand-soft/20" : "border-line bg-secondary/20"}`}>
              <div className="flex items-start gap-3">
                <span className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${badge.earned ? "bg-gradient-to-br from-brand to-lime text-white" : "bg-secondary text-muted-foreground"}`}>
                  <Icon className="h-6 w-6" />
                  {!badge.earned && <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-muted-foreground text-white"><Lock className="h-3 w-3" /></span>}
                </span>
                <div className="min-w-0"><p className="text-sm font-bold">{badge.name}</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{badge.description}</p></div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px]"><span className="font-semibold text-muted-foreground">{badge.earned ? "Sudah didapat" : "Progres"}</span><span className="font-bold text-foreground">{Math.round(badge.progress.current).toLocaleString("id-ID")}/{badge.progress.target.toLocaleString("id-ID")}</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-brand to-lime transition-all" style={{ width: `${badge.progress.percentage}%` }} /></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
