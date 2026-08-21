"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, CalendarCheck, Gift, Heart, Images, LayoutDashboard, Search, ScanLine, Sparkles, Trophy, UsersRound, X, type LucideIcon } from "lucide-react";

type SearchItem = {
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly kind: "Fitur" | "Progres";
  readonly keywords: string;
  readonly icon: LucideIcon;
};

const SEARCH_ITEMS: readonly SearchItem[] = [
  { label: "Dasbor", description: "Ringkasan kesehatan dan aksi cepat", href: "/dashboard", kind: "Fitur", keywords: "beranda home ringkasan", icon: LayoutDashboard },
  { label: "Health Pulse 78", description: "Nilai kesehatan hari ini naik +1,2", href: "/health-pulse", kind: "Progres", keywords: "pulse nilai kesehatan nutrisi tidur hidrasi", icon: Heart },
  { label: "Hari aktif 4 dari 7", description: "Lihat target dan kebiasaan hari ini", href: "/todays-journey", kind: "Progres", keywords: "hari ini target journey kebiasaan", icon: CalendarCheck },
  { label: "Aktivitas GPS 1,4 km", description: "Mulai atau lihat aktivitas terverifikasi", href: "/aktivitas", kind: "Progres", keywords: "jalan lari sepeda gps xp pace", icon: Activity },
  { label: "Pindai Makanan", description: "Estimasi gizi informatif tanpa XP", href: "/scan", kind: "Fitur", keywords: "scan kamera kalori protein nutrisi makanan", icon: ScanLine },
  { label: "Momen", description: "Foto teman dan galeri pribadi", href: "/momen", kind: "Fitur", keywords: "foto teman privat kamera galeri", icon: Images },
  { label: "Tantangan 64%", description: "1 Juta Langkah Bersama AMIKOM", href: "/challenge", kind: "Progres", keywords: "challenge langkah hadiah kompetisi", icon: Trophy },
  { label: "Komunitas & Event", description: "Ruang diskusi dan kegiatan terverifikasi", href: "/komunitas", kind: "Fitur", keywords: "komunitas event anggota diskusi leaderboard ranking", icon: UsersRound },
  { label: "Hadiah · 3.280 HP", description: "Tukar Health Points di Reward Store", href: "/reward", kind: "Progres", keywords: "reward store hp poin tukar", icon: Gift },
  { label: "AI Companion", description: "Tanyakan aktivitas, nutrisi, atau pemulihan", href: "/companion", kind: "Fitur", keywords: "nora ai chat saran reminder", icon: Sparkles },
];

export function GlobalSearch({ companionName }: { readonly companionName: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const clean = query.trim().toLocaleLowerCase("id-ID");
    if (!clean) return [];
    return SEARCH_ITEMS
      .map((item) => item.label === "AI Companion" ? { ...item, label: companionName } : item)
      .filter((item) => `${item.label} ${item.description} ${item.keywords}`.toLocaleLowerCase("id-ID").includes(clean))
      .slice(0, 6);
  }, [companionName, query]);

  function openResult(item: SearchItem) {
    setQuery("");
    setOpen(false);
    router.push(item.href);
  }

  return (
    <div className="relative min-w-0 max-w-lg flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && results[0]) openResult(results[0]);
        }}
        className="input h-10 w-full pl-9 pr-9 text-sm shadow-sm"
        placeholder="Cari fitur atau progres..."
        aria-label="Cari fitur atau progres"
        role="combobox"
        aria-controls="global-search-results"
        aria-autocomplete="list"
        aria-expanded={open && Boolean(query.trim())}
      />
      {query && <button onClick={() => { setQuery(""); setOpen(false); }} className="absolute right-2 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Hapus pencarian"><X className="h-3.5 w-3.5" /></button>}

      {open && query.trim() && (
        <div className="absolute inset-x-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-2xl border border-line bg-card p-2 shadow-2xl">
          {results.length ? (
            <div id="global-search-results" className="space-y-1" role="listbox" aria-label="Hasil pencarian">
              {results.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={`${item.kind}-${item.href}`} onClick={() => openResult(item)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-secondary" role="option" aria-selected="false">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-foreground">{item.label}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{item.description}</span></span>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">{item.kind}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-5 text-center"><p className="text-xs font-bold text-foreground">Tidak ada hasil</p><p className="mt-1 text-[10px] text-muted-foreground">Coba “aktivitas”, “pulse”, “makanan”, atau “tantangan”.</p></div>
          )}
        </div>
      )}
    </div>
  );
}
