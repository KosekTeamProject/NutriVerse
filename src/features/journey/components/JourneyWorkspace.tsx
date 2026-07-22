"use client";

import { useState, type ReactNode } from "react";
import { BookHeart, History } from "lucide-react";
import { PrivateHealthJournal } from "./PrivateHealthJournal";

export function JourneyWorkspace({ history }: { readonly history: ReactNode }) {
  const [activeTab, setActiveTab] = useState<"history" | "journal">("history");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 rounded-2xl bg-secondary p-1 sm:inline-grid sm:min-w-80">
        <button onClick={() => setActiveTab("history")} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === "history" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>
          <History className="h-4 w-4" /> Riwayat
        </button>
        <button onClick={() => setActiveTab("journal")} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === "journal" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>
          <BookHeart className="h-4 w-4" /> Jurnal Privat
        </button>
      </div>
      {activeTab === "history" ? history : <PrivateHealthJournal />}
    </div>
  );
}
