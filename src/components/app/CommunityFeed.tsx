"use client";

import { useEffect, useState } from "react";
import {
  Heart, MessageCircle, Footprints, Flame, MessageSquarePlus, Users2, UserPlus, Check, Info, Lock,
  CalendarDays, Clock3, Gift, MapPin, Megaphone, Palette, RefreshCw, Share2, Trophy
} from "lucide-react";
import { POSTS, SUGGESTIONS, COMMUNITY_CHALLENGE, type Post } from "@/lib/community";
import { LeaderboardView } from "@/components/app/LeaderboardView";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const KIND_ICON = { 
  activity: Footprints, 
  consistency: Flame, 
  reflection: MessageSquarePlus 
};

const KIND_STYLE = {
  activity: "bg-brand-soft text-brand border-brand/20",
  consistency: "bg-amber/15 text-amber border-amber/20",
  reflection: "bg-sky/15 text-sky border-sky/20",
};

function PostCard({ p }: { readonly p: Post }) {
  const [liked, setLiked] = useState(false);
  const Icon = KIND_ICON[p.kind] ?? Footprints;
  const statusColors = p.trustLevel === "verified"
    ? "bg-brand-soft text-brand border-brand/20"
    : "bg-secondary text-muted-foreground border-line";
  const trustLabel = p.trustLevel === "verified" ? "Terverifikasi" : "Catatan Mandiri";

  return (
    <div className="card card-pad min-w-0 space-y-4 border-line bg-card">
      <div className="flex min-w-0 flex-wrap items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-sm font-bold text-white shadow-sm">
          {initials(p.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-bold text-foreground truncate">{p.name}</p>
            {p.trustLevel && (
              <span className={`pill text-[8px] font-bold uppercase ${statusColors}`}>
                {trustLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{p.time}</p>
        </div>
        <span className={`pill max-w-full whitespace-normal break-words text-[10px] font-bold uppercase ${KIND_STYLE[p.kind]}`}>
          <Icon className="h-3.5 w-3.5" /> {p.detail}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {p.text}
      </p>

      <div className="flex min-w-0 flex-col items-start gap-1 border-t border-line/45 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <button
          onClick={() => setLiked((v) => !v)}
          className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1.5 text-left text-xs font-bold transition sm:px-3 ${liked ? "bg-brand-soft text-brand shadow-sm" : "text-muted-foreground hover:bg-secondary"}`}
          aria-label="Beri semangat pada kiriman"
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} /> Beri Semangat &middot; {p.encourages + (liked ? 1 : 0)}
        </button>
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-bold text-muted-foreground sm:px-3">
          <MessageCircle className="h-3.5 w-3.5" /> Komentar Dukungan &middot; {p.comments}
        </span>
      </div>
    </div>
  );
}

function EventPoster() {
  const [joined, setJoined] = useState(false);
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-[#073b2b] via-[#0b5b3d] to-[#092c23] p-5 text-white shadow-soft sm:p-7">
      <div aria-hidden className="absolute -right-12 -top-14 h-48 w-48 rounded-full bg-lime/25 blur-3xl" />
      <div aria-hidden className="absolute bottom-0 right-0 h-32 w-1/2 bg-gradient-to-t from-black/25 to-transparent" />
      <div className="relative z-10 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill border border-white/15 bg-white/10 text-[10px] font-bold text-white"><Megaphone className="h-3.5 w-3.5" /> EVENT KOMUNITAS</span>
          <span className="pill border border-lime/30 bg-lime/15 text-[10px] font-bold text-lime">LENCANA EKSKLUSIF</span>
        </div>
        <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight sm:text-4xl">AMIKOM Morning Run 5K</h2>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-white/80 sm:text-sm"><MapPin className="h-4 w-4 text-lime" /> Embung AMIKOM, Yogyakarta</p>
        <div className="mt-5 grid gap-3 min-[420px]:grid-cols-2 sm:grid-cols-4">
          {[
            { icon: CalendarDays, value: "27 Juli 2026", label: "Minggu" },
            { icon: Clock3, value: "06.00 WIB", label: "Mulai" },
            { icon: Users2, value: "412 peserta", label: "Sudah bergabung" },
            { icon: Gift, value: "+450 XP", label: "Hadiah potensial" },
          ].map((item) => {
            const Icon = item.icon;
            return <div key={item.value} className="flex items-start gap-2"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-lime" /><div><p className="text-xs font-bold sm:text-sm">{item.value}</p><p className="text-[10px] text-white/60">{item.label}</p></div></div>;
          })}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <div className="flex justify-between text-[10px] text-white/70"><span>412 / 600 peserta</span><span>69%</span></div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[69%] rounded-full bg-gradient-to-r from-brand-bright to-lime" /></div>
          </div>
          <button onClick={() => setJoined(true)} className={`btn shrink-0 ${joined ? "bg-white/15 text-white" : "bg-lime text-[#073b2b]"}`}>
            {joined ? <><Check className="h-4 w-4" /> Sudah Bergabung</> : "Gabung Event"}
          </button>
        </div>
      </div>
    </section>
  );
}

const SHARE_TEMPLATES = [
  { name: "Energi Hijau", background: "from-[#063d2b] via-[#0b8054] to-[#b8e343]", accent: "text-lime" },
  { name: "Langit Pagi", background: "from-[#163a5f] via-[#2189a4] to-[#f7b267]", accent: "text-amber" },
  { name: "Malam Kompetitif", background: "from-[#111827] via-[#312e81] to-[#059669]", accent: "text-sky" },
] as const;

function ShareTemplateStudio() {
  const [templateIndex, setTemplateIndex] = useState(0);
  const [shared, setShared] = useState(false);
  const template = SHARE_TEMPLATES[templateIndex];

  async function shareProgress() {
    const text = "Minggu ini aku menjaga 4 hari aktif tervalidasi bersama NutriVerse. Langkah kecil, tetap konsisten.";
    try {
      if (navigator.share) await navigator.share({ title: "Progres NutriVerse", text });
      else await navigator.clipboard.writeText(text);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // Pengguna dapat membatalkan dialog berbagi tanpa dianggap sebagai kesalahan.
    }
  }

  return (
    <section className="card card-pad overflow-hidden border-brand/15 bg-card">
      <div className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
        <div className={`relative mx-auto aspect-[9/16] w-36 overflow-hidden rounded-3xl bg-gradient-to-br ${template.background} p-4 text-white shadow-xl sm:w-40`}>
          <div className="flex items-center justify-between text-[8px] font-bold"><span>NutriVerse</span><span>4 / 7 HARI</span></div>
          <div className="absolute inset-x-4 bottom-5">
            <Trophy className={`h-7 w-7 ${template.accent}`} />
            <p className="mt-3 text-[9px] font-semibold uppercase tracking-wider text-white/70">Progres Mingguan</p>
            <p className="mt-1 font-display text-xl font-extrabold leading-tight">Langkah kecil.<br />Tetap konsisten.</p>
            <p className="mt-3 text-[8px] text-white/70">4 hari aktif tervalidasi · +2 dari baseline</p>
          </div>
        </div>
        <div className="min-w-0">
          <span className="pill bg-brand-soft text-[10px] font-bold text-brand"><Share2 className="h-3.5 w-3.5" /> TEMPLATE MEDIA SOSIAL</span>
          <h2 className="mt-3 font-display text-lg font-bold text-foreground">Bagikan progres tanpa membuka data privat</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Story pengguna tidak tampil di feed NutriVerse. Sebagai gantinya, pilih template 9:16 untuk Instagram, WhatsApp, atau media sosial lain.</p>
          <div className="mt-4 rounded-xl bg-secondary/45 p-3 text-xs">
            <p className="font-bold text-foreground">Template: {template.name}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Hanya ringkasan aman; tanpa lokasi, rute, jurnal, atau catatan makanan.</p>
          </div>
          <div className="mt-4 flex flex-col gap-2 min-[420px]:flex-row">
            <button onClick={() => setTemplateIndex((current) => (current + 1) % SHARE_TEMPLATES.length)} className="btn btn-outline flex-1"><RefreshCw className="h-4 w-4" /> Ubah Template</button>
            <button onClick={shareProgress} className="btn btn-primary flex-1"><Share2 className="h-4 w-4" /> {shared ? "Siap Dibagikan" : "Bagikan"}</button>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground"><Palette className="h-3.5 w-3.5" /> Pembuatan gambar final dan integrasi platform masih tahap berikutnya.</p>
        </div>
      </div>
    </section>
  );
}

export function CommunityHub() {
  const [activeTab, setActiveTab] = useState<"community" | "ranking">("community");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.location.hash === "#peringkat") setActiveTab("ranking");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 rounded-2xl bg-secondary p-1 sm:inline-grid sm:min-w-80">
        <button onClick={() => setActiveTab("community")} className={`rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === "community" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>Komunitas</button>
        <button onClick={() => setActiveTab("ranking")} className={`rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === "ranking" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>Peringkat</button>
      </div>
      {activeTab === "community" ? <CommunityFeed /> : <LeaderboardView />}
    </div>
  );
}

export function CommunityFeed() {
  const [joined, setJoined] = useState(false);
  const cc = COMMUNITY_CHALLENGE;
  const pct = Math.round((cc.now / cc.goal) * 100);

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-3">
      {/* Feed Column */}
      <div className="min-w-0 space-y-6 lg:col-span-2">
        <EventPoster />
        <ShareTemplateStudio />

        {/* Posts feed */}
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">Aktivitas Komunitas</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Dukungan dan progres aman dari lingkaranmu.</p>
          </div>
          {POSTS.map((p) => (
            <PostCard key={p.id} p={p} />
          ))}
        </div>
      </div>

      {/* Sidebar Column */}
      <div className="min-w-0 space-y-6">
        {/* Privacy Card */}
        <div className="card card-pad bg-secondary/35 border-line/65 space-y-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <Lock className="h-5 w-5" />
            </span>
            <h3 className="font-display text-sm font-bold text-foreground">Bagikan Progres, Jaga Privasi</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-normal">
            Kamu memilih ringkasan yang dibagikan. Jurnal, makanan, hidrasi, tidur, dan rute GPS presisi tetap privat secara bawaan.
          </p>
        </div>

        {/* Community Challenge */}
        <div className="card card-pad border-line bg-card space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="pill bg-amber/10 text-amber border border-amber/15 text-[9px] font-bold uppercase tracking-wider">Tantangan Aktif</span>
              <h3 className="font-display text-base font-bold text-foreground mt-1.5">{cc.title}</h3>
            </div>
            <Users2 className="h-5 w-5 text-brand" />
          </div>

          <div>
            <div className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
              <span>Progres</span>
              <span>{cc.now.toLocaleString("id-ID")} / {cc.goal.toLocaleString("id-ID")} langkah ({pct}%)</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 border-t border-line/45 pt-3 text-xs min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
            <span className="text-muted-foreground font-semibold">{cc.participants} pengguna bergabung</span>
            {joined ? (
              <span className="pill bg-brand-soft text-brand font-bold flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Terdaftar
              </span>
            ) : (
              <button onClick={() => setJoined(true)} className="btn btn-primary btn-xs font-bold">Gabung</button>
            )}
          </div>
        </div>

        {/* Circle Members Suggestions */}
        <div className="card card-pad border-line bg-card space-y-4">
          <h3 className="font-display text-sm font-bold text-foreground">Saran Lingkaran Sehat</h3>
          <div className="space-y-3.5">
            {SUGGESTIONS.map((s) => {
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-xs font-bold text-white shadow-sm">
                    {initials(s.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground leading-tight">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{s.focus} &middot; {s.mutual} teman bersama</p>
                  </div>
                  <button className="btn btn-outline btn-xs font-bold shrink-0">
                    <UserPlus className="h-3.5 w-3.5" /> Ikuti
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* MVP Transparency */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-[10px] text-muted-foreground border border-line/30">
          <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <p>
            Aktivitas komunitas pada MVP memakai data lokal tetap untuk memperagakan pengalaman yang suportif.
          </p>
        </div>
      </div>
    </div>
  );
}
