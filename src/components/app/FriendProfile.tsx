"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { Award, Check, ChevronLeft, Clock3, Flame, Footprints, Lock, Medal, Trophy, UserPlus, UsersRound, Zap } from "lucide-react";
import { RankCrest } from "@/components/brand/RankCrest";
import { tierBySlug } from "@/lib/tiers";
import { ProfileMomentShowcase, type ProfileShowcaseMoment } from "@/components/app/ProfileMomentShowcase";

type Relationship = "self" | "friends" | "outgoing" | "incoming" | "none";

type FriendProfileData = {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  relationship: Relationship;
  canViewDetails: boolean;
  economy: { totalXp: number; currentTier: string; streakDays: number } | null;
  stats: { verifiedActivityCount: number; totalDistanceKm: number };
  badges: Array<{ earnedAt: string; badge: { id: string; name: string; description: string } }>;
  guildMemberships: Array<{ role: string; guild: { id: string; name: string; category: string; emblemUrl: string | null; _count: { members: number } } }>;
  profileMoments: ProfileShowcaseMoment[];
};

function relationshipLabel(relationship: Relationship) {
  if (relationship === "friends") return "Teman";
  if (relationship === "outgoing") return "Permintaan terkirim";
  if (relationship === "incoming") return "Meminta berteman";
  if (relationship === "self") return "Profilmu";
  return "Pengguna NutriVerse";
}

