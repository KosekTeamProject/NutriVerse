"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  Heart, HeartPulse, MessageCircle, Footprints, Flame, MessageSquarePlus, Users2, Check, Lock,
  CalendarDays, Clock3, Gift, MapPin, Megaphone, Palette, RefreshCw, Share2, Trophy, Target, TrendingUp,
  Download, Droplets, ImagePlus, Trash2, ChevronDown, ChevronLeft, ChevronRight
} from "lucide-react";
import { type Post } from "@/lib/community";
import { LeaderboardView } from "@/components/app/LeaderboardView";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { NutriVerseMoments } from "@/components/app/NutriVerseMoments";
import type { CommunityOverview } from "@/features/progress/types";
import { notifyDataChanged } from "@/lib/data-sync";
import { useProgressData } from "@/providers/ProgressDataProvider";
import { useAuthSession } from "@/hooks/useAuthSession";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const KIND_ICON = { 
  activity: Footprints, 
  consistency: Flame, 
  reflection: MessageSquarePlus 
};

const KIND_STYLE = {
  activity: "bg-brand-soft text-brand border-brand/20",
  consistency: "bg-amber/15 text-amber border-amber/20",
  reflection: "bg-sky/15 text-sky border-sky/20",
};

function PostCard({ p, onCommentAdded }: { readonly p: Post; readonly onCommentAdded?: () => void }) {
  const session = useAuthSession();
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session?.username && p.reactionList) {
      setLiked(p.reactionList.includes(session.username));
    }
  }, [session?.username, p.reactionList]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/community/feed/${p.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: session?.username,
          text: commentText,
        })
      });
      setCommentText("");
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const Icon = KIND_ICON[p.kind] ?? Footprints;
  const statusColors = p.trustLevel === "verified"
    ? "bg-brand-soft text-brand border-brand/20"
    : "bg-secondary text-muted-foreground border-line";
  const trustLabel = p.trustLevel === "verified" ? "Terverifikasi" : "Catatan Mandiri";

  return (
    <div className="card card-pad min-w-0 space-y-4 border-line bg-card">
      <div className="flex min-w-0 flex-wrap items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-sm font-bold text-white shadow-sm">
          {initials(p.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-bold text-foreground truncate">{p.name}</p>
            {p.trustLevel && (
              <span className={`pill text-[8px] font-bold uppercase ${statusColors}`}>
                {trustLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{p.time}</p>
        </div>
        <span className={`pill max-w-full whitespace-normal break-words text-[10px] font-bold uppercase ${KIND_STYLE[p.kind]}`}>
          <Icon className="h-3.5 w-3.5" /> {p.detail}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {p.text}
      </p>

      <div className="flex min-w-0 flex-col items-start gap-1 border-t border-line/45 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <button
          onClick={async () => {
            setLiked((v) => !v);
            try {
              await fetch(`/api/community/feed/${p.id}/reaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: session?.username })
              });
              if (onCommentAdded) onCommentAdded();
            } catch (error) {
              console.error(error);
              setLiked((v) => !v); // revert on error
            }
          }}
          className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1.5 text-left text-xs font-bold transition sm:px-3 ${liked ? "bg-brand-soft text-brand shadow-sm" : "text-muted-foreground hover:bg-secondary"}`}
          aria-label="Beri semangat pada kiriman"
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} /> Beri Semangat &middot; {
            p.encourages + (liked && !(p.reactionList?.includes(session?.username ?? "")) ? 1 : (!liked && (p.reactionList?.includes(session?.username ?? "")) ? -1 : 0))
          }
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1.5 text-left text-xs font-bold transition sm:px-3 ${showComments ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"}`}
          aria-label="Lihat komentar dukungan"
        >
          <MessageCircle className="h-3.5 w-3.5" /> Komentar Dukungan &middot; {p.comments}
        </button>
      </div>

      {showComments && (
        <div className="mt-2 border-t border-line/45 pt-4">
          <div className="max-h-[14rem] overflow-y-auto overscroll-contain pr-2 space-y-3 custom-scrollbar">
            {p.commentList && p.commentList.length > 0 ? p.commentList.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
                  {initials(c.userName)}
                </div>
                <div className="flex-1 min-w-0 rounded-2xl rounded-tl-none bg-secondary/50 p-2.5">
                  <p className="text-[11px] font-bold text-foreground">{c.userName}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {c.text}
                  </p>
                </div>
              </div>
            )) : null}
            {p.comments === 0 && (
              <p className="text-[11px] text-muted-foreground italic text-center py-4">Jadilah yang pertama memberi dukungan.</p>
            )}
          </div>
          <form onSubmit={submitComment} className="mt-3 relative">
            <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isSubmitting}
              placeholder={isSubmitting ? "Mengirim..." : "Tambahkan dukungan (Enter untuk mengirim)..."} 
              className="w-full rounded-xl border border-line bg-secondary/30 px-3 py-2 text-[11px] text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 disabled:opacity-50" 
            />
          </form>
        </div>
      )}
    </div>
  );
}

const EVENT_THEMES = [
  { background: "linear-gradient(120deg,#073b2b 0%,#0b6642 52%,#082b22 100%)", accent: "#b8ef57" },
  { background: "linear-gradient(120deg,#10243e 0%,#174e70 52%,#0b2734 100%)", accent: "#67e8f9" },
  { background: "linear-gradient(120deg,#312e4f 0%,#5b3f83 50%,#172554 100%)", accent: "#c4b5fd" },
] as const;

function EventCarousel({
  location,
  sourceEvents,
  onChanged,
}: {
  readonly location: string;
  readonly sourceEvents: CommunityOverview["events"];
  readonly onChanged: () => Promise<void>;
}) {
  const filteredEvents =
    location === "Semua Area"
      ? sourceEvents
      : sourceEvents.filter((event) => event.location === location);
  const events = filteredEvents;
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [joinedIds, setJoinedIds] = useState<ReadonlySet<string>>(
    new Set(events.filter((event) => event.isJoined).map((event) => event.id)),
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<number | null>(null);
  const autoplayDirectionRef = useRef<1 | -1>(1);
  const eventCount = events.length;
  const paused = hovered || focused || dragging;

  useEffect(() => {
    if (paused || eventCount < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      setActiveIndex((index) => {
        if (index >= eventCount - 1) autoplayDirectionRef.current = -1;
        if (index <= 0) autoplayDirectionRef.current = 1;
        return index + autoplayDirectionRef.current;
      });
    }, 5600);
    return () => window.clearInterval(interval);
  }, [eventCount, paused]);

  async function joinEvent(eventId: string) {
    const response = await fetch(`/api/events/${eventId}/registration`, {
      method: "POST",
    });
    if (!response.ok) return;
    setJoinedIds((currentIds) => new Set(currentIds).add(eventId));
    notifyDataChanged();
    await onChanged();
  }

  function showSlide(index: number) {
    setActiveIndex(Math.max(0, Math.min(eventCount - 1, index)));
    setDragOffset(0);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a, input")) return;
    dragStartRef.current = event.clientX;
    setDragging(true);
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartRef.current === null) return;
    setDragOffset(event.clientX - dragStartRef.current);
  }

  function finishDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartRef.current === null) return;
    const threshold = Math.min(86, (viewportRef.current?.clientWidth ?? 360) * 0.18);
    const distance = event.clientX - dragStartRef.current;
    if (distance <= -threshold) showSlide(activeIndex + 1);
    else if (distance >= threshold) showSlide(activeIndex - 1);
    else setDragOffset(0);
    dragStartRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  if (events.length === 0) {
    return (
      <section className="card card-pad grid min-h-56 place-items-center text-center">
        <div>
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-bold">Belum ada event aktif</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Event yang diterbitkan admin akan muncul otomatis di sini.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[#073b2b] text-white shadow-soft"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      aria-roledescription="carousel"
      aria-label="Event komunitas NutriVerse"
    >
      <div
        ref={viewportRef}
        className="touch-pan-y select-none overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div
          className={`flex items-stretch ${dragging ? "transition-none" : "transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]"}`}
          style={{ transform: `translate3d(calc(${-activeIndex * 100}% + ${dragOffset}px),0,0)` }}
        >
          {events.map((event, index) => {
            const progress =
              event.capacity > 0
                ? Math.min(
                    100,
                    Math.round((event.participants / event.capacity) * 100),
                  )
                : 0;
            const joined = joinedIds.has(event.id);
            const eventDate = new Date(event.startDate);
            const theme = EVENT_THEMES[index % EVENT_THEMES.length];
            const date = new Intl.DateTimeFormat("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(eventDate);
            const day = new Intl.DateTimeFormat("id-ID", {
              weekday: "long",
            }).format(eventDate);
            const time = `${new Intl.DateTimeFormat("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(eventDate)} WIB`;
            return (
              <article
                key={event.id}
                className="relative w-full shrink-0 overflow-hidden p-5 pb-20 sm:p-7 sm:pb-24"
                style={{
                  backgroundImage: event.bannerUrl
                    ? `linear-gradient(120deg,rgba(3,25,18,.88),rgba(3,25,18,.35)),url(${event.bannerUrl})`
                    : theme.background,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                aria-hidden={index !== activeIndex}
              >
                <div aria-hidden className="absolute -right-12 -top-14 h-48 w-48 rounded-full opacity-25 blur-3xl" style={{ backgroundColor: theme.accent }} />
                <div aria-hidden className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.12),transparent_68%)]" />
                <div aria-hidden className="absolute bottom-0 right-0 h-32 w-1/2 bg-gradient-to-t from-black/25 to-transparent" />
                <div className="relative z-10 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill border border-white/15 bg-white/10 text-[10px] font-bold text-white"><Megaphone className="h-3.5 w-3.5" /> EVENT KOMUNITAS</span>
                    <span className="pill border border-white/20 bg-black/15 text-[10px] font-bold" style={{ color: theme.accent }}>+{event.bonusHp} HP</span>
                  </div>
                  <h2 className="mt-5 text-balance font-display text-2xl font-extrabold tracking-tight sm:text-4xl">{event.title}</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-white/80 sm:text-sm"><MapPin className="h-4 w-4" style={{ color: theme.accent }} /> {event.location ?? "Lokasi menyusul"}</p>
                  <div className="mt-5 grid gap-3 min-[420px]:grid-cols-2 sm:grid-cols-4">
                    {[
                      { icon: CalendarDays, value: date, label: day },
                      { icon: Clock3, value: time, label: "Mulai" },
                      { icon: Users2, value: `${event.participants} peserta`, label: "Sudah bergabung" },
                      { icon: Gift, value: `+${event.bonusXp} XP`, label: "Bonus setelah validasi" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return <div key={item.value} className="flex items-start gap-2"><Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: theme.accent }} /><div><p className="text-xs font-bold sm:text-sm">{item.value}</p><p className="text-[10px] text-white/60">{item.label}</p></div></div>;
                    })}
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-[10px] text-white/70"><span>{event.participants} / {event.capacity} peserta</span><span>{progress}%</span></div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: theme.accent }} /></div>
                    </div>
                    <button onClick={() => joinEvent(event.id)} className={`btn shrink-0 ${joined ? "bg-white/15 text-white" : "bg-white text-[#073b2b]"}`} tabIndex={index === activeIndex ? 0 : -1}>
                      {joined ? <><Check className="h-4 w-4" /> Sudah Bergabung</> : "Gabung Event"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {eventCount > 1 && <div className="absolute inset-x-5 bottom-4 z-20 flex items-center justify-between gap-3 border-t border-white/10 pt-4 sm:inset-x-7 sm:bottom-5">
        <div className="flex items-center gap-1.5" aria-label={`Event ${activeIndex + 1} dari ${eventCount}`}>
          {events.map((event, index) => <button key={event.id} onClick={() => showSlide(index)} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-7 bg-white" : "w-2 bg-white/35 hover:bg-white/60"}`} aria-label={`Tampilkan ${event.title}`} aria-current={index === activeIndex ? "true" : undefined} />)}
        </div>
        <div className="flex gap-2">
          <button onClick={() => showSlide(activeIndex > 0 ? activeIndex - 1 : eventCount - 1)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20" aria-label="Event sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => showSlide(activeIndex < eventCount - 1 ? activeIndex + 1 : 0)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20" aria-label="Event berikutnya"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>}
      <p className="sr-only" aria-live="polite">Event aktif: {events[activeIndex]?.title}</p>
    </section>
  );
}

const SHARE_TEMPLATES = [
  { name: "Energi Hijau", background: "from-[#073c2c] via-[#137b5a] to-[#b9e34b]", accent: "#b9e34b", colors: ["#073c2c", "#7fbf41"] },
  { name: "Langit Pagi", background: "from-[#174a70] via-[#2d8da0] to-[#efb265]", accent: "#76d6d9", colors: ["#174a70", "#efb265"] },
  { name: "Malam Kompetitif", background: "from-[#101629] via-[#302a72] to-[#128b73]", accent: "#4de0b6", colors: ["#101629", "#128b73"] },
] as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SHARE_CONTENTS = [
  { label: "Health Pulse", top: "PULSE 78", metric: "+1,2", headline: ["Naik", "Health", "Point"], caption: "Health Pulse-ku naik +1,2 poin hari ini. Pelan-pelan, konsisten, dan tetap dengarkan tubuh. #NutriVerse" },
  { label: "Aktivitas", top: "1,4 KM", metric: "1,4 KM", headline: ["Morning", "Walk", "Tuntas"], caption: "Jalan pagi 1,4 km selesai dan terverifikasi GPS. Satu langkah sehat untuk hari ini. #NutriVerse" },
  { label: "Pencapaian", top: "STREAK 7", metric: "7 HARI", headline: ["Streak", "Sehat", "Terjaga"], caption: "Tujuh hari menjaga kebiasaan sehat. Bukan harus sempurna—yang penting terus kembali. #NutriVerse" },
  { label: "Peringkat", top: "RANK #3", metric: "#3", headline: ["Naik", "Peringkat", "Liga"], caption: "Naik dua posisi di Liga Radiant! Kompetitif boleh, tetapi kesehatan dan pemulihan tetap utama. #NutriVerse" },
] as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SHARE_INSIGHTS = [
  { icon: "pulse", title: "Health Pulse\nHari Ini", detail: "Health Pulse meningkat +1,2 poin berkat konsistensi aktivitas dan kebiasaan sehat." },
  { icon: "activity", title: "Aktivitas\nHari Ini", detail: "Morning Walk sejauh 1,4 km selesai dan tervalidasi GPS." },
  { icon: "hydration", title: "Hidrasi\nHari Ini", detail: "Asupan air memenuhi sebagian besar target dan mendukung pemulihan tubuh." },
] as const;

function loadLocalImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

async function loadBrandWatermark() {
  return loadLocalImage("/brand/nutriverse-app-icon-200.png");
}

function drawImageCover(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) {
  const words = text.split(" ");
  let line = "";
  let lineIndex = 0;
  for (const word of words) {
    const testLine = `${line}${word} `;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line.trim(), x, y + lineIndex * lineHeight);
      line = `${word} `;
      lineIndex += 1;
      if (lineIndex >= maxLines - 1) break;
    } else line = testLine;
  }
  context.fillText(line.trim(), x, y + lineIndex * lineHeight);
}

function drawPosterLineIcon(context: CanvasRenderingContext2D, kind: string, x: number, y: number, size: number) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = "#ffffff";
  context.fillStyle = "transparent";
  context.lineWidth = Math.max(3, size * 0.055);
  context.lineCap = "round";
  context.lineJoin = "round";
  if (kind === "pulse") {
    context.beginPath();
    context.arc(size * 0.5, size * 0.5, size * 0.38, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(size * 0.14, size * 0.53);
    context.lineTo(size * 0.32, size * 0.53);
    context.lineTo(size * 0.42, size * 0.3);
    context.lineTo(size * 0.56, size * 0.7);
    context.lineTo(size * 0.67, size * 0.45);
    context.lineTo(size * 0.86, size * 0.45);
    context.stroke();
  } else if (kind === "activity") {
    context.beginPath();
    context.ellipse(size * 0.37, size * 0.58, size * 0.16, size * 0.28, -0.28, 0, Math.PI * 2);
    context.ellipse(size * 0.68, size * 0.4, size * 0.14, size * 0.24, -0.28, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(size * 0.25, size * 0.23, size * 0.06, 0, Math.PI * 2);
    context.arc(size * 0.39, size * 0.16, size * 0.055, 0, Math.PI * 2);
    context.arc(size * 0.75, size * 0.12, size * 0.055, 0, Math.PI * 2);
    context.stroke();
  } else {
    context.beginPath();
    context.moveTo(size * 0.5, size * 0.08);
    context.bezierCurveTo(size * 0.24, size * 0.4, size * 0.18, size * 0.58, size * 0.22, size * 0.7);
    context.bezierCurveTo(size * 0.3, size * 0.94, size * 0.7, size * 0.94, size * 0.78, size * 0.7);
    context.bezierCurveTo(size * 0.82, size * 0.58, size * 0.76, size * 0.4, size * 0.5, size * 0.08);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.arc(size * 0.5, size * 0.65, size * 0.15, 0.2, Math.PI - 0.2);
    context.stroke();
  }
  context.restore();
}

function ShareTemplateStudio() {
  const { overview } = useProgressData();
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [contentIndex, setContentIndex] = useState(0);
  const [caption, setCaption] = useState<string>("Progres sehatku hari ini tercatat di NutriVerse. #NutriVerse");
  const [shared, setShared] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [backgroundPhoto, setBackgroundPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [format, setFormat] = useState<"story" | "post">("story");
  const [exportMode, setExportMode] = useState<"transparent" | "ready">("transparent");
  const template = SHARE_TEMPLATES[templateIndex];
  const pulse = overview?.healthPulse.current;
  const dynamicContents = [
    { label: "Health Pulse", top: `PULSE ${pulse?.score.toFixed(0) ?? 0}`, metric: `${(pulse?.change ?? 0) >= 0 ? "+" : ""}${pulse?.change.toFixed(1) ?? "0.0"}`, headline: ["Health", "Pulse", "Hari Ini"], caption: `Health Pulse-ku ${pulse?.score.toFixed(1) ?? "0.0"} hari ini. #NutriVerse` },
    { label: "Aktivitas", top: `${overview?.daily.walkingDistance.value ?? 0} KM`, metric: `${overview?.daily.walkingDistance.value ?? 0} KM`, headline: ["Gerak", "Hari Ini", "Tercatat"], caption: `Aktivitas jalan ${overview?.daily.walkingDistance.value ?? 0} km tercatat dari GPS terverifikasi. #NutriVerse` },
    { label: "Pencapaian", top: `STREAK ${overview?.economy.streakDays ?? 0}`, metric: `${overview?.economy.streakDays ?? 0} HARI`, headline: ["Streak", "Sehat", "Terjaga"], caption: `${overview?.economy.streakDays ?? 0} hari menjaga kebiasaan sehat. #NutriVerse` },
    { label: "Progres", top: `${overview?.todayJourney.progressPercent ?? 0}%`, metric: `${overview?.todayJourney.progressPercent ?? 0}%`, headline: ["Target", "Harian", "Berjalan"], caption: `Progres target harianku ${overview?.todayJourney.progressPercent ?? 0}%. #NutriVerse` },
  ];
  const dynamicInsights = [
    { icon: "pulse", title: "Health Pulse\nHari Ini", detail: `Skor ${pulse?.score.toFixed(1) ?? "0.0"} dengan kelengkapan ${pulse?.dataCompleteness ?? 0}%.` },
    { icon: "activity", title: "Aktivitas\nHari Ini", detail: `${Math.round(overview?.daily.steps.value ?? 0).toLocaleString("id-ID")} langkah dan ${overview?.daily.activeMinutes.value ?? 0} menit aktif.` },
    { icon: "hydration", title: "Hidrasi\nHari Ini", detail: `${Math.round(overview?.daily.water.value ?? 0).toLocaleString("id-ID")} ml dari target ${Math.round(overview?.daily.water.target ?? 0).toLocaleString("id-ID")} ml.` },
  ];
  const content = dynamicContents[contentIndex];

  function chooseBackground(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBackgroundPhoto(reader.result);
        setPhotoName(file.name);
      }
    };
    reader.readAsDataURL(file);
  }

  async function renderPosterPng() {
    const width = 1080;
    const height = format === "story" ? 1920 : 1350;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.clearRect(0, 0, width, height);
    if (exportMode === "ready") {
      if (backgroundPhoto) {
        const image = await loadLocalImage(backgroundPhoto);
        drawImageCover(context, image, width, height);
      } else {
        const gradient = context.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, template.colors[0]);
        gradient.addColorStop(1, template.colors[1]);
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
      }
    }

    const overlay = context.createLinearGradient(0, height * 0.18, 0, height);
    overlay.addColorStop(0, "rgba(3, 13, 10, 0)");
    overlay.addColorStop(format === "story" ? 0.48 : 0.35, "rgba(3, 13, 10, 0.08)");
    overlay.addColorStop(0.68, "rgba(3, 13, 10, 0.58)");
    overlay.addColorStop(1, "rgba(3, 13, 10, 0.94)");
    context.fillStyle = overlay;
    context.fillRect(0, 0, width, height);

    const side = format === "story" ? 72 : 62;
    const watermarkImage = await loadBrandWatermark();
    const logoSize = format === "story" ? 116 : 96;
    context.drawImage(watermarkImage, side, side, logoSize, logoSize);

    const headlineY = format === "story" ? 900 : 500;
    context.fillStyle = "#ffffff";
    context.shadowColor = "rgba(0,0,0,.45)";
    context.shadowBlur = 12;
    context.font = `300 ${format === "story" ? 120 : 88}px Arial`;
    context.textAlign = "left";
    context.fillText(content.metric, side, headlineY + (format === "story" ? 150 : 110));
    context.font = `900 ${format === "story" ? 112 : 82}px "Arial Black", Arial`;
    context.textAlign = "right";
    const headlineX = width - side;
    const headlineLine = format === "story" ? 108 : 78;
    content.headline.forEach((line, index) => context.fillText(line, headlineX, headlineY + index * headlineLine));
    context.shadowBlur = 0;

    const insightTop = format === "story" ? 1395 : 905;
    const insightGap = format === "story" ? 26 : 18;
    const insightWidth = (width - side * 2 - insightGap * 2) / 3;
    dynamicInsights.forEach((insight, index) => {
      const x = side + index * (insightWidth + insightGap);
      drawPosterLineIcon(context, insight.icon, x, insightTop, format === "story" ? 84 : 62);
      context.fillStyle = "#ffffff";
      context.textAlign = "left";
      context.font = `900 ${format === "story" ? 36 : 28}px "Arial Black", Arial`;
      insight.title.split("\n").forEach((line, lineIndex) => context.fillText(line, x, insightTop + (format === "story" ? 132 : 98) + lineIndex * (format === "story" ? 39 : 30)));
      context.fillStyle = "rgba(255,255,255,.9)";
      context.font = `500 ${format === "story" ? 24 : 18}px Arial`;
      drawWrappedText(context, insight.detail, x, insightTop + (format === "story" ? 238 : 174), insightWidth, format === "story" ? 31 : 24, format === "story" ? 5 : 4);
    });

    context.fillStyle = "rgba(255,255,255,.14)";
    context.fillRect(side, height - 82, width - side * 2, 2);
    context.fillStyle = "rgba(255,255,255,.82)";
    context.textAlign = "left";
    context.font = "700 18px Arial";
    context.fillText("NUTRIVERSE • PROGRES TANPA DATA PRIVAT", side, height - 42);

    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
  }

  async function downloadPng() {
    const pngBlob = await renderPosterPng();
    if (!pngBlob) return;
    const downloadUrl = URL.createObjectURL(pngBlob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `nutriverse-${content.label.toLowerCase().replaceAll(" ", "-")}-${exportMode}-${format}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 1800);
  }

  async function shareProgress() {
    const text = caption.trim() || content.caption;
    try {
      const pngBlob = await renderPosterPng();
      const file = pngBlob ? new File([pngBlob], `nutriverse-${format}.png`, { type: "image/png" }) : null;
      if (file && navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ title: "Progres NutriVerse", text, files: [file] });
      else if (navigator.share) await navigator.share({ title: "Progres NutriVerse", text });
      else await navigator.clipboard.writeText(text);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // Pengguna dapat membatalkan dialog berbagi tanpa dianggap sebagai kesalahan.
    }
  }

  if (!isStudioOpen) {
    return (
      <section className="card card-pad border-line bg-card flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="pill bg-brand-soft text-[9px] font-bold text-brand"><Share2 className="h-3.5 w-3.5" /> TEMPLATE MEDIA SOSIAL</span>
            <span className="pill border border-brand/15 bg-card text-[9px] font-bold text-brand"><Lock className="h-3.5 w-3.5" /> PRIVAT</span>
          </div>
          <h2 className="mt-3 font-display text-lg font-extrabold text-foreground">Studio berbagi progres NutriVerse</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">Buat visual siap Story atau Post tanpa membagikan data spesifik dan catatan pribadi.</p>
        </div>
        <button onClick={() => setIsStudioOpen(true)} className="btn btn-primary sm:w-auto shrink-0 w-full text-xs shadow-sm">
          Buka Studio
        </button>
      </section>
    );
  }

  return (
    <section className="card min-w-0 overflow-hidden border-brand/15 bg-card">
      <header className="flex flex-col gap-3 border-b border-line/55 bg-gradient-to-r from-card via-card to-brand-soft/30 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="min-w-0">
          <span className="pill bg-brand-soft text-[9px] font-bold text-brand"><Share2 className="h-3.5 w-3.5" /> TEMPLATE MEDIA SOSIAL</span>
          <h2 className="mt-2 font-display text-lg font-extrabold text-foreground sm:text-xl">Studio berbagi progres NutriVerse</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">Buat visual siap Story atau Post tanpa membagikan rute, lokasi presisi, jurnal, maupun catatan makanan.</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <span className="pill w-fit border border-brand/15 bg-card text-[9px] font-bold text-brand"><Lock className="h-3.5 w-3.5" /> DATA PRIVAT TERLINDUNGI</span>
          <button onClick={() => setIsStudioOpen(false)} className="btn bg-card text-foreground hover:bg-secondary text-xs w-full sm:w-auto border border-line shadow-sm">Tutup Studio</button>
        </div>
      </header>

      <div className="grid min-w-0 gap-5 p-4 sm:p-6 min-[1600px]:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] min-[1600px]:items-start">
        <div className="rounded-[1.75rem] border border-line bg-secondary/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Pratinjau</p><p className="mt-0.5 text-xs font-bold text-foreground">{template.name} · {format === "story" ? "Story 9:16" : "Post 4:5"}</p></div>
            <span className="rounded-full bg-card px-2 py-1 text-[8px] font-bold text-brand shadow-sm">{exportMode === "transparent" ? "OVERLAY PNG" : "SIAP UNGGAH"}</span>
          </div>

          <div className="mt-4 flex min-h-[440px] items-center justify-center overflow-hidden rounded-3xl border border-line/70 bg-card p-3 sm:min-h-[520px]">
            <div
              className={`relative overflow-hidden rounded-[1.7rem] text-white shadow-2xl transition-all duration-300 ${format === "story" ? "aspect-[9/16] w-[250px]" : "aspect-[4/5] w-[300px]"} ${exportMode === "ready" ? `bg-gradient-to-br ${template.background}` : "border border-line/70"}`}
              style={exportMode === "transparent" ? { backgroundColor: "#f8faf8", backgroundImage: "linear-gradient(45deg,#e5ebe6 25%,transparent 25%),linear-gradient(-45deg,#e5ebe6 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5ebe6 75%),linear-gradient(-45deg,transparent 75%,#e5ebe6 75%)", backgroundPosition: "0 0,0 10px,10px -10px,-10px 0", backgroundSize: "20px 20px" } : backgroundPhoto ? { backgroundImage: `linear-gradient(to bottom,rgba(2,18,13,.02),rgba(2,18,13,.22),rgba(2,18,13,.94)),url(${backgroundPhoto})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#03140d]/5 to-[#020b08]/95" />
              {exportMode === "ready" && !backgroundPhoto && <><div className="absolute -right-16 top-16 h-44 w-44 rounded-full bg-white/15 blur-3xl" /><div className="absolute bottom-[28%] left-1/2 h-52 w-24 -translate-x-1/2 rounded-full bg-black/20 blur-2xl" /></>}
              <div className="absolute left-4 top-4 z-10 drop-shadow-lg">
                <BrandLogo compact className="h-10 w-10 rounded-[28%]" />
              </div>
              <div className={`absolute inset-x-4 z-10 flex items-end justify-between gap-3 ${format === "story" ? "top-[43%]" : "top-[36%]"}`}>
                <p className={`shrink-0 font-sans font-light tracking-[-0.07em] text-white drop-shadow-lg ${format === "story" ? "text-[32px]" : "text-[29px]"}`}>{content.metric}</p>
                <p className={`text-right font-display font-black leading-[0.78] tracking-[-0.075em] text-white drop-shadow-xl ${format === "story" ? "text-[34px]" : "text-[31px]"}`}>
                  {content.headline.map((line) => <span key={line} className="block">{line}</span>)}
                </p>
              </div>
              <div className={`absolute inset-x-4 bottom-4 z-10 grid grid-cols-3 gap-2 border-b border-white/15 pb-5 ${format === "story" ? "pt-3" : "pt-2"}`}>
                {dynamicInsights.map((insight) => {
                  const InsightIcon = insight.icon === "pulse" ? HeartPulse : insight.icon === "activity" ? Footprints : Droplets;
                  return (
                    <div key={insight.title} className="min-w-0 text-left">
                      <InsightIcon className="h-6 w-6 text-white" strokeWidth={1.5} />
                      <p className={`mt-2 whitespace-pre-line font-display font-extrabold leading-[0.94] text-white ${format === "story" ? "text-[9px]" : "text-[10px]"}`}>{insight.title}</p>
                      <p className={`mt-2 line-clamp-4 leading-[1.2] text-white/80 ${format === "story" ? "text-[6px]" : "text-[7px]"}`}>{insight.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Pilihan tema template">
            {SHARE_TEMPLATES.map((item, index) => <button key={item.name} onClick={() => setTemplateIndex(index)} className={`rounded-xl border p-2 text-left transition ${templateIndex === index ? "border-brand bg-brand-soft/55 shadow-sm" : "border-line bg-card hover:border-brand/30"}`}><span className={`block h-7 rounded-lg bg-gradient-to-r ${item.background}`} /><span className="mt-1.5 block truncate text-[8px] font-bold text-foreground">{item.name}</span></button>)}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <p className="label">Pilih progres yang dibagikan</p>
            <div className="mt-2 flex max-w-full gap-2 overflow-x-auto pb-1">{dynamicContents.map((item, index) => <button key={item.label} onClick={() => { setContentIndex(index); setCaption(item.caption); }} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-bold transition ${contentIndex === index ? "bg-brand text-white shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{item.label}</button>)}</div>
          </div>

          <section className="rounded-2xl border border-line bg-secondary/20 p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-extrabold text-foreground">Atur hasil gambar</p><p className="mt-0.5 text-[10px] text-muted-foreground">Sesuaikan mode file, ukuran, dan latar.</p></div><Palette className="h-5 w-5 text-brand" /></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="label">Jenis hasil</p><div className="mt-2 grid grid-cols-2 rounded-xl bg-secondary p-1"><button onClick={() => setExportMode("transparent")} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${exportMode === "transparent" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>PNG Transparan</button><button onClick={() => setExportMode("ready")} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${exportMode === "ready" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>Siap Unggah</button></div></div>
              <div><p className="label">Ukuran</p><div className="mt-2 grid grid-cols-2 rounded-xl bg-secondary p-1"><button onClick={() => setFormat("story")} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${format === "story" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>Story 9:16</button><button onClick={() => setFormat("post")} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${format === "post" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>Post 4:5</button></div></div>
            </div>
            <div className="mt-4 rounded-xl border border-line/70 bg-card p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold text-foreground">Foto latar</p><p className="text-[9px] text-muted-foreground">{exportMode === "transparent" ? "Tidak disertakan dalam mode overlay transparan." : "Opsional—jika kosong, warna tema digunakan."}</p></div><div className="flex min-w-0 gap-2"><label className={`btn btn-outline btn-sm min-w-0 cursor-pointer ${exportMode === "transparent" ? "pointer-events-none opacity-50" : ""}`}><ImagePlus className="h-4 w-4" /><span className="max-w-32 truncate">{photoName || "Pilih Foto"}</span><input type="file" accept="image/*" onChange={chooseBackground} disabled={exportMode === "transparent"} className="sr-only" aria-label="Pilih foto latar template" /></label>{backgroundPhoto && exportMode === "ready" && <button onClick={() => { setBackgroundPhoto(null); setPhotoName(""); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-muted-foreground hover:text-destructive" aria-label="Hapus foto latar"><Trash2 className="h-4 w-4" /></button>}</div></div>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{exportMode === "transparent" ? "File hanya berisi elemen desain dan watermark NutriVerse; background tetap transparan." : "Foto atau warna tema digabung dengan overlay menjadi satu PNG siap dibagikan."}</p>
          </section>

          <section className="rounded-2xl border border-line bg-card p-4">
            <div className="flex items-center justify-between gap-3"><label htmlFor="share-caption" className="label">Caption media sosial</label><button onClick={() => setCaption(content.caption)} className="text-[10px] font-bold text-brand hover:underline">Gunakan caption awal</button></div>
            <textarea id="share-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={280} rows={3} className="input mt-2 min-h-24 resize-y py-2.5 text-xs leading-relaxed" placeholder="Tulis caption yang ingin dibagikan…" />
            <p className="mt-1 text-right text-[9px] text-muted-foreground">{caption.length}/280 karakter</p>
          </section>

          <div className="grid gap-2 sm:grid-cols-3">
            <button onClick={() => setTemplateIndex((current) => (current + 1) % SHARE_TEMPLATES.length)} className="btn btn-outline"><RefreshCw className="h-4 w-4" /> Tema Berikutnya</button>
            <button onClick={downloadPng} className="btn btn-primary"><Download className="h-4 w-4" /> {downloaded ? "PNG Terunduh" : "Download PNG"}</button>
            <button onClick={shareProgress} className="btn btn-outline"><Share2 className="h-4 w-4" /> {shared ? "Berhasil Dibagikan" : "Bagikan PNG"}</button>
          </div>
          <p className="flex items-start gap-1.5 text-[9px] leading-relaxed text-muted-foreground"><Palette className="mt-0.5 h-3.5 w-3.5 shrink-0" /> PNG dibuat langsung di perangkat dengan identitas merek dari <span className="font-mono">/public/brand</span>.</p>
        </div>
      </div>
    </section>
  );
}

export function CommunityHub() {
  const [activeTab, setActiveTab] = useState<"community" | "ranking">("community");
  useEffect(() => {
    const syncTabFromHash = () => setActiveTab(window.location.hash === "#peringkat" ? "ranking" : "community");
    const timer = window.setTimeout(syncTabFromHash, 0);
    window.addEventListener("hashchange", syncTabFromHash);
    return () => { window.clearTimeout(timer); window.removeEventListener("hashchange", syncTabFromHash); };
  }, []);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 rounded-2xl bg-secondary p-1 sm:inline-grid sm:min-w-80">
        <button onClick={() => setActiveTab("community")} className={`rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === "community" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>Komunitas</button>
        <button onClick={() => setActiveTab("ranking")} className={`rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === "ranking" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>Peringkat</button>
      </div>
      {activeTab === "community" ? <CommunityFeed /> : <LeaderboardView />}
    </div>
  );
}

export function CommunityFeed() {
  const session = useAuthSession();
  const [location, setLocation] = useState("Semua Area");
  const [overview, setOverview] = useState<CommunityOverview | null>(null);
  const [leaders, setLeaders] = useState<
    Array<{
      id: string;
      name: string;
      economy: { totalXp: number } | null;
    }>
  >([]);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [postText, setPostText] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/community/feed");
      const data = await res.json();
      if (data.success && data.posts) {
        setFeedPosts(data.posts);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadCommunity = useCallback(async () => {
    const response = await fetch("/api/community/overview", {
      cache: "no-store",
    });
    const result = (await response.json().catch(() => null)) as
      | { success?: boolean; overview?: CommunityOverview }
      | null;
    if (response.ok && result?.success && result.overview) {
      setOverview(result.overview);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadCommunity(), 0);
    void fetch("/api/leaderboard?scope=LEAGUE&limit=5", {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then(
        (result: {
          success?: boolean;
          leaderboard?: Array<{
            id: string;
            name: string;
            economy: { totalXp: number } | null;
          }>;
        }) => {
          if (result.success) setLeaders(result.leaderboard ?? []);
        },
      )
      .catch(() => undefined);
    
    void loadFeed();

    return () => window.clearTimeout(initialLoad);
  }, [loadCommunity, loadFeed]);

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!postText.trim() || isPosting) return;
    setIsPosting(true);
    try {
      await fetch("/api/community/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: session?.username,
          text: postText,
          kind: "REFLECTION"
        })
      });
      setPostText("");
      await loadFeed();
    } catch (error) {
      console.error(error);
    } finally {
      setIsPosting(false);
    }
  }

  const cc = overview?.challenge ?? null;
  const pct = cc?.progressPercent ?? 0;
  const statistics = overview?.statistics;
  const eventLocations = [
    "Semua Area",
    ...Array.from(
      new Set(
        (overview?.events ?? [])
          .map((event) => event.location)
          .filter((value): value is string => Boolean(value)),
      ),
    ),
  ];

  async function joinChallenge() {
    if (!cc) return;
    const response = await fetch(`/api/challenges/${cc.id}/join`, {
      method: "POST",
    });
    if (!response.ok) return;
    notifyDataChanged();
    await loadCommunity();
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex max-w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center" aria-label="Filter lokasi event">
        <label htmlFor="event-location" className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-foreground">
          <MapPin className="h-4 w-4 text-brand" /> Lokasi Event
        </label>
        <div className="relative w-full sm:w-52">
          <select
            id="event-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="h-10 w-full appearance-none rounded-xl border border-line bg-card py-2 pl-3 pr-9 text-xs font-bold text-foreground shadow-sm outline-none transition hover:border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/15"
            aria-label="Pilih lokasi event"
          >
            {eventLocations.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <EventCarousel
            key={`${location}-${overview?.generatedAt ?? "loading"}`}
            location={location}
            sourceEvents={overview?.events ?? []}
            onChanged={loadCommunity}
          />

          <section className="card card-pad border-line bg-card">
            <h2 className="font-display text-sm font-bold text-foreground">Statistik Komunitas</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: Users2, value: (statistics?.activeMembers ?? 0).toLocaleString("id-ID"), label: "Anggota aktif", note: "30 hari terakhir", color: "text-brand" },
                { icon: Footprints, value: (statistics?.weeklySteps ?? 0).toLocaleString("id-ID"), label: "Langkah minggu ini", note: "aktivitas terverifikasi", color: "text-sky" },
                { icon: Flame, value: String(statistics?.activeEvents ?? 0), label: "Event aktif", note: "dari database", color: "text-amber" },
                { icon: TrendingUp, value: `${statistics?.averageStreak ?? 0} hari`, label: "Rata-rata streak", note: "anggota aktif", color: "text-lime" },
              ].map((metric) => { const Icon = metric.icon; return (
                <div key={metric.label} className="rounded-2xl border border-line/65 bg-secondary/25 p-3.5">
                  <div className="flex items-center gap-2"><Icon className={`h-5 w-5 ${metric.color}`} /><p className="font-display text-lg font-extrabold text-foreground">{metric.value}</p></div>
                  <p className="mt-1 text-[10px] font-bold text-muted-foreground">{metric.label}</p>
                  <p className="mt-0.5 text-[10px] text-brand">{metric.note}</p>
                </div>
              ); })}
            </div>
          </section>
          <ShareTemplateStudio />

          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="font-display text-base font-bold text-foreground">Perjalanan Komunitas Terbaru</h2><p className="mt-0.5 text-xs text-muted-foreground">Dukungan dan progres aman dari lingkaranmu.</p></div>
              <span className="pill border border-line bg-card text-[10px] font-bold text-muted-foreground">Aktivitas Terbaru</span>
            </div>
            
            <form onSubmit={submitPost} className="card card-pad border-line bg-card flex gap-3 items-start">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-sm font-bold text-white shadow-sm">
                {session?.name ? initials(session.name) : "ME"}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  disabled={isPosting}
                  placeholder="Bagikan pencapaian atau refleksimu hari ini..."
                  className="w-full rounded-xl border border-line bg-secondary/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 transition disabled:opacity-50"
                />
                <div className="mt-2 flex justify-end">
                  <button type="submit" disabled={!postText.trim() || isPosting} className="btn btn-primary btn-sm rounded-full px-5 shadow-sm disabled:opacity-50">
                    {isPosting ? "Membagikan..." : "Bagikan"}
                  </button>
                </div>
              </div>
            </form>

            <div className="max-h-[600px] overflow-y-auto overscroll-contain space-y-4 custom-scrollbar pr-2">
              {feedPosts.length === 0 ? (
                 <div className="card card-pad py-12 text-center border-line bg-card">
                   <p className="text-sm font-bold text-muted-foreground">Belum ada perjalanan komunitas.</p>
                   <p className="mt-1 text-xs text-muted-foreground">Jadilah yang pertama berbagi hari ini!</p>
                 </div>
              ) : (
                feedPosts.map((p) => <PostCard key={p.id} p={p} onCommentAdded={loadFeed} />)
              )}
            </div>
          </div>
        </div>

        <aside className="min-w-0 space-y-5 xl:sticky xl:top-24">
          <section className="card card-pad border-line bg-card">
            <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-brand" /><h2 className="font-display text-sm font-bold text-foreground">Insight Komunitas Hari Ini</h2></div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {[
                { label: "Langkah rata-rata", value: (statistics?.averageSteps ?? 0).toLocaleString("id-ID"), note: "7 hari" },
                { label: "Streak rata-rata", value: `${statistics?.averageStreak ?? 0} hari`, note: "Akun aktif" },
                { label: "Anggota aktif", value: (statistics?.activeMembers ?? 0).toLocaleString("id-ID"), note: "30 hari" },
                { label: "Target tercapai", value: `${statistics?.targetCompletionPercent ?? 0}%`, note: "Challenge" },
              ].map((item) => <div key={item.label} className="rounded-2xl border border-line/65 bg-secondary/25 p-3"><p className="text-[9px] font-semibold text-muted-foreground">{item.label}</p><p className="mt-1 font-display text-base font-extrabold text-foreground">{item.value}</p><p className="mt-0.5 text-[9px] text-brand">{item.note}</p></div>)}
            </div>
          </section>

          {cc && <section className="card card-pad space-y-4 border-line bg-card">
            <div className="flex items-center justify-between gap-2"><h2 className="font-display text-sm font-bold text-foreground">Tantangan Aktif</h2><Target className="h-5 w-5 text-brand" /></div>
          <div><h3 className="text-xs font-bold text-foreground">{cc.title}</h3><div className="chart-progress mt-3 h-2 overflow-hidden rounded-full"><div className="h-full rounded-full bg-gradient-to-r from-brand to-lime" style={{ width: `${pct}%` }} /></div><p className="mt-2 text-[10px] text-muted-foreground">{cc.currentValue.toLocaleString("id-ID")} / {cc.targetValue.toLocaleString("id-ID")} {cc.unit} ({pct}%)</p></div>
            <div className="flex items-center justify-between gap-3 border-t border-line/45 pt-3"><span className="text-[10px] text-muted-foreground">{cc.participants} pengguna berkontribusi</span>{cc.isJoined ? <span className="pill bg-brand-soft text-[10px] font-bold text-brand"><Check className="h-3 w-3" /> Terdaftar</span> : <button onClick={joinChallenge} className="btn btn-primary btn-xs">Gabung</button>}</div>
          </section>}

          <section className="card card-pad border-line bg-card">
            <div className="flex items-center justify-between gap-2"><h2 className="font-display text-sm font-bold text-foreground">Peringkat Minggu Ini</h2><Trophy className="h-5 w-5 text-amber" /></div>
            <div className="mt-4 space-y-3">
              {leaders.map((item, index) => {
                const isCurrentUser = session?.name === item.name;
                const medalStyle = index === 0 ? "bg-amber/20 text-amber border-amber/40" 
                                 : index === 1 ? "bg-slate-300/20 text-slate-400 border-slate-300/40"
                                 : index === 2 ? "bg-orange-700/20 text-orange-600 border-orange-700/40"
                                 : "bg-secondary text-muted-foreground border-transparent";
                
                return (
                  <div key={item.id} className={`flex items-center gap-3 rounded-2xl p-2.5 transition-all ${isCurrentUser ? "bg-brand/10 border-brand/30 shadow-sm" : "border-transparent hover:bg-secondary/30"} border`}>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[10px] font-extrabold ${medalStyle}`}>
                      {index + 1}
                    </span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-[9px] font-bold text-white shadow-sm">{initials(item.name)}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-xs font-bold ${isCurrentUser ? "text-brand" : "text-foreground"}`}>
                        {item.name} {isCurrentUser && "(Kamu)"}
                      </p>
                    </div>
                    <p className="shrink-0 text-[10px] font-bold text-amber">
                      {(item.economy?.totalXp ?? 0).toLocaleString("id-ID")} XP
                    </p>
                  </div>
                );
              })}
            </div>
            <button onClick={() => window.location.hash = "peringkat"} className="mt-4 w-full rounded-xl bg-secondary py-2 text-[10px] font-bold text-brand">Lihat Peringkat Lengkap</button>
          </section>

          <section className="card card-pad border-line bg-card">
            <h2 className="font-display text-sm font-bold text-foreground">Healthy Circle Populer</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {(overview?.guilds ?? []).map((circle, index) => <button key={circle.id} className="rounded-2xl border border-line/65 bg-secondary/25 p-3 text-left transition hover:border-brand/30 hover:bg-brand-soft/35"><span className={`grid h-9 w-9 place-items-center rounded-full ${index % 2 ? "bg-sky/15 text-sky" : "bg-brand-soft text-brand"}`}>{index < 2 ? <Footprints className="h-4 w-4" /> : <Users2 className="h-4 w-4" />}</span><p className="mt-2 text-[10px] font-bold text-foreground">{circle.name}</p><p className="text-[9px] text-muted-foreground">{circle.members.toLocaleString("id-ID")} anggota</p></button>)}
            </div>
          </section>

          <div className="flex items-start gap-2.5 rounded-2xl border border-line/30 bg-secondary/50 p-4 text-[10px] text-muted-foreground"><Lock className="mt-0.5 h-4 w-4 shrink-0" /><p>Rute GPS presisi, jurnal, makanan, hidrasi, dan tidur tetap privat secara bawaan.</p></div>
        </aside>
      </div>
    </div>
  );
}
