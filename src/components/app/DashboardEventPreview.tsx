"use client";

import { useEffect, useState } from "react";
import { RecommendationCarousel, type RecommendationSlide } from "@/components/app/RecommendationCarousel";

type EventItem = {
  id: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  startDate: string;
  location: string | null;
  capacity: number;
  _count: { registrations: number };
};

export function DashboardEventPreview({ compact = false }: { compact?: boolean }) {
  const [slides, setSlides] = useState<RecommendationSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let active = true;
    void fetch("/api/events?scope=featured&limit=5", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => null) as { success?: boolean; events?: EventItem[] } | null;
        if (!active || !response.ok || !result?.success) return;
        setSlides((result.events ?? []).map((event) => ({
          id: event.id,
          label: "Event mendatang",
          title: event.title,
          description: event.description,
          imageUrl: event.bannerUrl,
          meta: [
            new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(event.startDate)),
            event.location ?? "Lokasi menyusul",
            `${event._count.registrations} / ${event.capacity} peserta`,
          ],
          href: `/komunitas/event/${event.id}`,
          actionLabel: "Lihat detail event",
        })));
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!compact || slides.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % slides.length), 1000);
    return () => window.clearInterval(timer);
  }, [compact, slides.length]);

  if (compact) {
    const event = slides[activeIndex % Math.max(slides.length, 1)];
    return <a href={event?.href ?? "/komunitas"} className="group relative block h-56 overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-[#07563f] via-brand to-lime shadow-soft" aria-label={event ? `Buka event ${event.title}` : "Lihat event"}>
      {event?.imageUrl && <img src={event.imageUrl} alt={event.title} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <div className="absolute inset-x-4 bottom-4 text-white"><p className="text-[9px] font-bold uppercase tracking-wider text-white/80">Event mendatang</p><h2 className="mt-1 line-clamp-2 text-xl font-extrabold">{event?.title ?? "Event sehat segera hadir"}</h2><p className="mt-1 line-clamp-1 text-xs text-white/80">{event?.meta[1] ?? "Event terverifikasi"}</p></div>
    </a>;
  }
  return <RecommendationCarousel kind="event" slides={slides} loading={loading} />;
}

