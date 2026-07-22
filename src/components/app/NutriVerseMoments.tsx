"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import NextImage from "next/image";
import { Camera, Check, ChevronLeft, ChevronRight, Download, Lock, Maximize2, RefreshCw, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

type Privacy = "public" | "friends" | "private";
type Moment = {
  readonly id: string;
  readonly name: string;
  readonly caption: string;
  readonly image: string | null;
  readonly privacy: Privacy;
  readonly duringActivity: boolean;
  readonly time: string;
};

const PRIVACY_OPTIONS: readonly { value: Privacy; label: string; icon: typeof Users }[] = [
  { value: "public", label: "Komunitas", icon: Users },
  { value: "friends", label: "Teman", icon: ShieldCheck },
  { value: "private", label: "Privat", icon: Lock },
];

function loadMomentImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function loadMomentBrandMark() {
  return loadMomentImage("/brand/nutriverse-app-icon-200.png");
}

function drawFullPhoto(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  context.drawImage(image, 0, 0, width, height);
}

function drawPhotoWithBackdrop(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const coverScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const coverWidth = image.naturalWidth * coverScale;
  const coverHeight = image.naturalHeight * coverScale;
  context.fillStyle = "#101314";
  context.fillRect(0, 0, width, height);
  context.save();
  context.filter = "blur(28px) grayscale(1) brightness(.38)";
  context.drawImage(image, (width - coverWidth) / 2, (height - coverHeight) / 2, coverWidth, coverHeight);
  context.restore();
  context.fillStyle = "rgba(0, 0, 0, .28)";
  context.fillRect(0, 0, width, height);
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function getWrappedLines(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(nextLine).width <= maxWidth || !currentLine) {
      currentLine = nextLine;
      continue;
    }
    lines.push(currentLine);
    currentLine = word;
  }
  if (currentLine) lines.push(currentLine);
  if (lines.length <= maxLines) return lines;
  const visibleLines = lines.slice(0, maxLines);
  visibleLines[maxLines - 1] = `${visibleLines[maxLines - 1].replace(/[,.!?;:]?$/, "")}…`;
  return visibleLines;
}

function drawMomentTypography(context: CanvasRenderingContext2D, text: string, width: number, height: number) {
  const overlay = context.createLinearGradient(0, height * 0.4, 0, height);
  overlay.addColorStop(0, "rgba(7, 9, 10, 0)");
  overlay.addColorStop(0.48, "rgba(7, 9, 10, .2)");
  overlay.addColorStop(1, "rgba(7, 9, 10, .96)");
  context.fillStyle = overlay;
  context.fillRect(0, 0, width, height);

  context.save();
  context.textAlign = "center";
  context.fillStyle = "#ffffff";
  context.shadowColor = "rgba(0, 0, 0, .46)";
  context.shadowBlur = 14;
  context.font = "800 58px Arial";
  const lines = getWrappedLines(context, text.trim() || "Satu momen sehat hari ini.", width - 176, 3);
  const lineHeight = 68;
  const startY = height - 214 - (lines.length - 1) * lineHeight;
  lines.forEach((line, index) => context.fillText(line, width / 2, startY + index * lineHeight));
  context.shadowBlur = 0;
  context.fillStyle = "rgba(255, 255, 255, .2)";
  context.fillRect(112, height - 120, width - 224, 1);
  context.fillStyle = "rgba(255, 255, 255, .76)";
  context.font = "700 18px Arial";
  context.fillText("NUTRIVERSE • MOMENT SEHAT", width / 2, height - 58);
  context.restore();
}

