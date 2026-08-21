"use client";

import { useState } from "react";
import { CalendarDays, Trophy, UsersRound } from "lucide-react";
import { CommunityDirectory } from "@/components/app/CommunityDirectory";
import { CommunityEvents } from "@/components/app/CommunityEvents";
import { LeaderboardView } from "@/components/app/LeaderboardView";

export function CommunityHub() {
  const [section, setSection] = useState<"communities" | "events" | "ranking">("communities");
  return <div className="space-y-6"><header><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Ruang sosial NutriVerse</p><h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Komunitas, Event &amp; Peringkat</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Komunitas adalah ruang diskusi, Event adalah kegiatan terjadwal, dan Peringkat menunjukkan progres kompetitifmu.</p></header><div className="grid grid-cols-3 gap-1 rounded-2xl border border-line bg-secondary p-1 sm:w-[620px]"><button onClick={() => setSection("communities")} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold ${section === "communities" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}><UsersRound className="h-4 w-4" /> Komunitas</button><button onClick={() => setSection("events")} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold ${section === "events" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}><CalendarDays className="h-4 w-4" /> Event</button><button onClick={() => setSection("ranking")} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold ${section === "ranking" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}><Trophy className="h-4 w-4" /> Peringkat</button></div>{section === "communities" ? <CommunityDirectory /> : section === "events" ? <CommunityEvents /> : <LeaderboardView />}</div>;
}
