"use client";

import { useState } from "react";
import { Camera, PencilLine, Clock, Trash2, Info, Leaf, Database, X, Check } from "lucide-react";
import { FoodScanner, type LoggedFood } from "./FoodScanner";
import { ManualFoodInput } from "./ManualFoodInput";
import { NutritionProgressSummary, NutritionTrustBadge } from "@/features/nutrition/components/NutritionComponents";

type Tab = "scan" | "manual";
type Entry = LoggedFood & { id: number; via: "scan" | "manual"; date: string };

export function FoodLogger() {
  const [tab, setTab] = useState<Tab>("scan");
  const [log, setLog] = useState<Entry[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", portion: "" });

  function addEntry(entry: LoggedFood) {
    const now = new Date();
    const date = `Hari ini, ${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}`;
    setLog((prev) => [{ ...entry, id: Date.now() + Math.random(), via: tab === "manual" ? "manual" : "scan", date }, ...prev]);
  }
  const remove = (id: number) => setLog((prev) => prev.filter((e) => e.id !== id));
  const beginEdit = (entry: Entry) => { setEditingId(entry.id); setEditDraft({ name: entry.name, portion: entry.portion }); };
  const saveEdit = () => {
    if (!editingId || !editDraft.name.trim() || !editDraft.portion.trim()) return;
    setLog((entries) => entries.map((entry) => entry.id === editingId ? { ...entry, name: editDraft.name.trim(), portion: editDraft.portion.trim() } : entry));
    setEditingId(null);
  };
  const total = log.reduce((s, e) => s + e.nutrition.kcal, 0);

  const tabs: { key: Tab; label: string; icon: typeof Camera }[] = [
    { key: "scan", label: "Pindai Makanan", icon: Camera },
    { key: "manual", label: "Input Manual", icon: PencilLine },
  ];

  return (
    <div className="space-y-6">
      {log.length > 0 ? <NutritionProgressSummary /> : (
        <div className="card card-pad border-dashed text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Leaf className="h-6 w-6" /></span>
          <h2 className="mt-4 font-display text-lg font-bold">Belum ada catatan makanan</h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">Mulai dengan foto atau input manual. Data baru masuk ke riwayat setelah kamu menekan tombol simpan.</p>
          <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <button onClick={() => setTab("scan")} className="btn btn-primary btn-sm"><Camera className="h-4 w-4" /> Pindai pertama</button>
            <button onClick={() => setTab("manual")} className="btn btn-outline btn-sm"><PencilLine className="h-4 w-4" /> Input manual</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${tab === t.key ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}>
              <Icon className="h-[18px] w-[18px]" /> <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "scan" && <FoodScanner onAdd={addEntry} />}
      {tab === "manual" && <ManualFoodInput onAdd={addEntry} />}

      {/* Food History */}
      <div className="card card-pad">
        <div className="flex items-center justify-between pb-3 border-b border-line/45">
          <h2 className="font-display text-lg font-bold text-foreground">Riwayat Makanan</h2>
          <span className="chip text-xs"><Clock className="h-3.5 w-3.5 text-brand" /> {total} kkal hari ini</span>
        </div>

        <div className="mt-4 space-y-3">
          {log.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-5 text-center">
              <Database className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-xs font-bold text-foreground">Riwayat pengguna masih kosong</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Contoh makanan pada alat pindai diberi label Demo dan belum menjadi catatanmu.</p>
            </div>
          ) : (
            log.map((e) => (
              <div key={e.id} className="rounded-2xl border border-line p-4 space-y-3 bg-card hover:border-brand/30 transition">
                <div className="flex items-start gap-3">
                  {e.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.photo} alt={e.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Leaf className="h-6 w-6" /></span>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      {editingId === e.id ? <input value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} className="input h-8 text-xs" aria-label="Ubah nama makanan" /> : <p className="truncate text-sm font-bold text-foreground">{e.name}</p>}
                      <div className="flex shrink-0 items-center gap-1">
                        {editingId === e.id ? <><button onClick={saveEdit} className="grid h-7 w-7 place-items-center rounded-lg text-brand hover:bg-brand-soft" aria-label="Simpan perubahan"><Check className="h-3.5 w-3.5" /></button><button onClick={() => setEditingId(null)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Batalkan perubahan"><X className="h-3.5 w-3.5" /></button></> : <button onClick={() => beginEdit(e)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-brand" aria-label="Ubah catatan"><PencilLine className="h-3.5 w-3.5" /></button>}
                        <button onClick={() => remove(e.id)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:text-destructive" aria-label="Hapus catatan"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    {editingId === e.id ? <input value={editDraft.portion} onChange={(event) => setEditDraft({ ...editDraft, portion: event.target.value })} className="input h-8 text-xs" aria-label="Ubah porsi makanan" /> : <p className="text-xs text-muted-foreground">{e.portion} &middot; {e.date} &middot; sumber: {e.via === "scan" ? "pindai foto" : "input manual"}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold">{e.nutrition.kcal} kkal</span>
                      <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold">P {e.nutrition.protein}g</span>
                      <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold">K {e.nutrition.carbs}g</span>
                      <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold">L {e.nutrition.fat}g</span>
                      <NutritionTrustBadge trust={e.trustLevel} />
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 border-t border-line/35 pt-2.5">
                  <p><span className="font-bold text-foreground">Analisis:</span> {e.insight}</p>
                  <p><span className="font-bold text-foreground">Rekomendasi:</span> {e.activityRec}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/50 p-4 text-[10px] text-muted-foreground border border-line/30">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p>Riwayat disimpan sementara di penyimpanan browser lokal. Integrasi database penuh ditangguhkan.</p>
        </div>
      </div>
    </div>
  );
}
