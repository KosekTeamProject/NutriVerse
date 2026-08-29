"use client";

import { useEffect, useState, type FormEvent } from "react";

type Season = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  finalizedAt: string | null;
  timezone: string;
  _count: { rankings: number };
};

export function AdminSeasonPanel({ canManage }: { canManage: boolean }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => {
    const response = await fetch("/api/admin/leaderboard-seasons", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error ?? "Season gagal dimuat.");
    setSeasons(result.seasons ?? []);
  };
  useEffect(() => { void load().catch((error) => setMessage(error.message)); }, []);

  async function create(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    const start = new Date(startDate);
    const end = new Date(start.getTime() + 84 * 86_400_000);
    const response = await fetch("/api/admin/leaderboard-seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, startDate: start.toISOString(), endDate: end.toISOString(), isActive: true }),
    });
    const result = await response.json().catch(() => null);
    setMessage(response.ok && result?.success ? "Season 84 hari berhasil dibuat." : result?.error ?? "Season gagal dibuat.");
    if (response.ok && result?.success) { setName(""); setStartDate(""); await load(); }
  }

  async function finalize(season: Season) {
    if (!window.confirm(`Finalisasi ${season.name}? Reward HP dan carryover akan dibagikan satu kali.`)) return;
    const response = await fetch(`/api/admin/leaderboard-seasons/${season.id}/finalize`, { method: "POST" });
    const result = await response.json().catch(() => null);
    setMessage(response.ok && result?.success ? "Season berhasil difinalisasi." : result?.error ?? "Finalisasi gagal.");
    if (response.ok && result?.success) await load();
  }

  return (
    <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
      <div><p className="text-[9px] font-bold uppercase tracking-wider text-brand">Season Global · Asia/Jakarta</p><h2 className="mt-1 font-display text-lg font-extrabold">Season XP &amp; Carryover</h2><p className="mt-1 text-xs text-muted-foreground">Semua pengguna mengikuti kalender 84 hari yang sama. Lifetime tier tidak ikut turun.</p></div>
      {canManage && <form onSubmit={create} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input className="input" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama season" /><input className="input" required type="datetime-local" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><button className="btn btn-primary">Buat 84 Hari</button></form>}
      {message && <p className="mt-3 text-xs text-muted-foreground">{message}</p>}
      <div className="mt-4 space-y-2">
        {seasons.map((season) => {
          const ended = new Date(season.endDate) <= new Date();
          return <div key={season.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3"><div className="min-w-0 flex-1"><p className="text-xs font-bold">{season.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(season.startDate).toLocaleDateString("id-ID")}–{new Date(season.endDate).toLocaleDateString("id-ID")} · {season.timezone} · {season._count.rankings} ranking</p></div><span className={`pill text-[9px] font-bold ${season.finalizedAt ? "bg-secondary" : "bg-brand-soft text-brand"}`}>{season.finalizedAt ? "FINAL" : season.isActive ? "AKTIF" : "NONAKTIF"}</span>{canManage && ended && !season.finalizedAt && <button className="btn btn-outline btn-sm" onClick={() => void finalize(season)}>Finalisasi</button>}</div>;
        })}
      </div>
    </section>
  );
}