async function normalizePhoto(source: string) {
  const image = await loadMomentImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) return source;
  drawFullPhoto(context, image, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export function NutriVerseMoments() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const railDragRef = useRef<{ startX: number; scrollLeft: number } | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("friends");
  const [duringActivity, setDuringActivity] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const [railDragging, setRailDragging] = useState(false);
  const [viewerMoment, setViewerMoment] = useState<Moment | null>(null);
  const [moments, setMoments] = useState<Moment[]>([
    { id: "demo-1", name: "Dinda", caption: "Morning walk sebelum kelas. Pelan tetapi selesai 🌿", image: null, privacy: "friends", duringActivity: true, time: "8 mnt lalu" },
    { id: "demo-2", name: "Yoga", caption: "Recovery day bareng teman kampus.", image: null, privacy: "public", duringActivity: false, time: "24 mnt lalu" },
  ]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  function closeComposer() {
    stopCamera();
    setComposerOpen(false);
    setCameraError("");
  }

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Kamera tidak tersedia pada browser atau perangkat ini. NutriVerse Moments hanya menerima tangkapan langsung.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1350 }, aspectRatio: { ideal: 4 / 5 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError("Izin kamera belum diberikan. Aktifkan izin kamera perangkat untuk membuat Moment secara real-time.");
    }
  }

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(await normalizePhoto(canvas.toDataURL("image/jpeg", 0.92)));
    stopCamera();
  }

  async function downloadWatermarkedMoment(source = photo, text = caption) {
    if (!source) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = await loadMomentImage(source);
    drawPhotoWithBackdrop(context, image, canvas.width, canvas.height);
    drawMomentTypography(context, text, canvas.width, canvas.height);
    const brandMark = await loadMomentBrandMark();
    context.drawImage(brandMark, 62, 62, 96, 96);
    context.save();
    context.shadowColor = "rgba(0, 0, 0, .42)";
    context.shadowBlur = 10;
    context.textAlign = "left";
    context.font = "800 30px Arial";
    context.fillStyle = "#ffffff";
    context.fillText("Nutri", 178, 105);
    context.fillStyle = "#34d399";
    context.fillText("Verse", 178 + context.measureText("Nutri").width, 105);
    context.restore();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nutriverse-moment-watermark.png";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 1800);
  }

  function publishMoment() {
    if (!photo) return;
    setMoments((current) => [{ id: crypto.randomUUID(), name: "Kamu", caption: caption.trim() || "Satu momen sehat hari ini.", image: photo, privacy, duringActivity, time: "Baru saja" }, ...current]);
    setPhoto(null);
    setCaption("");
    setPrivacy("friends");
    closeComposer();
  }

  function scrollMoments(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(210, rail.clientWidth * 0.72), behavior: "smooth" });
  }

  function startRailDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a, input")) return;
    const rail = railRef.current;
    if (!rail) return;
    railDragRef.current = { startX: event.clientX, scrollLeft: rail.scrollLeft };
    setRailDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveRail(event: ReactPointerEvent<HTMLDivElement>) {
    const rail = railRef.current;
    const drag = railDragRef.current;
    if (!rail || !drag) return;
    rail.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX);
  }

  function stopRailDrag(event: ReactPointerEvent<HTMLDivElement>) {
    railDragRef.current = null;
    setRailDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <section className="card min-w-0 overflow-hidden border-brand/15 bg-card">
      <div className="flex flex-col gap-2.5 border-b border-line/60 bg-gradient-to-r from-brand-soft/55 via-card to-card p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill bg-brand text-[8px] font-bold text-white"><Camera className="h-3.5 w-3.5" /> NUTRIVERSE MOMENTS</span>
            <span className="pill border border-brand/15 bg-card text-[8px] font-bold text-brand">KAMERA LANGSUNG</span>
          </div>
          <h2 className="mt-1.5 font-display text-[15px] font-extrabold text-foreground sm:text-base">Tangkap momen sehat, bukan sekadar angka</h2>
          <p className="mt-0.5 max-w-xl text-[10px] leading-relaxed text-muted-foreground">Kamera langsung · sosial · bukan bukti aktivitas · tanpa XP.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden gap-1 sm:flex">
            <button onClick={() => scrollMoments(-1)} className="grid h-8 w-8 place-items-center rounded-xl border border-line bg-card text-muted-foreground transition hover:border-brand/30 hover:text-brand" aria-label="Moment sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => scrollMoments(1)} className="grid h-8 w-8 place-items-center rounded-xl border border-line bg-card text-muted-foreground transition hover:border-brand/30 hover:text-brand" aria-label="Moment berikutnya"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <button onClick={() => setComposerOpen(true)} className="btn btn-primary btn-sm min-w-0 flex-1 shrink-0 sm:flex-none"><Camera className="h-4 w-4" /> Tangkap Sekarang</button>
        </div>
      </div>

      <div
        ref={railRef}
        className={`grid touch-pan-y auto-cols-[minmax(176px,70vw)] grid-flow-col gap-3 overflow-x-auto p-3.5 pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:auto-cols-[195px] sm:px-4 ${railDragging ? "cursor-grabbing snap-none select-none" : "cursor-grab"}`}
        onPointerDown={startRailDrag}
        onPointerMove={moveRail}
        onPointerUp={stopRailDrag}
        onPointerCancel={stopRailDrag}
        aria-label="Carousel NutriVerse Moments"
      >
        {moments.map((moment, index) => (
          <article key={moment.id} className="min-w-0 snap-start overflow-hidden rounded-[1.4rem] border border-line bg-secondary/25 shadow-sm">
            <button type="button" onClick={() => moment.image && setViewerMoment(moment)} disabled={!moment.image} className={`group relative block aspect-[4/5] w-full overflow-hidden text-left ${moment.image ? "cursor-zoom-in bg-[#07150f]" : index % 2 ? "bg-gradient-to-br from-[#15334a] via-[#1d7f87] to-[#efb46c]" : "bg-gradient-to-br from-[#063d2b] via-[#0b8054] to-[#a3e635]"}`} aria-label={moment.image ? `Lihat foto ${moment.name} secara penuh` : undefined}>
              {moment.image && <NextImage src={moment.image} alt={`Moment ${moment.name}`} fill unoptimized className="object-contain" />}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 via-black/15 to-transparent" />
              {!moment.image && <div className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-black/15 text-white/75 backdrop-blur-sm"><Camera className="h-6 w-6" /></span></div>}
              <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-1 text-[8px] font-bold text-white backdrop-blur"><BrandLogo compact className="h-4 w-4" />{moment.name}</span><span className="rounded-full bg-black/45 px-2 py-1 text-[7px] font-bold text-white backdrop-blur">{moment.privacy === "public" ? "KOMUNITAS" : moment.privacy === "friends" ? "TEMAN" : "PRIVAT"}</span></div>
              {moment.image && <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[7px] font-bold text-white opacity-100 backdrop-blur transition sm:opacity-0 sm:group-hover:opacity-100"><Maximize2 className="h-3 w-3" /> Lihat penuh</span>}
            </button>
            <div className="min-h-[58px] border-t border-line/70 bg-card px-3 py-2.5"><div className="flex items-start justify-between gap-2">{moment.duringActivity && <span className="shrink-0 rounded-full bg-brand-soft px-1.5 py-0.5 text-[7px] font-bold text-brand">SAAT AKTIVITAS</span>}<p className="ml-auto shrink-0 text-[8px] text-muted-foreground">{moment.time} · tanpa XP</p></div><p className="mt-1 line-clamp-2 text-[10px] font-bold leading-relaxed text-foreground">{moment.caption}</p></div>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5"><button className="text-[9px] font-bold text-muted-foreground hover:text-brand">Beri Semangat</button>{moment.image ? <div className="flex gap-1"><button onClick={() => downloadWatermarkedMoment(moment.image, moment.caption)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-brand" aria-label="Download template Moment NutriVerse"><Download className="h-3.5 w-3.5" /></button><button onClick={() => setMoments((current) => current.filter((item) => item.id !== moment.id))} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Hapus Moment"><Trash2 className="h-3.5 w-3.5" /></button></div> : <button className="text-[9px] font-bold text-muted-foreground hover:text-destructive">Laporkan</button>}</div>
          </article>
        ))}
      </div>

      {viewerMoment?.image && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Foto penuh dari ${viewerMoment.name}`} onClick={() => setViewerMoment(null)}>
          <section className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#07150f] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white sm:px-5"><div className="min-w-0"><p className="truncate text-sm font-bold">Moment {viewerMoment.name}</p><p className="mt-0.5 text-[10px] text-white/60">{viewerMoment.privacy === "public" ? "Komunitas" : viewerMoment.privacy === "friends" ? "Teman" : "Privat"} · {viewerMoment.time}</p></div><button type="button" onClick={() => setViewerMoment(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="Tutup foto penuh"><X className="h-5 w-5" /></button></div>
            <div className="relative min-h-0 flex-1 bg-black"><NextImage src={viewerMoment.image} alt={`Moment penuh ${viewerMoment.name}`} width={1080} height={1350} unoptimized className="max-h-[calc(100dvh-10rem)] w-full object-contain" /></div>
            <div className="border-t border-white/10 px-4 py-3 text-white sm:px-5"><p className="text-sm font-bold">{viewerMoment.caption}</p>{viewerMoment.duringActivity && <p className="mt-1 text-[10px] text-white/65">Diambil saat aktivitas · tidak menghasilkan XP</p>}</div>
          </section>
        </div>
      )}

      {composerOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-hidden bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-3" role="dialog" aria-modal="true" aria-labelledby="moment-title">
          <section className="h-[100dvh] w-full max-w-3xl overflow-y-auto rounded-none border border-line bg-card shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-1.5rem)] sm:rounded-[2rem]">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-5 py-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand">NutriVerse Moments</p><h2 id="moment-title" className="mt-1 font-display text-lg font-extrabold">Bagikan momen sehatmu</h2></div><button onClick={closeComposer} className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tutup pembuat Moment"><X className="h-5 w-5" /></button></header>
            <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_280px] sm:p-6">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#101314]">
                {photo ? <><NextImage src={photo} alt="" fill unoptimized className="scale-110 object-cover opacity-45 grayscale blur-2xl" /><NextImage src={photo} alt="Preview Moment penuh" fill unoptimized className="object-contain" /><div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07090a]/95" /><div className="pointer-events-none absolute inset-x-4 top-4 flex items-center gap-2.5 text-white drop-shadow-lg"><BrandLogo compact className="!h-9 !w-9" /><span className="font-display text-base font-extrabold tracking-[-0.05em]">Nutri<span className="text-emerald-300">Verse</span></span></div><div className="pointer-events-none absolute inset-x-5 bottom-5 text-center text-white"><p className="line-clamp-3 font-display text-[clamp(1.15rem,6vw,2rem)] font-extrabold leading-[1.04] tracking-tight drop-shadow-lg">{caption.trim() || "Satu momen sehat hari ini."}</p><div className="mx-auto mt-4 h-px w-3/4 bg-white/20" /><p className="mt-3 text-[8px] font-bold tracking-[0.12em] text-white/75">NUTRIVERSE • MOMENT SEHAT</p></div></> : <video ref={videoRef} muted playsInline className={`h-full w-full scale-x-[-1] object-contain ${cameraActive ? "block" : "hidden"}`} />}
                {!photo && !cameraActive && <div className="absolute inset-0 grid place-items-center p-6 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-white"><Camera className="h-8 w-8" /></span><p className="mt-4 text-sm font-bold text-white">Kamera belum aktif</p><p className="mt-1 text-xs text-white/60">Izin hanya diminta ketika tombol kamera ditekan.</p><button onClick={startCamera} className="btn mt-5 bg-white text-[#07150f]">Aktifkan Kamera</button></div></div>}
                {cameraActive && <button onClick={capturePhoto} className="absolute bottom-5 left-1/2 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-brand text-white shadow-xl" aria-label="Ambil foto"><Camera className="h-7 w-7" /></button>}
                {!photo && <div className="absolute left-4 top-4 rounded-full bg-black/50 px-2.5 py-1.5 text-[8px] font-bold text-white backdrop-blur">NUTRIVERSE • TANPA XP</div>}
              </div>
              <div className="min-w-0 space-y-4">
                {cameraError && <div className="rounded-xl border border-amber/25 bg-amber/10 p-3 text-[10px] leading-relaxed text-amber">{cameraError}</div>}
                {photo && <button onClick={() => setPhoto(null)} className="btn btn-outline btn-sm w-full"><RefreshCw className="h-4 w-4" /> Ambil Ulang</button>}
                <div><label htmlFor="moment-caption" className="label">Caption untuk template</label><p id="moment-caption-help" className="mt-1 text-[10px] leading-relaxed text-muted-foreground">Teks ini bisa diedit dan akan tampil sebagai typography di bagian bawah preview serta PNG unduhan.</p><textarea id="moment-caption" value={caption} onChange={(event) => setCaption(event.target.value)} aria-describedby="moment-caption-help" maxLength={180} rows={4} className="input mt-2 min-h-24 resize-none" placeholder="Ceritakan momen sehatmu…" /><p className="mt-1 text-right text-[9px] text-muted-foreground">{caption.length}/180</p></div>
                <div><p className="label">Siapa yang dapat melihat?</p><div className="grid grid-cols-3 gap-1.5">{PRIVACY_OPTIONS.map((option) => { const Icon = option.icon; return <button key={option.value} onClick={() => setPrivacy(option.value)} className={`rounded-xl border p-2 text-[9px] font-bold ${privacy === option.value ? "border-brand bg-brand-soft text-brand" : "border-line text-muted-foreground"}`}><Icon className="mx-auto mb-1 h-4 w-4" />{option.label}</button>; })}</div></div>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-secondary/50 p-3"><input type="checkbox" checked={duringActivity} onChange={(event) => setDuringActivity(event.target.checked)} className="mt-0.5 accent-[var(--brand)]" /><span className="text-[10px] leading-relaxed text-muted-foreground"><span className="font-bold text-foreground">Diambil saat aktivitas berlangsung</span><br />Label konteks saja, bukan bukti anti-cheat atau sumber XP.</span></label>
                <div className="grid gap-2"><button onClick={() => downloadWatermarkedMoment()} disabled={!photo} className="btn btn-outline"><Download className="h-4 w-4" /> {downloaded ? "PNG Tersimpan" : "Simpan PNG Template"}</button><button onClick={publishMoment} disabled={!photo} className="btn btn-primary"><Check className="h-4 w-4" /> Bagikan Moment</button></div>
                <p className="text-[9px] leading-relaxed text-muted-foreground">Moment hanya dapat dibuat melalui kamera langsung. Foto dinormalisasi ulang untuk membuang metadata EXIF/lokasi; PNG unduhan memadukan foto penuh, gradasi, identitas NutriVerse, dan caption.</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