export function FriendProfile({ userId }: { readonly userId: string }) {
  const [profile, setProfile] = useState<FriendProfileData | null>(null);
  const [error, setError] = useState("");
  const [connectionBusy, setConnectionBusy] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/friends/${userId}/profile`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => null) as { success?: boolean; profile?: FriendProfileData; error?: string } | null;
        if (!response.ok || !result?.success || !result.profile) throw new Error(result?.error ?? "Profil pengguna tidak dapat dimuat.");
        if (!cancelled) setProfile(result.profile);
      })
      .catch((loadError: unknown) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Profil pengguna tidak dapat dimuat."); });
    return () => { cancelled = true; };
  }, [reloadKey, userId]);

  async function connect() {
    if (!profile || connectionBusy || profile.relationship === "friends" || profile.relationship === "outgoing" || profile.relationship === "self") return;
    setConnectionBusy(true);
    setConnectionMessage("");
    const response = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: profile.id }),
    });
    const result = await response.json().catch(() => null) as { success?: boolean; connection?: { status?: string }; error?: string } | null;
    setConnectionBusy(false);
    if (!response.ok || !result?.success) {
      setConnectionMessage(result?.error ?? "Permintaan teman belum dapat dikirim.");
      return;
    }
    if (result.connection?.status === "ACCEPTED") {
      setConnectionMessage("Sekarang kalian sudah berteman.");
      setReloadKey((value) => value + 1);
    } else {
      setProfile((current) => current ? { ...current, relationship: "outgoing" } : current);
      setConnectionMessage("Permintaan teman sudah dikirim.");
    }
  }

  if (error) return <div className="mx-auto max-w-3xl space-y-4"><Link href="/momen" className="btn btn-outline btn-sm"><ChevronLeft className="h-4 w-4" /> Kembali ke Momen</Link><div className="card card-pad text-sm text-destructive">{error}</div></div>;
  if (!profile) return <div className="mx-auto max-w-3xl space-y-4"><Link href="/momen" className="btn btn-outline btn-sm"><ChevronLeft className="h-4 w-4" /> Kembali ke Momen</Link><div className="card card-pad text-sm text-muted-foreground">Memuat profil pengguna…</div></div>;

  const tier = tierBySlug(profile.economy?.currentTier.toLowerCase() ?? "sprout");
  const initials = profile.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const stats = [
    { label: "XP", value: (profile.economy?.totalXp ?? 0).toLocaleString("id-ID"), icon: Zap, tone: "text-amber" },
    { label: "Streak", value: `${profile.economy?.streakDays ?? 0} hari`, icon: Flame, tone: "text-lime" },
    { label: "Aktivitas", value: String(profile.stats.verifiedActivityCount), icon: Footprints, tone: "text-sky" },
    { label: "Jarak", value: `${profile.stats.totalDistanceKm.toLocaleString("id-ID")} km`, icon: Trophy, tone: "text-brand" },
  ];

  const connectionButton = profile.relationship === "friends" ? (
    <span className="btn btn-outline pointer-events-none"><Check className="h-4 w-4" /> Teman</span>
  ) : profile.relationship === "outgoing" ? (
    <span className="btn btn-outline pointer-events-none"><Clock3 className="h-4 w-4" /> Menunggu</span>
  ) : profile.relationship === "self" ? null : (
    <button type="button" disabled={connectionBusy} onClick={() => void connect()} className="btn btn-primary">
      <UserPlus className="h-4 w-4" /> {connectionBusy ? "Memproses…" : profile.relationship === "incoming" ? "Terima Teman" : "Ikuti"}
    </button>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up-premium">
      <Link href="/momen" className="btn btn-outline btn-sm"><ChevronLeft className="h-4 w-4" /> Kembali ke Momen</Link>

      <section className="card overflow-hidden border-line">
        <div className="h-28 bg-gradient-to-br from-brand via-brand-bright to-lime sm:h-32" />
        <div className="card-pad relative -mt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="relative grid h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-4 border-card bg-gradient-to-br from-brand to-lime text-center font-display text-3xl font-extrabold leading-[5.5rem] text-white shadow-soft">
                {profile.avatarUrl ? <NextImage src={profile.avatarUrl} alt="" fill unoptimized className="object-cover" /> : initials}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="break-words font-display text-2xl font-extrabold tracking-tight">{profile.name}</h1>
                <p className="truncate text-sm text-muted-foreground">@{profile.username ?? "nutriverse.user"} · {relationshipLabel(profile.relationship)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {profile.canViewDetails && (
                <div className="flex items-center gap-2 rounded-2xl border border-line bg-secondary/35 px-3 py-2">
                  <RankCrest id={`friend-${profile.id}`} tier={tier.slug} from={tier.from} to={tier.to} size={28} />
                  <div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Rank</p><p className="text-sm font-bold">{tier.name}</p></div>
                </div>
              )}
              {connectionButton}
            </div>
          </div>
          {profile.bio && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>}
          {connectionMessage && <p className="mt-4 text-xs font-semibold text-brand">{connectionMessage}</p>}
        </div>
      </section>

      {profile.canViewDetails ? (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((item) => { const Icon = item.icon; return <div key={item.label} className="card card-pad"><Icon className={`h-5 w-5 ${item.tone}`} /><p className="mt-3 font-display text-lg font-extrabold">{item.value}</p><p className="text-[10px] font-bold text-muted-foreground">{item.label}</p></div>; })}
          </section>

          <ProfileMomentShowcase moments={profile.profileMoments} />

          <section className="card card-pad">
            <div className="flex items-center gap-2"><UsersRound className="h-5 w-5 text-brand" /><div><h2 className="font-display text-base font-bold">Komunitas yang Diikuti</h2><p className="text-[10px] text-muted-foreground">Komunitas yang dipilih teman ini untuk ditampilkan di profil.</p></div></div>
            {profile.guildMemberships.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-line p-5 text-center text-xs text-muted-foreground">Teman ini tidak menampilkan komunitas yang diikuti.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{profile.guildMemberships.map(({ guild, role }) => <Link key={guild.id} href={`/komunitas/ruang/${guild.id}`} className="rounded-2xl border border-line p-4 transition hover:border-brand/40"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><UsersRound className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-xs font-bold">{guild.name}</p><p className="mt-1 text-[9px] text-muted-foreground">{guild.category} · {guild._count.members} anggota</p><p className="mt-1 text-[9px] font-bold text-brand">{role === "OWNER" ? "Pemilik" : role === "ADMIN" ? "Moderator" : "Anggota"}</p></div></div></Link>)}</div>}
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-2"><Medal className="h-5 w-5 text-amber" /><div><h2 className="font-display text-base font-bold">Badge</h2><p className="text-[10px] text-muted-foreground">{profile.badges.length} badge telah didapatkan.</p></div></div>
            {profile.badges.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-line p-5 text-center text-xs text-muted-foreground">Belum ada badge.</p> : <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{profile.badges.map(({ badge, earnedAt }) => <div key={badge.id} className="rounded-2xl border border-line bg-secondary/25 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-lime text-white"><Award className="h-5 w-5" /></span><p className="mt-3 text-xs font-bold">{badge.name}</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{badge.description}</p><p className="mt-2 text-[9px] font-medium text-brand">Didapat {new Date(earnedAt).toLocaleDateString("id-ID")}</p></div>)}</div>}
          </section>
        </>
      ) : (
        <><ProfileMomentShowcase moments={profile.profileMoments} hideWhenEmpty /><section className="card card-pad text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Lock className="h-5 w-5" /></span>
          <h2 className="mt-4 font-display text-base font-bold">Informasi lengkap khusus teman</h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">Kirim permintaan teman untuk melihat rank, progres aktivitas, badge, dan komunitas yang dipilih pengguna ini untuk ditampilkan.</p>
        </section></>
      )}
    </div>
  );
}
