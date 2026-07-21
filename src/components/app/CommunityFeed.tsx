"use client";

import { useState } from "react";
import {
  Heart, MessageCircle, Plus, Footprints, Flame, MessageSquarePlus, Users2, UserPlus, Check, Info, Lock
} from "lucide-react";
import { STORIES, POSTS, SUGGESTIONS, COMMUNITY_CHALLENGE, type Post } from "@/lib/community";

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

  return (
    <div className="card card-pad space-y-4 bg-card border-line">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-sm font-bold text-white shadow-sm">
          {initials(p.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-bold text-foreground truncate">{p.name}</p>
            {p.trustLevel && (
              <span className={`pill text-[8px] font-bold uppercase ${statusColors}`}>
                {p.trustLevel}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{p.time}</p>
        </div>
        <span className={`pill text-[10px] font-bold uppercase ${KIND_STYLE[p.kind]}`}>
          <Icon className="h-3.5 w-3.5" /> {p.detail}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {p.text}
      </p>

      <div className="flex items-center gap-2 border-t border-line/45 pt-3">
        <button
          onClick={() => setLiked((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${liked ? "bg-brand-soft text-brand shadow-sm" : "text-muted-foreground hover:bg-secondary"}`}
          aria-label="Encourage post"
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} /> Beri Semangat &middot; {p.encourages + (liked ? 1 : 0)}
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-muted-foreground">
          <MessageCircle className="h-3.5 w-3.5" /> Komentar Dukungan &middot; {p.comments}
        </span>
      </div>
    </div>
  );
}

export function CommunityFeed() {
  const [joined, setJoined] = useState(false);
  const cc = COMMUNITY_CHALLENGE;
  const pct = Math.round((cc.now / cc.goal) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Feed Column */}
      <div className="space-y-6 lg:col-span-2">
        {/* Stories widget */}
        <div className="card card-pad border-line bg-card">
          <div className="flex gap-4 overflow-x-auto pb-1">
            {STORIES.map((s) => (
              <div key={s.id} className="flex shrink-0 flex-col items-center gap-1.5">
                <div className={`grid h-16 w-16 place-items-center rounded-full ${s.you ? "border-2 border-dashed border-line" : "bg-gradient-to-br from-brand via-lime to-amber p-0.5"}`}>
                  {s.you ? (
                    <span className="grid h-full w-full place-items-center rounded-full bg-secondary text-muted-foreground"><Plus className="h-5 w-5" /></span>
                  ) : (
                    <span className="grid h-full w-full place-items-center rounded-full bg-card">
                      <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-xs font-bold text-white shadow-sm">{initials(s.name)}</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground">{s.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Posts feed */}
        <div className="space-y-4">
          {POSTS.map((p) => (
            <PostCard key={p.id} p={p} />
          ))}
        </div>
      </div>

      {/* Sidebar Column */}
      <div className="space-y-6">
        {/* Privacy Card */}
        <div className="card card-pad bg-secondary/35 border-line/65 space-y-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <Lock className="h-5 w-5" />
            </span>
            <h3 className="font-display text-sm font-bold text-foreground">Share Progress, Keep Details Private</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-normal">
            Each Journey has its own visibility setting. Nutrition logs, water intake, sleep data, and precise telemetry paths remain strictly private by default. You are in full control of what gets shared with your Circle.
          </p>
        </div>

        {/* Community Challenge */}
        <div className="card card-pad border-line bg-card space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="pill bg-amber/10 text-amber border border-amber/15 text-[9px] font-bold uppercase tracking-wider">Active Challenge</span>
              <h3 className="font-display text-base font-bold text-foreground mt-1.5">{cc.title}</h3>
            </div>
            <Users2 className="h-5 w-5 text-brand" />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Progress</span>
              <span>{cc.now.toLocaleString("id-ID")} / {cc.goal.toLocaleString("id-ID")} langkah ({pct}%)</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-line/45 pt-3">
            <span className="text-muted-foreground font-semibold">{cc.participants} travelers bergabung</span>
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
                    <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{s.focus} &middot; {s.mutual} mutuals</p>
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
            Healthy Circle activity in this competition MVP uses deterministic local data to demonstrate the intended supportive experience.
          </p>
        </div>
      </div>
    </div>
  );
}
