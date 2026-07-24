"use client";

import { useEffect, useState } from "react";
import { BookHeart, Check, Lock, Sparkles, Trash2 } from "lucide-react";

type JournalEntry = {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly mood: string | null;
  readonly createdAt: string;
  readonly allowCompanion: boolean;
};

const MOODS = ["Tenang", "Berenergi", "Lelah", "Tertekan", "Netral"];

export function PrivateHealthJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("Netral");
  const [allowNora, setAllowNora] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/journal?limit=100", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; entries?: JournalEntry[]; error?: string }
          | null;
        if (!response.ok || !result?.success) {
          throw new Error(result?.error ?? "Jurnal gagal dimuat.");
        }
        if (!cancelled) setEntries(result.entries ?? []);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Jurnal gagal dimuat.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveEntry() {
    if (!body.trim()) return;
    setError("");
    const response = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || "Catatan kesehatan",
        content: body.trim(),
        mood,
        allowCompanion: allowNora,
      }),
    });
    const result = (await response.json().catch(() => null)) as
      | { success?: boolean; entry?: JournalEntry; error?: string }
      | null;
    if (!response.ok || !result?.success || !result.entry) {
      setError(result?.error ?? "Catatan belum dapat disimpan.");
      return;
    }
    setEntries((current) => [result.entry!, ...current]);
    setTitle("");
    setBody("");
    setMood("Netral");
    setAllowNora(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  async function removeEntry(id: string) {
    if (!window.confirm("Hapus catatan privat ini dari akunmu?")) return;
    const response = await fetch(`/api/journal/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Catatan belum dapat dihapus.");
      return;
    }
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="card card-pad min-w-0 border-brand/20 bg-gradient-to-br from-card to-brand-soft/25">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"><BookHeart className="h-5 w-5" /></span>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Tulis catatan untuk dirimu</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Tuliskan kondisi tubuh, pikiran, kebiasaan, atau hal kecil yang ingin kamu ingat.</p>
            </div>
          </div>
          <span className="pill border border-brand/20 bg-card text-[10px] font-bold text-brand"><Lock className="h-3.5 w-3.5" /> PRIVAT</span>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="journal-title" className="text-xs font-bold text-foreground">Judul</label>
            <input id="journal-title" value={title} onChange={(event) => setTitle(event.target.value)} className="input mt-1.5" placeholder="Contoh: Energi setelah kuliah" maxLength={80} />
          </div>
          <div>
            <label htmlFor="journal-body" className="text-xs font-bold text-foreground">Catatan</label>
            <textarea id="journal-body" value={body} onChange={(event) => setBody(event.target.value)} className="input mt-1.5 min-h-36 resize-y py-3" placeholder="Apa yang kamu rasakan hari ini?" maxLength={2000} />
            <p className="mt-1 text-right text-[10px] text-muted-foreground">{body.length}/2000</p>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Perasaan saat ini</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {MOODS.map((item) => (
                <button key={item} type="button" onClick={() => setMood(item)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${mood === item ? "bg-brand text-white" : "bg-secondary text-muted-foreground"}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-secondary/30 p-3">
            <input type="checkbox" checked={allowNora} onChange={(event) => setAllowNora(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
            <span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground"><Sparkles className="h-3.5 w-3.5 text-brand" /> Izinkan Nora memakai ringkasan catatan ini</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">Opsional. Catatan tetap tidak muncul di Komunitas atau Peringkat.</span>
            </span>
          </label>
          <button onClick={saveEntry} disabled={!body.trim()} className="btn btn-primary w-full sm:w-auto" type="button">
            {saved ? <><Check className="h-4 w-4" /> Tersimpan</> : "Simpan Catatan Privat"}
          </button>
          {error && <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
        </div>
      </section>

      <aside className="min-w-0 space-y-4">
        <div className="card card-pad border-line bg-secondary/25">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Privasi jurnal</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Catatan disimpan privat pada akunmu di database. Catatan tidak dipublikasikan dan tidak memengaruhi XP, HP, Health Pulse, atau Peringkat.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-foreground">Catatan tersimpan</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{entries.length} catatan privat tersimpan</p>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-dashed border-line p-6 text-center text-xs text-muted-foreground">Memuat jurnal dari database...</div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-6 text-center text-xs text-muted-foreground">Belum ada catatan. Mulai dengan satu kalimat sederhana.</div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <article key={entry.id} className="card min-w-0 border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-foreground">{entry.title}</h4>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.createdAt))} · {entry.mood ?? "Netral"}</p>
                  </div>
                  <button onClick={() => removeEntry(entry.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Hapus ${entry.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{entry.content}</p>
                {entry.allowCompanion && <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-brand"><Sparkles className="h-3 w-3" /> Ringkasan dapat dipakai Nora</span>}
              </article>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
