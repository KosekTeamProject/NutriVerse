"use client";

import NextImage from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon, LoaderCircle, Lock, Sparkles, UsersRound, X } from "lucide-react";
import { useEffect, useState } from "react";

export type ProfileShowcaseMoment = {
  id: string;
  imageUrl: string;
  caption: string | null;
  privacyLevel: string;
  duringActivity: boolean;
  createdAt: string;
  community?: { id: string; name: string } | null;
};

type ProfileMomentShowcaseProps = {
  moments: ProfileShowcaseMoment[];
  loading?: boolean;
  owner?: boolean;
  hideWhenEmpty?: boolean;
};

function audienceLabel(moment: ProfileShowcaseMoment) {
  if (moment.privacyLevel === "PUBLIC") return "Publik";
  if (moment.privacyLevel === "COMMUNITY") return moment.community?.name ?? "Komunitas";
  if (moment.privacyLevel === "CIRCLE") return "Teman";
  return "Hanya Saya";
}

function AudienceIcon({ moment }: Readonly<{ moment: ProfileShowcaseMoment }>) {
  if (moment.privacyLevel === "PUBLIC") return <Sparkles className="h-3.5 w-3.5" />;
  if (moment.privacyLevel === "PRIVATE") return <Lock className="h-3.5 w-3.5" />;
  return <UsersRound className="h-3.5 w-3.5" />;
}

export function ProfileMomentShowcase({ moments, loading = false, owner = false, hideWhenEmpty = false }: Readonly<ProfileMomentShowcaseProps>) {
  const shownMoments = moments.slice(0, 6);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex === null ? null : shownMoments[selectedIndex] ?? null;

  if (hideWhenEmpty && !loading && shownMoments.length === 0) return null;

  function move(direction: -1 | 1) {
    if (selectedIndex === null || shownMoments.length < 2) return;
    setSelectedIndex((selectedIndex + direction + shownMoments.length) % shownMoments.length);
  }

  return (
    <section className="card card-pad overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-brand" />
          <div>
            <h2 className="font-display text-base font-bold">Momen yang Ditampilkan</h2>
            <p className="text-[10px] text-muted-foreground">{owner ? "Pilih dan kelola maksimal 6 foto melalui tab Momen Saya." : "Momen pilihan yang dibagikan pemilik profil."}</p>
          </div>
        </div>
        <span className="pill bg-secondary text-[10px] font-bold text-muted-foreground">{shownMoments.length}/6 momen</span>
      </div>

      {loading ? (
        <div className="grid min-h-36 place-items-center"><LoaderCircle className="h-5 w-5 animate-spin text-brand" /></div>
      ) : shownMoments.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-line p-6 text-center text-xs text-muted-foreground">{owner ? "Belum ada momen yang dipilih untuk tampil di profil." : "Pengguna ini belum menampilkan momen di profil."}</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
          {shownMoments.map((moment, index) => (
            <button key={moment.id} type="button" onClick={() => setSelectedIndex(index)} className="group relative aspect-square overflow-hidden rounded-xl bg-secondary sm:rounded-2xl" aria-label={`Buka momen ${moment.caption ?? "tanpa caption"}`}>
              {moment.imageUrl ? <NextImage src={moment.imageUrl} alt={moment.caption ?? "Momen NutriVerse"} fill unoptimized sizes="(max-width: 640px) 33vw, 240px" className="object-cover transition duration-300 group-hover:scale-105" /> : <span className="absolute inset-0 grid place-items-center text-muted-foreground"><ImageIcon className="h-7 w-7" /></span>}
              <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              <span className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur"><AudienceIcon moment={moment} /></span>
            </button>
          ))}
        </div>
      )}

      {selected && selectedIndex !== null && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Detail momen profil" onClick={() => setSelectedIndex(null)}>
          <article className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#07110d] text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelectedIndex(null)} className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur" aria-label="Tutup"><X className="h-5 w-5" /></button>
            <div className="relative min-h-[55vh] bg-black sm:min-h-[65vh]">
              {selected.imageUrl ? <NextImage src={selected.imageUrl} alt={selected.caption ?? "Momen NutriVerse"} fill unoptimized sizes="100vw" className="object-contain" /> : <span className="absolute inset-0 grid place-items-center"><ImageIcon className="h-10 w-10 text-white/50" /></span>}
              {shownMoments.length > 1 && <><button type="button" onClick={() => move(-1)} className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur" aria-label="Momen sebelumnya"><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => move(1)} className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur" aria-label="Momen berikutnya"><ChevronRight className="h-5 w-5" /></button></>}
            </div>
            <div className="border-t border-white/10 p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-white/65"><span>{new Date(selected.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span><span>·</span><span className="inline-flex items-center gap-1"><AudienceIcon moment={selected} />{audienceLabel(selected)}</span>{selected.duringActivity && <span className="rounded-full bg-brand/25 px-2 py-1 text-brand-bright">SAAT AKTIVITAS</span>}</div><p className="mt-2 text-sm font-semibold leading-relaxed">{selected.caption || "Momen sehatku"}</p></div>
          </article>
        </div>
      )}
    </section>
  );
}

export function OwnerProfileMomentShowcase() {
  const [moments, setMoments] = useState<ProfileShowcaseMoment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/moments?scope=showcase&limit=6", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => null) as { success?: boolean; moments?: ProfileShowcaseMoment[] } | null;
        if (!cancelled && response.ok && result?.success) setMoments(result.moments ?? []);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return <ProfileMomentShowcase moments={moments} loading={loading} owner />;
}
