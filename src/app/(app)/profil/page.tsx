import Link from "next/link";
import { Pencil, Zap, Heart, MapPin, Activity, Flame, Target, Utensils, Droplets, Moon } from "lucide-react";
import { RankCrest } from "@/components/brand/RankCrest";
import { ProfileCollection } from "@/components/app/ProfileCollection";
import { tierBySlug } from "@/lib/tiers";
import { StatCard } from "@/components/ui/StatCard";

const TARGETS = [
  { icon: Utensils, label: "Kalori", value: "2.200 kkal" },
  { icon: Activity, label: "Protein", value: "90 g" },
  { icon: Droplets, label: "Air", value: "2,0 L" },
  { icon: Moon, label: "Tidur", value: "8 jam" },
];

export default function ProfilPage() {
  const tier = tierBySlug("radiant");
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* header */}
      <div className="card overflow-hidden">
        <div className="relative h-28 bg-gradient-to-br from-brand to-lime">
          <div className="absolute inset-0 grid-dots opacity-20" />
        </div>
        <div className="card-pad -mt-12">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl border-4 border-card bg-gradient-to-br from-brand to-lime font-display text-3xl font-extrabold text-white">RA</div>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-extrabold tracking-tight">Rafi Adiputra</h1>
                <p className="text-sm text-muted-foreground">@rafi.adiputra</p>
              </div>
            </div>
            <Link href="/pengaturan" className="btn btn-outline btn-sm"><Pencil className="h-4 w-4" /> Edit profil</Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-line px-3 py-2">
              <RankCrest id="profil" from={tier.from} to={tier.to} size={28} />
              <div className="leading-tight">
                <p className="text-[10px] text-muted-foreground">Tier</p>
                <p className="font-display text-sm font-bold">{tier.name} · Divisi II</p>
              </div>
            </div>
            <span className="pill bg-amber/15 text-amber"><Zap className="h-3.5 w-3.5" /> 12.450 XP</span>
            <span className="pill bg-brand-soft text-brand"><Heart className="h-3.5 w-3.5" /> 3.280 HP</span>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Zap} label="Total XP" value="12.450" accent="amber" />
        <StatCard icon={MapPin} label="Jarak total" value="128 km" accent="brand" />
        <StatCard icon={Activity} label="Aktivitas" value="42" accent="sky" />
        <StatCard icon={Flame} label="Streak" value="12 hari" accent="lime" />
      </div>

      {/* collection */}
      <ProfileCollection />

      {/* targets */}
      <div className="card card-pad">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Target harian</h2>
          <Target className="h-5 w-5 text-brand" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TARGETS.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="rounded-2xl bg-secondary p-3 text-center">
                <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="stat-num mt-1.5 text-base">{t.value}</p>
                <p className="text-[11px] text-muted-foreground">{t.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
