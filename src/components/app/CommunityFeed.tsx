"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  Heart, HeartPulse, MessageCircle, Footprints, Flame, MessageSquarePlus, Users2, Check, Lock,
  CalendarDays, Clock3, Gift, MapPin, Megaphone, Palette, RefreshCw, Share2, Trophy, Target, TrendingUp,
  Download, Droplets, ImagePlus, Trash2, ChevronLeft, ChevronRight
} from "lucide-react";
import { POSTS, COMMUNITY_CHALLENGE, type Post } from "@/lib/community";
import { LeaderboardView } from "@/components/app/LeaderboardView";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { NutriVerseMoments } from "@/components/app/NutriVerseMoments";

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

function PostCard({ p }: { readonly p: Post }) {
  const [liked, setLiked] = useState(false);
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
          onClick={() => setLiked((v) => !v)}
          className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1.5 text-left text-xs font-bold transition sm:px-3 ${liked ? "bg-brand-soft text-brand shadow-sm" : "text-muted-foreground hover:bg-secondary"}`}
          aria-label="Beri semangat pada kiriman"
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} /> Beri Semangat &middot; {p.encourages + (liked ? 1 : 0)}
        </button>
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-bold text-muted-foreground sm:px-3">
          <MessageCircle className="h-3.5 w-3.5" /> Komentar Dukungan &middot; {p.comments}
        </span>
      </div>
    </div>
  );
}

const COMMUNITY_EVENTS = [
  { id: "amikom-run", area: "Yogyakarta", title: "AMIKOM Morning Run 5K", location: "Embung AMIKOM, Yogyakarta", date: "27 Juli 2026", day: "Minggu", time: "06.00 WIB", participants: 412, capacity: 600, xp: 450, badge: "Lencana Eksklusif", background: "linear-gradient(120deg,#073b2b 0%,#0b6642 52%,#082b22 100%)", accent: "#b8ef57" },
  { id: "jakarta-night", area: "Jakarta", title: "Jakarta Night Walk 4K", location: "Lapangan Banteng, Jakarta", date: "2 Agustus 2026", day: "Sabtu", time: "19.00 WIB", participants: 286, capacity: 450, xp: 320, badge: "City Glow", background: "linear-gradient(120deg,#10243e 0%,#174e70 52%,#0b2734 100%)", accent: "#67e8f9" },
  { id: "bandung-cycle", area: "Bandung", title: "Bandung Cycle Loop 12K", location: "Gedung Sate, Bandung", date: "9 Agustus 2026", day: "Minggu", time: "06.30 WIB", participants: 198, capacity: 320, xp: 520, badge: "Weekend Ride", background: "linear-gradient(120deg,#312e4f 0%,#5b3f83 50%,#172554 100%)", accent: "#c4b5fd" },
  { id: "surabaya-steps", area: "Surabaya", title: "Surabaya Sunrise Steps", location: "Taman Bungkul, Surabaya", date: "16 Agustus 2026", day: "Minggu", time: "05.45 WIB", participants: 344, capacity: 500, xp: 380, badge: "Sunrise Badge", background: "linear-gradient(120deg,#713f12 0%,#c05a22 50%,#3f250e 100%)", accent: "#fde047" },
  { id: "bali-coast", area: "Bali", title: "Bali Coast Recovery Walk", location: "Pantai Sanur, Bali", date: "23 Agustus 2026", day: "Minggu", time: "06.15 WITA", participants: 172, capacity: 280, xp: 300, badge: "Coastal Calm", background: "linear-gradient(120deg,#134e4a 0%,#0f766e 50%,#164e63 100%)", accent: "#99f6e4" },
] as const;

function EventCarousel({ location }: { readonly location: string }) {
  const filteredEvents = location === "Semua Area" ? COMMUNITY_EVENTS : COMMUNITY_EVENTS.filter((event) => event.area === location);
  const events = filteredEvents.length ? filteredEvents : COMMUNITY_EVENTS;
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [joinedIds, setJoinedIds] = useState<ReadonlySet<string>>(new Set());
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

  function joinEvent(eventId: string) {
    setJoinedIds((currentIds) => {
      const next = new Set(currentIds);
      next.add(eventId);
      return next;
    });
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
            const progress = Math.round((event.participants / event.capacity) * 100);
            const joined = joinedIds.has(event.id);
            return (
              <article
                key={event.id}
                className="relative w-full shrink-0 overflow-hidden p-5 pb-20 sm:p-7 sm:pb-24"
                style={{ backgroundImage: event.background }}
                aria-hidden={index !== activeIndex}
              >
                <div aria-hidden className="absolute -right-12 -top-14 h-48 w-48 rounded-full opacity-25 blur-3xl" style={{ backgroundColor: event.accent }} />
                <div aria-hidden className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.12),transparent_68%)]" />
                <div aria-hidden className="absolute bottom-0 right-0 h-32 w-1/2 bg-gradient-to-t from-black/25 to-transparent" />
                <div className="relative z-10 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill border border-white/15 bg-white/10 text-[10px] font-bold text-white"><Megaphone className="h-3.5 w-3.5" /> EVENT KOMUNITAS</span>
                    <span className="pill border border-white/20 bg-black/15 text-[10px] font-bold" style={{ color: event.accent }}>{event.badge.toUpperCase()}</span>
                  </div>
                  <h2 className="mt-5 text-balance font-display text-2xl font-extrabold tracking-tight sm:text-4xl">{event.title}</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-white/80 sm:text-sm"><MapPin className="h-4 w-4" style={{ color: event.accent }} /> {event.location}</p>
                  <div className="mt-5 grid gap-3 min-[420px]:grid-cols-2 sm:grid-cols-4">
                    {[
                      { icon: CalendarDays, value: event.date, label: event.day },
                      { icon: Clock3, value: event.time, label: "Mulai" },
                      { icon: Users2, value: `${event.participants} peserta`, label: "Sudah bergabung" },
                      { icon: Gift, value: `+${event.xp} XP`, label: "Bonus setelah validasi" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return <div key={item.value} className="flex items-start gap-2"><Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: event.accent }} /><div><p className="text-xs font-bold sm:text-sm">{item.value}</p><p className="text-[10px] text-white/60">{item.label}</p></div></div>;
                    })}
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-[10px] text-white/70"><span>{event.participants} / {event.capacity} peserta</span><span>{progress}%</span></div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: event.accent }} /></div>
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

const SHARE_CONTENTS = [
  { label: "Health Pulse", top: "PULSE 78", metric: "+1,2", headline: ["Naik", "Health", "Point"], caption: "Health Pulse-ku naik +1,2 poin hari ini. Pelan-pelan, konsisten, dan tetap dengarkan tubuh. #NutriVerse" },
  { label: "Aktivitas", top: "1,4 KM", metric: "1,4 KM", headline: ["Morning", "Walk", "Tuntas"], caption: "Jalan pagi 1,4 km selesai dan terverifikasi GPS. Satu langkah sehat untuk hari ini. #NutriVerse" },
  { label: "Pencapaian", top: "STREAK 7", metric: "7 HARI", headline: ["Streak", "Sehat", "Terjaga"], caption: "Tujuh hari menjaga kebiasaan sehat. Bukan harus sempurna—yang penting terus kembali. #NutriVerse" },
  { label: "Peringkat", top: "RANK #3", metric: "#3", headline: ["Naik", "Peringkat", "Liga"], caption: "Naik dua posisi di Liga Radiant! Kompetitif boleh, tetapi kesehatan dan pemulihan tetap utama. #NutriVerse" },
] as const;

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
  const [templateIndex, setTemplateIndex] = useState(0);
  const [contentIndex, setContentIndex] = useState(0);
  const [caption, setCaption] = useState<string>(SHARE_CONTENTS[0].caption);
  const [shared, setShared] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [backgroundPhoto, setBackgroundPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [format, setFormat] = useState<"story" | "post">("story");
  const [exportMode, setExportMode] = useState<"transparent" | "ready">("transparent");
  const template = SHARE_TEMPLATES[templateIndex];
  const content = SHARE_CONTENTS[contentIndex];

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
    SHARE_INSIGHTS.forEach((insight, index) => {
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

  return (
    <section className="card min-w-0 overflow-hidden border-brand/15 bg-card">
      <header className="flex flex-col gap-3 border-b border-line/55 bg-gradient-to-r from-card via-card to-brand-soft/30 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="min-w-0">
          <span className="pill bg-brand-soft text-[9px] font-bold text-brand"><Share2 className="h-3.5 w-3.5" /> TEMPLATE MEDIA SOSIAL</span>
          <h2 className="mt-2 font-display text-lg font-extrabold text-foreground sm:text-xl">Studio berbagi progres NutriVerse</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">Buat visual siap Story atau Post tanpa membagikan rute, lokasi presisi, jurnal, maupun catatan makanan.</p>
        </div>
        <span className="pill w-fit border border-brand/15 bg-card text-[9px] font-bold text-brand"><Lock className="h-3.5 w-3.5" /> DATA PRIVAT TERLINDUNGI</span>
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
                {SHARE_INSIGHTS.map((insight) => {
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
            <div className="mt-2 flex max-w-full gap-2 overflow-x-auto pb-1">{SHARE_CONTENTS.map((item, index) => <button key={item.label} onClick={() => { setContentIndex(index); setCaption(item.caption); }} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-bold transition ${contentIndex === index ? "bg-brand text-white shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{item.label}</button>)}</div>
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
  const [joined, setJoined] = useState(false);
  const [location, setLocation] = useState("Semua Area");
  const cc = COMMUNITY_CHALLENGE;
  const pct = Math.round((cc.now / cc.goal) * 100);

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1" aria-label="Filter lokasi event">
        <span className="flex shrink-0 items-center gap-1.5 pr-1 text-xs font-bold text-foreground"><MapPin className="h-4 w-4 text-brand" /> Lokasi Event</span>
        {["Semua Area", "Yogyakarta", "Jakarta", "Bandung", "Surabaya", "Bali"].map((item) => (
          <button key={item} onClick={() => setLocation(item)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${location === item ? "border-brand bg-brand text-white" : "border-line bg-card text-muted-foreground hover:border-brand/30 hover:text-brand"}`}>{item}</button>
        ))}
      </div>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <EventCarousel key={location} location={location} />

          <section className="card card-pad border-line bg-card">
            <h2 className="font-display text-sm font-bold text-foreground">Statistik Komunitas</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: Users2, value: "2.143", label: "Anggota aktif", note: "+124 hari ini", color: "text-brand" },
                { icon: Footprints, value: "2.418.233", label: "Langkah minggu ini", note: "+18,8%", color: "text-sky" },
                { icon: Flame, value: "14", label: "Event aktif", note: "di seluruh area", color: "text-amber" },
                { icon: TrendingUp, value: "8 hari", label: "Rata-rata streak", note: "+1 hari", color: "text-lime" },
              ].map((metric) => { const Icon = metric.icon; return (
                <div key={metric.label} className="rounded-2xl border border-line/65 bg-secondary/25 p-3.5">
                  <div className="flex items-center gap-2"><Icon className={`h-5 w-5 ${metric.color}`} /><p className="font-display text-lg font-extrabold text-foreground">{metric.value}</p></div>
                  <p className="mt-1 text-[10px] font-bold text-muted-foreground">{metric.label}</p>
                  <p className="mt-0.5 text-[10px] text-brand">{metric.note}</p>
                </div>
              ); })}
            </div>
          </section>

          <NutriVerseMoments />

          <ShareTemplateStudio />

          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="font-display text-base font-bold text-foreground">Perjalanan Komunitas Terbaru</h2><p className="mt-0.5 text-xs text-muted-foreground">Dukungan dan progres aman dari lingkaranmu.</p></div>
              <span className="pill border border-line bg-card text-[10px] font-bold text-muted-foreground">Aktivitas Terbaru</span>
            </div>
            {POSTS.map((p) => <PostCard key={p.id} p={p} />)}
          </div>
        </div>

        <aside className="min-w-0 space-y-5 xl:sticky xl:top-24">
          <section className="card card-pad border-line bg-card">
            <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-brand" /><h2 className="font-display text-sm font-bold text-foreground">Insight Komunitas Hari Ini</h2></div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {[
                { label: "Langkah rata-rata", value: "7.234", note: "+12%" },
                { label: "Streak rata-rata", value: "8 hari", note: "+1 hari" },
                { label: "Anggota aktif", value: "2.143", note: "Hari ini" },
                { label: "Target tercapai", value: "72%", note: "Anggota" },
              ].map((item) => <div key={item.label} className="rounded-2xl border border-line/65 bg-secondary/25 p-3"><p className="text-[9px] font-semibold text-muted-foreground">{item.label}</p><p className="mt-1 font-display text-base font-extrabold text-foreground">{item.value}</p><p className="mt-0.5 text-[9px] text-brand">{item.note}</p></div>)}
            </div>
          </section>

          <section className="card card-pad space-y-4 border-line bg-card">
            <div className="flex items-center justify-between gap-2"><h2 className="font-display text-sm font-bold text-foreground">Tantangan Aktif</h2><Target className="h-5 w-5 text-brand" /></div>
            <div><h3 className="text-xs font-bold text-foreground">{cc.title}</h3><div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-brand to-lime" style={{ width: `${pct}%` }} /></div><p className="mt-2 text-[10px] text-muted-foreground">{cc.now.toLocaleString("id-ID")} / {cc.goal.toLocaleString("id-ID")} langkah ({pct}%)</p></div>
            <div className="flex items-center justify-between gap-3 border-t border-line/45 pt-3"><span className="text-[10px] text-muted-foreground">{cc.participants} pengguna bergabung</span>{joined ? <span className="pill bg-brand-soft text-[10px] font-bold text-brand"><Check className="h-3 w-3" /> Terdaftar</span> : <button onClick={() => setJoined(true)} className="btn btn-primary btn-xs">Gabung</button>}</div>
          </section>

          <section className="card card-pad border-line bg-card">
            <div className="flex items-center justify-between gap-2"><h2 className="font-display text-sm font-bold text-foreground">Peringkat Minggu Ini</h2><Trophy className="h-5 w-5 text-amber" /></div>
            <div className="mt-4 space-y-3">
              {[{ name: "Fatan Mubarak", xp: "1.245 XP" }, { name: "Dinda Puspita", xp: "980 XP" }, { name: "Yoga Adyatma", xp: "764 XP" }, { name: "Aulia Rahmah", xp: "512 XP" }, { name: "Ilham Ramadhan", xp: "410 XP" }].map((item, index) => <div key={item.name} className="flex items-center gap-2.5"><span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-extrabold ${index < 3 ? "bg-amber/15 text-amber" : "bg-secondary text-muted-foreground"}`}>{index + 1}</span><span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-[9px] font-bold text-white">{initials(item.name)}</span><p className="min-w-0 flex-1 truncate text-[11px] font-bold text-foreground">{item.name}</p><p className="shrink-0 text-[10px] font-bold text-amber">{item.xp}</p></div>)}
            </div>
            <button onClick={() => window.location.hash = "peringkat"} className="mt-4 w-full rounded-xl bg-secondary py-2 text-[10px] font-bold text-brand">Lihat Peringkat Lengkap</button>
          </section>

          <section className="card card-pad border-line bg-card">
            <h2 className="font-display text-sm font-bold text-foreground">Healthy Circle Populer</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {[{ name: "Running Club", members: "1.024" }, { name: "Yoga Daily", members: "892" }, { name: "Hydration Squad", members: "743" }, { name: "Nutrition Talk", members: "652" }].map((circle, index) => <button key={circle.name} className="rounded-2xl border border-line/65 bg-secondary/25 p-3 text-left transition hover:border-brand/30 hover:bg-brand-soft/35"><span className={`grid h-9 w-9 place-items-center rounded-full ${index % 2 ? "bg-sky/15 text-sky" : "bg-brand-soft text-brand"}`}>{index < 2 ? <Footprints className="h-4 w-4" /> : <Users2 className="h-4 w-4" />}</span><p className="mt-2 text-[10px] font-bold text-foreground">{circle.name}</p><p className="text-[9px] text-muted-foreground">{circle.members} anggota</p></button>)}
            </div>
          </section>

          <div className="flex items-start gap-2.5 rounded-2xl border border-line/30 bg-secondary/50 p-4 text-[10px] text-muted-foreground"><Lock className="mt-0.5 h-4 w-4 shrink-0" /><p>Rute GPS presisi, jurnal, makanan, hidrasi, dan tidur tetap privat secara bawaan.</p></div>
        </aside>
      </div>
    </div>
  );
}
