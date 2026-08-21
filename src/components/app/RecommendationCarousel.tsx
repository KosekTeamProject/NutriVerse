"use client";

import NextImage from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, ShieldCheck, Tag, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type RecommendationSlide = {
  id: string;
  label: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  meta: string[];
  href: string;
  actionLabel: string;
};

type RecommendationCarouselProps = {
  kind: "community" | "event";
  slides: RecommendationSlide[];
  loading?: boolean;
};

const fallbackSlides: Record<RecommendationCarouselProps["kind"], RecommendationSlide> = {
  community: {
    id: "community-fallback",
    label: "Rekomendasi komunitas",
    title: "Temukan ruang untuk bertumbuh bersama.",
    description: "Komunitas yang telah disetujui Super Admin akan direkomendasikan di sini.",
    meta: ["Ruang diskusi terkontrol", "Komunitas terverifikasi"],
    href: "#community-directory",
    actionLabel: "Jelajahi komunitas",
  },
  event: {
    id: "event-fallback",
    label: "Event akan dimulai",
    title: "Kegiatan sehat dengan jadwal yang jelas.",
    description: "Event mendatang yang telah disetujui Super Admin akan direkomendasikan di sini.",
    meta: ["Jadwal resmi", "Event terverifikasi"],
    href: "#event-directory",
    actionLabel: "Lihat event tersedia",
  },
};

export function RecommendationCarousel({ kind, slides, loading = false }: Readonly<RecommendationCarouselProps>) {
  const availableSlides = slides.length > 0 ? slides : [fallbackSlides[kind]];
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const resolvedIndex = activeIndex % availableSlides.length;
  const activeSlide = availableSlides[resolvedIndex] ?? fallbackSlides[kind];
  const hasMultipleSlides = availableSlides.length > 1;

  useEffect(() => {
    if (!hasMultipleSlides || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % availableSlides.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [availableSlides.length, hasMultipleSlides, paused]);

  function move(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + availableSlides.length) % availableSlides.length);
  }

  const Icon = kind === "community" ? UsersRound : CalendarDays;

  return (
    <section
      className="relative min-h-[300px] overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-[#07563f] via-[#0b7650] to-[#8cdb3f] text-white shadow-soft"
      aria-roledescription="carousel"
      aria-label={kind === "community" ? "Rekomendasi komunitas" : "Rekomendasi event mendatang"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStartX.current === null) return;
        const distance = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(distance) >= 48 && hasMultipleSlides) move(distance < 0 ? 1 : -1);
      }}
    >
      <div className="grid min-h-[300px] sm:grid-cols-[minmax(0,1.3fr)_minmax(240px,.7fr)]">
        <div className="relative z-10 flex flex-col justify-center p-6 pb-14 sm:p-8 sm:pb-14 lg:p-10 lg:pb-14">
          <span className="pill w-fit border border-white/20 bg-black/15 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <Icon className="h-3.5 w-3.5" /> {activeSlide.label}
          </span>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight sm:text-4xl">{activeSlide.title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">{activeSlide.description}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-white/75">
            {activeSlide.meta.map((item, index) => {
              const MetaIcon = kind === "event"
                ? index === 0 ? CalendarDays : index === 1 ? MapPin : UsersRound
                : index === 0 ? Tag : index === 1 ? UsersRound : ShieldCheck;
              return <span key={`${activeSlide.id}-${item}`} className="inline-flex items-center gap-1.5"><MetaIcon className="h-3.5 w-3.5" />{item}</span>;
            })}
          </div>
          <Link href={activeSlide.href} className="btn mt-5 w-fit bg-white text-[#073b2b] hover:bg-white/90">
            {activeSlide.actionLabel}<ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative order-first min-h-48 overflow-hidden bg-black/10 sm:order-none sm:min-h-full">
          {activeSlide.imageUrl ? (
            <NextImage key={activeSlide.imageUrl} src={activeSlide.imageUrl} alt="" fill unoptimized className="object-cover" />
          ) : (
            <Icon className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 text-white/20 sm:h-48 sm:w-48" aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07563f]/65 sm:bg-gradient-to-r sm:from-[#0b7650] sm:via-transparent sm:to-transparent" />
        </div>
      </div>

      {loading && slides.length === 0 && <span className="absolute right-5 top-5 rounded-full bg-black/20 px-3 py-1 text-[10px] text-white/75 backdrop-blur">Memuat rekomendasi…</span>}

      {hasMultipleSlides && (
        <>
          <div className="absolute right-4 top-4 z-20 flex gap-2">
            <button type="button" onClick={() => move(-1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur transition hover:bg-black/40" aria-label="Rekomendasi sebelumnya">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => move(1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur transition hover:bg-black/40" aria-label="Rekomendasi berikutnya">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2" aria-label="Pilih rekomendasi">
            {availableSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full bg-white transition-all ${resolvedIndex === index ? "w-6" : "w-2 opacity-45 hover:opacity-75"}`}
                aria-label={`Tampilkan rekomendasi ${index + 1}: ${slide.title}`}
                aria-current={resolvedIndex === index ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
