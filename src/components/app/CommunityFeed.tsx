"use client";

import { useState } from "react";
import {
  Heart, MessageCircle, Plus, Footprints, TrendingUp, Award, Users2, UserPlus, Check,
} from "lucide-react";
import { STORIES, POSTS, SUGGESTIONS, COMMUNITY_CHALLENGE, type Post } from "@/lib/community";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const KIND_ICON = { activity: Footprints, tier: TrendingUp, badge: Award };
const KIND_STYLE = {
  activity: "bg-brand-soft text-brand",
  tier: "bg-sky/10 text-sky",
  badge: "bg-amber/15 text-amber",
};

function PostCard({ p }: { p: Post }) {
  const [liked, setLiked] = useState(false);
  const Icon = KIND_ICON[p.kind];
  return (
    <div className="card card-pad">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-sm font-bold text-white">{initials(p.name)}</div>
        <div className="flex-1">
          <p className="font-display text-sm font-bold leading-tight">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.time}</p>
        </div>
        <span className={`pill ${KIND_STYLE[p.kind]}`}><Icon className="h-3.5 w-3.5" /> {p.detail}</span>
      </div>

      <p className="mt-3 text-sm">{p.text}</p>

      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
        <button
          onClick={() => setLiked((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${liked ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-secondary"}`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> Semangat · {p.encourages + (liked ? 1 : 0)}
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-secondary">
          <MessageCircle className="h-4 w-4" /> Komentar · {p.comments}
        </button>
      </div>
    </div>
  );
}

function SuggestionRow({ name, mutual }: { name: string; mutual: number }) {
  const [followed, setFollowed] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-xs font-bold text-white">{initials(name)}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="text-[11px] text-muted-foreground">{mutual} teman bersama</p>
      </div>
      <button
        onClick={() => setFollowed((v) => !v)}
        className={`btn btn-sm ${followed ? "btn-ghost" : "btn-outline"}`}
      >
        {followed ? <><Check className="h-3.5 w-3.5" /> Diikuti</> : <><UserPlus className="h-3.5 w-3.5" /> Ikuti</>}
      </button>
    </div>
  );
}

export function CommunityFeed() {
  const [joined, setJoined] = useState(false);
  const cc = COMMUNITY_CHALLENGE;
  const pct = Math.round((cc.now / cc.goal) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* stories */}
        <div className="card card-pad">
          <div className="flex gap-4 overflow-x-auto pb-1">
            {STORIES.map((s) => (
              <div key={s.id} className="flex shrink-0 flex-col items-center gap-1.5">
                <div className={`grid h-16 w-16 place-items-center rounded-full ${s.you ? "border-2 border-dashed border-line" : "bg-gradient-to-br from-brand via-lime to-amber p-0.5"}`}>
                  {s.you ? (
                    <span className="grid h-full w-full place-items-center rounded-full bg-secondary text-muted-foreground"><Plus className="h-6 w-6" /></span>
                  ) : (
                    <span className="grid h-full w-full place-items-center rounded-full bg-card">
                      <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-sm font-bold text-white">{initials(s.name)}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-muted-foreground">{s.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* feed */}
        {POSTS.map((p) => <PostCard key={p.id} p={p} />)}
      </div>

      {/* sidebar */}
      <div className="space-y-6">
        {/* community challenge */}
        <div className="card card-pad">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand"><Users2 className="h-5 w-5" /></span>
            <h2 className="font-display text-base font-bold leading-tight">Community Challenge</h2>
          </div>
          <p className="mt-3 font-semibold">{cc.title}</p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-lime" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="stat-num">{cc.now.toLocaleString("id-ID")} / {cc.goal.toLocaleString("id-ID")}</span>
            <span>{pct}%</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{cc.participants} peserta ikut serta</p>
          <button onClick={() => setJoined((v) => !v)} className={`btn mt-4 w-full btn-sm ${joined ? "btn-ghost" : "btn-primary"}`}>
            {joined ? <><Check className="h-4 w-4" /> Sudah ikut</> : "Ikut tantangan"}
          </button>
        </div>

        {/* suggestions */}
        <div className="card card-pad">
          <h2 className="font-display text-base font-bold">Saran untuk diikuti</h2>
          <div className="mt-4 space-y-4">
            {SUGGESTIONS.map((s) => <SuggestionRow key={s.id} name={s.name} mutual={s.mutual} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
