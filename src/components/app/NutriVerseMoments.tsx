"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import NextImage from "next/image";
import { Camera, Check, ChevronLeft, ChevronRight, Download, Lock, Maximize2, RefreshCw, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

type Privacy = "public" | "friends" | "private";
type Moment = {
  readonly id: string;
  readonly name: string;
  readonly caption: string;
  readonly image: string;
  readonly privacy: Privacy;
  readonly duringActivity: boolean;
  readonly time: string;
  readonly isOwner: boolean;
  readonly reactionCount: number;
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

function relativeTime(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60_000),
  );
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)} jam lalu`;
  return `${Math.floor(minutes / 1_440)} hari lalu`;
}

function privacyFromDatabase(value: string): Privacy {
  if (value === "PUBLIC") return "public";
  if (value === "PRIVATE") return "private";
  return "friends";
}

function privacyForDatabase(value: Privacy) {
  if (value === "public") return "PUBLIC";
  if (value === "private") return "PRIVATE";
  return "CIRCLE";
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
  const [publishing, setPublishing] = useState(false);
  const [viewerMoment, setViewerMoment] = useState<Moment | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);
  const pullDistanceRef = useRef(0);
  const mobileViewerRef = useRef<HTMLDivElement>(null);

  // Sync ref with state so the touchEnd listener has access to the latest pullDistance
  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  // Auto scroll to clicked moment on mobile open
  useEffect(() => {
    if (viewerMoment) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`mobile-moment-${viewerMoment.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "auto", block: "start" });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [viewerMoment]);

  // Body scroll lock on mobile modal open
  useEffect(() => {
    if (viewerMoment) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [viewerMoment]);

  // Setup DOM touch listeners with passive: false to bypass mobile overscroll constraints
  useEffect(() => {
    const el = mobileViewerRef.current;
    if (!el) return;

    let startY = 0;
    let isAtBottom = false;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      const maxScroll = el.scrollHeight - el.clientHeight;
      isAtBottom = el.scrollTop >= maxScroll - 45;
    };

    const onTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const diff = startY - currentY; // positive = swiping up
      
      const maxScroll = el.scrollHeight - el.clientHeight;
      const atBottom = el.scrollTop >= maxScroll - 45;
      
      if (atBottom && diff > 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const resistance = Math.min(150, diff * 0.6);
        setPullDistance(resistance);

        // Real-time dismiss when pull threshold is exceeded
        if (resistance > 80) {
          setIsDismissing(true);
          el.removeEventListener("touchmove", onTouchMove);
          setTimeout(() => {
            setViewerMoment(null);
            setPullDistance(0);
            setIsDismissing(false);
          }, 250);
        }
      } else {
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => {
      const currentPull = pullDistanceRef.current;
      if (currentPull > 75) {
        setIsDismissing(true);
        setTimeout(() => {
          setViewerMoment(null);
          setPullDistance(0);
          setIsDismissing(false);
        }, 250);
      } else {
        setPullDistance(0);
      }
      startY = 0;
      isAtBottom = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [viewerMoment, moments]);

  const MIN_ITEMS = 12;
  const duplicateCount = moments.length > 0 ? Math.max(2, Math.ceil(MIN_ITEMS / moments.length)) : 0;

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (moments.length === 0 || isHovered || railDragging || composerOpen || viewerMoment) return;
    if (window.innerWidth < 640) return; // Stop auto-scroll on mobile
    
    let animationFrameId: number;
    let lastTime = performance.now();
    let fractionalScroll = 0;
    let isPaused = false;
    
    const scrollStep = (time: number) => {
      const rail = railRef.current;
      if (!rail) return;
      
      const delta = time - lastTime;
      lastTime = time;

      const setWidth = rail.scrollWidth / duplicateCount;
      if (progressBarRef.current) {
        // Calculate progress based on the FIRST original set's width
        const progress = Math.min(100, Math.max(0, (rail.scrollLeft / setWidth) * 100));
        progressBarRef.current.style.width = `${progress}%`;
      }
      
      if (!isPaused) {
        fractionalScroll += (45 * delta) / 1000; // 45 pixels per second
        
        if (fractionalScroll >= 1) {
          const pixelsToScroll = Math.floor(fractionalScroll);
          fractionalScroll -= pixelsToScroll;
          rail.scrollLeft += pixelsToScroll;
          
          if (rail.scrollLeft >= setWidth) {
            rail.scrollLeft -= setWidth; // Reset seamlessly
            isPaused = true;
            setTimeout(() => {
              isPaused = false;
              lastTime = performance.now();
            }, 4000);
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(scrollStep);
    };
    
    animationFrameId = requestAnimationFrame(scrollStep);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [moments.length, isHovered, railDragging, composerOpen, viewerMoment, duplicateCount]);

  // Peek animation for mobile viewer
  useEffect(() => {
    if (viewerMoment && window.innerWidth < 640) {
      const viewer = document.getElementById("mobile-moment-viewer");
      const el = document.getElementById(`mobile-moment-${viewerMoment.id}`);
      if (viewer && el) {
        // Snap immediately to the selected photo
        viewer.scrollTo({ top: el.offsetTop, behavior: "instant" });
        
        // Peek animation on first open in this session
        if (!sessionStorage.getItem("moment_peek_played")) {
          setTimeout(() => {
            viewer.scrollBy({ top: 120, behavior: "smooth" });
            setTimeout(() => {
              viewer.scrollTo({ top: el.offsetTop, behavior: "smooth" });
            }, 500);
          }, 800);
          sessionStorage.setItem("moment_peek_played", "true");
        }
      }
    }
  }, [viewerMoment]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/moments?limit=30", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as
          | {
              success?: boolean;
              moments?: Array<{
                id: string;
                userId: string;
                imageUrl: string;
                caption: string | null;
                privacyLevel: string;
                duringActivity: boolean;
                createdAt: string;
                user: { id: string; name: string };
                isOwner: boolean;
                _count?: { reactions: number };
              }>;
              error?: string;
            }
          | null;
        if (!response.ok || !result?.success) {
          throw new Error(result?.error ?? "Moment gagal dimuat.");
        }
        if (!cancelled) {
          setMoments(
            (result.moments ?? []).map((moment) => ({
              id: moment.id,
              name: moment.user.name,
              caption: moment.caption ?? "Satu momen sehat hari ini.",
              image: moment.imageUrl,
              privacy: privacyFromDatabase(moment.privacyLevel),
              duringActivity: moment.duringActivity,
              time: relativeTime(moment.createdAt),
              isOwner: moment.isOwner,
              reactionCount: moment._count?.reactions ?? 0,
            })),
          );
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setCameraError(
            loadError instanceof Error
              ? loadError.message
              : "Moment gagal dimuat.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
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
    
    const targetAspect = 4 / 5;
    const videoAspect = video.videoWidth / video.videoHeight;
    
    let cropWidth = video.videoWidth;
    let cropHeight = video.videoHeight;
    let offsetX = 0;
    let offsetY = 0;
    
    if (videoAspect > targetAspect) {
      cropWidth = video.videoHeight * targetAspect;
      offsetX = (video.videoWidth - cropWidth) / 2;
    } else {
      cropHeight = video.videoWidth / targetAspect;
      offsetY = (video.videoHeight - cropHeight) / 2;
    }
    
    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, offsetX, offsetY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    
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

  async function publishMoment() {
    if (!photo) return;
    setPublishing(true);
    setCameraError("");
    try {
      const imageBlob = await fetch(photo).then((response) => response.blob());
      const form = new FormData();
      form.set("bucket", "post-images");
      form.set("file", new File([imageBlob], "moment.jpg", { type: "image/jpeg" }));
      const uploadResponse = await fetch("/api/storage/upload", {
        method: "POST",
        body: form,
      });
      const upload = (await uploadResponse.json().catch(() => null)) as
        | { success?: boolean; publicUrl?: string; error?: string }
        | null;
      if (!uploadResponse.ok || !upload?.success || !upload.publicUrl) {
        throw new Error(upload?.error ?? "Foto Moment gagal diunggah.");
      }
      const response = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: upload.publicUrl,
          caption: caption.trim() || "Satu momen sehat hari ini.",
          privacyLevel: privacyForDatabase(privacy),
          duringActivity,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            moment?: {
              id: string;
              imageUrl: string;
              caption: string | null;
              privacyLevel: string;
              duringActivity: boolean;
              createdAt: string;
              user: { name: string };
            };
            error?: string;
          }
        | null;
      if (!response.ok || !result?.success || !result.moment) {
        throw new Error(result?.error ?? "Moment gagal disimpan.");
      }
      const moment = result.moment;
      setMoments((current) => [{
        id: moment.id,
        name: moment.user.name,
        caption: moment.caption ?? "Satu momen sehat hari ini.",
        image: moment.imageUrl,
        privacy: privacyFromDatabase(moment.privacyLevel),
        duringActivity: moment.duringActivity,
        time: "Baru saja",
        isOwner: true,
        reactionCount: 0,
      }, ...current]);
    } catch (publishError) {
      setCameraError(
        publishError instanceof Error
          ? publishError.message
          : "Moment gagal disimpan.",
      );
      return;
    } finally {
      setPublishing(false);
    }
    setPhoto(null);
    setCaption("");
    setPrivacy("friends");
    closeComposer();
  }

  async function encourageMoment(momentId: string) {
    const response = await fetch(`/api/moments/${momentId}/reaction`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ENCOURAGE" }),
    });
    if (!response.ok) return;
    setMoments((current) =>
      current.map((moment) =>
        moment.id === momentId
          ? { ...moment, reactionCount: moment.reactionCount + 1 }
          : moment,
      ),
    );
  }

  async function deleteMoment(momentId: string) {
    if (!window.confirm("Hapus Moment ini dari akun dan database?")) return;
    const response = await fetch(`/api/moments/${momentId}`, {
      method: "DELETE",
    });
    if (!response.ok) return;
    setMoments((current) =>
      current.filter((moment) => moment.id !== momentId),
    );
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
      <div className="relative overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-xl p-5 sm:p-6 border-b border-line shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
        <div className="absolute -top-12 -right-10 opacity-[0.03] dark:opacity-5 pointer-events-none text-foreground">
           <Camera className="h-64 w-64" />
        </div>
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground mb-4">Komunitas</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 dark:bg-brand/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-brand shadow-sm ring-1 ring-brand/20">
                <Camera className="h-3 w-3" /> NutriVerse Moments
              </span>
              <span className="inline-flex items-center rounded-full bg-secondary/80 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-foreground backdrop-blur-sm">
                Kamera Langsung
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-foreground">
              Tangkap momen sehat, <br className="hidden sm:block" /> bukan sekadar angka
            </h2>
            <p className="max-w-xl text-xs sm:text-sm font-medium leading-relaxed text-muted-foreground">
              Bagikan aktivitasmu hari ini. Sosial &middot; Tanpa XP &middot; 100% Kamera Langsung
            </p>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <div className="hidden sm:flex gap-2 mr-2">
              <button onClick={() => scrollMoments(-1)} className="grid h-10 w-10 place-items-center rounded-xl bg-card text-foreground shadow-sm ring-1 ring-line backdrop-blur-sm transition hover:bg-brand hover:text-white" aria-label="Moment sebelumnya"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={() => scrollMoments(1)} className="grid h-10 w-10 place-items-center rounded-xl bg-card text-foreground shadow-sm ring-1 ring-line backdrop-blur-sm transition hover:bg-brand hover:text-white" aria-label="Moment berikutnya"><ChevronRight className="h-5 w-5" /></button>
            </div>
            <button onClick={() => setComposerOpen(true)} className="btn btn-primary shadow-xl btn-lg hidden sm:flex w-full sm:w-auto font-extrabold text-sm sm:text-base px-6">
              <Camera className="h-5 w-5 mr-1.5" /> Tangkap Sekarang
            </button>
          </div>
        </div>
      </div>

      <div
        ref={railRef}
        className={`grid touch-pan-y auto-cols-[minmax(140px,42vw)] grid-flow-col gap-3 overflow-x-auto p-3.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:auto-cols-[160px] sm:px-4 ${railDragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
        onPointerDown={startRailDrag}
        onPointerMove={moveRail}
        onPointerUp={stopRailDrag}
        onPointerCancel={stopRailDrag}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
        aria-label="Carousel NutriVerse Moments"
      >
        {moments.length === 0 && (
          <div className="col-span-full grid min-h-40 place-items-center rounded-3xl border border-dashed border-line px-6 text-center text-xs text-muted-foreground">
            Belum ada Moment di database. Tangkap momen pertama melalui kamera.
          </div>
        )}
        {Array.from({ length: duplicateCount }).flatMap(() => moments).map((moment, index) => (
          <article key={`${moment.id}-${index}`} className="min-w-0 overflow-hidden rounded-[1.4rem] border border-line bg-secondary/25 shadow-sm">
            <button type="button" onClick={() => moment.image && setViewerMoment(moment)} disabled={!moment.image} className={`group relative block aspect-square w-full overflow-hidden text-left ${moment.image ? "cursor-zoom-in bg-[#07150f]" : index % 2 ? "bg-gradient-to-br from-[#15334a] via-[#1d7f87] to-[#efb46c]" : "bg-gradient-to-br from-[#063d2b] via-[#0b8054] to-[#a3e635]"}`} aria-label={moment.image ? `Lihat foto ${moment.name} secara penuh` : undefined}>
              {moment.image && <NextImage src={moment.image} alt={`Moment ${moment.name}`} fill unoptimized className="object-cover" />}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 via-black/15 to-transparent" />
              {!moment.image && <div className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-black/15 text-white/75 backdrop-blur-sm"><Camera className="h-6 w-6" /></span></div>}
              <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-1 text-[8px] font-bold text-white backdrop-blur"><BrandLogo compact className="h-4 w-4" />{moment.name}</span><span className="rounded-full bg-black/45 px-2 py-1 text-[7px] font-bold text-white backdrop-blur">{moment.privacy === "public" ? "KOMUNITAS" : moment.privacy === "friends" ? "TEMAN" : "PRIVAT"}</span></div>
              {moment.image && <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[7px] font-bold text-white opacity-100 backdrop-blur transition sm:opacity-0 sm:group-hover:opacity-100"><Maximize2 className="h-3 w-3" /> Lihat penuh</span>}
            </button>
            <div className="min-h-[58px] border-t border-line/70 bg-card px-3 py-2.5"><div className="flex items-start justify-between gap-2">{moment.duringActivity && <span className="shrink-0 rounded-full bg-brand-soft px-1.5 py-0.5 text-[7px] font-bold text-brand">SAAT AKTIVITAS</span>}<p className="ml-auto shrink-0 text-[8px] text-muted-foreground">{moment.time} · tanpa XP</p></div><p className="mt-1 line-clamp-2 text-[10px] font-bold leading-relaxed text-foreground">{moment.caption}</p></div>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5"><button onClick={() => encourageMoment(moment.id)} className="text-[9px] font-bold text-muted-foreground hover:text-brand">Beri Semangat{moment.reactionCount ? ` (${moment.reactionCount})` : ""}</button><div className="flex gap-1"><button onClick={() => downloadWatermarkedMoment(moment.image, moment.caption)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-brand" aria-label="Download template Moment NutriVerse"><Download className="h-3.5 w-3.5" /></button>{moment.isOwner && <button onClick={() => deleteMoment(moment.id)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Hapus Moment"><Trash2 className="h-3.5 w-3.5" /></button>}</div></div>
          </article>
        ))}
      </div>
      
      {moments.length > 4 && (
        <div className="mx-4 mb-4 mt-1 hidden h-1.5 overflow-hidden rounded-full bg-secondary/60 shadow-inner sm:block">
          <div ref={progressBarRef} className="h-full w-0 bg-brand rounded-full transition-none" />
        </div>
      )}

      {typeof document !== 'undefined' && createPortal(
        <>
          {/* Desktop Viewer */}
          {viewerMoment?.image && (
            <div className="fixed inset-0 z-[90] hidden sm:grid place-items-center bg-black/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Foto penuh dari ${viewerMoment.name}`} onClick={() => setViewerMoment(null)}>
              <section className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#07150f] shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white sm:px-5"><div className="min-w-0"><p className="truncate text-sm font-bold">Moment {viewerMoment.name}</p><p className="mt-0.5 text-[10px] text-white/60">{viewerMoment.privacy === "public" ? "Komunitas" : viewerMoment.privacy === "friends" ? "Teman" : "Privat"} · {viewerMoment.time}</p></div><button type="button" onClick={() => setViewerMoment(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="Tutup foto penuh"><X className="h-5 w-5" /></button></div>
                <div className="relative min-h-[50vh] flex-1 bg-black w-full"><NextImage src={viewerMoment.image} alt={`Moment penuh ${viewerMoment.name}`} fill unoptimized className="object-contain" /></div>
                <div className="border-t border-white/10 px-4 py-3 text-white sm:px-5"><p className="text-sm font-bold">{viewerMoment.caption}</p>{viewerMoment.duringActivity && <p className="mt-1 text-[10px] text-white/65">Diambil saat aktivitas · tidak menghasilkan XP</p>}</div>
              </section>
            </div>
          )}

          {/* Mobile Snap Scroll Viewer */}
          {viewerMoment && (
            <>
              <div 
                ref={mobileViewerRef}
                className="fixed inset-0 z-[100] flex flex-col bg-black overflow-y-auto snap-y snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden" 
                id="mobile-moment-viewer"
                style={{
                  transform: `translateY(-${pullDistance}px)`,
                  opacity: isDismissing ? 0 : Math.max(0, 1 - pullDistance / 250),
                  transition: pullDistance === 0 || isDismissing ? "transform 0.25s ease-out, opacity 0.25s ease-out" : "none",
                  overscrollBehaviorY: "contain"
                }}
              >
                {moments.filter((m, index, self) => index === self.findIndex((t) => t.id === m.id)).map((moment) => (
                  <section key={moment.id} id={`mobile-moment-${moment.id}`} className="relative h-[100dvh] w-full shrink-0 snap-start snap-always bg-black flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute inset-0 z-0">
                      <NextImage src={moment.image} alt={`Moment penuh ${moment.name}`} fill unoptimized className="object-cover" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 pt-12 pb-24 text-white">
                      <div className="min-w-0 drop-shadow-md">
                        <p className="truncate text-sm font-extrabold">{moment.name}</p>
                        <p className="mt-0.5 text-[10px] font-medium text-white/90">{moment.privacy === "public" ? "Komunitas" : moment.privacy === "friends" ? "Teman" : "Privat"} · {moment.time}</p>
                      </div>
                    </div>
                    <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pb-12 pt-24 text-white">
                      <p className="text-sm font-bold drop-shadow-md">{moment.caption}</p>
                      {moment.duringActivity && <p className="mt-1.5 text-[10px] font-semibold text-brand drop-shadow-md">SAAT AKTIVITAS</p>}
                    </div>
                  </section>
                ))}
              </div>
              
              {/* Close Button - Placed outside scrollable parent to ensure it stays fixed at top right */}
              <button 
                type="button" 
                onClick={() => setViewerMoment(null)} 
                className="fixed right-4 top-12 z-[110] grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition active:scale-95 sm:hidden shadow-lg border border-white/20" 
                aria-label="Tutup foto penuh"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          )}
        </>,
        document.body
      )}

      {composerOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black/70 p-0 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="moment-title">
          <section className="flex h-full max-h-[100dvh] w-full max-w-3xl flex-col rounded-none border border-line bg-card shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-[2rem]">
            <header className="shrink-0 z-10 flex items-center justify-between border-b border-line bg-card px-5 py-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand">NutriVerse Moments</p><h2 id="moment-title" className="mt-1 font-display text-lg font-extrabold">Bagikan momen sehatmu</h2></div><button onClick={closeComposer} className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tutup pembuat Moment"><X className="h-5 w-5" /></button></header>
            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_280px] sm:p-6">
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#101314]">
                  {photo ? <><NextImage src={photo} alt="" fill unoptimized className="scale-110 object-cover opacity-45 grayscale blur-2xl" /><NextImage src={photo} alt="Preview Moment penuh" fill unoptimized className="object-contain" /><div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07090a]/95" /><div className="pointer-events-none absolute inset-x-4 top-4 flex items-center gap-2.5 text-white drop-shadow-lg"><BrandLogo compact className="!h-9 !w-9" /><span className="font-display text-base font-extrabold tracking-[-0.05em]">Nutri<span className="text-emerald-300">Verse</span></span></div><div className="pointer-events-none absolute inset-x-5 bottom-5 text-center text-white"><p className="line-clamp-3 font-display text-[clamp(1.15rem,6vw,2rem)] font-extrabold leading-[1.04] tracking-tight drop-shadow-lg">{caption.trim() || "Satu momen sehat hari ini."}</p><div className="mx-auto mt-4 h-px w-3/4 bg-white/20" /><p className="mt-3 text-[8px] font-bold tracking-[0.12em] text-white/75">NUTRIVERSE • MOMENT SEHAT</p></div></> : <video ref={videoRef} muted playsInline className={`h-full w-full scale-x-[-1] object-cover ${cameraActive ? "block" : "hidden"}`} />}
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
                  <div className="grid gap-2"><button onClick={() => downloadWatermarkedMoment()} disabled={!photo || publishing} className="btn btn-outline"><Download className="h-4 w-4" /> {downloaded ? "PNG Tersimpan" : "Simpan PNG Template"}</button><button onClick={publishMoment} disabled={!photo || publishing} className="btn btn-primary"><Check className="h-4 w-4" /> {publishing ? "Menyimpan..." : "Bagikan Moment"}</button></div>
                  <p className="text-[9px] leading-relaxed text-muted-foreground">Moment hanya dapat dibuat melalui kamera langsung. Foto dinormalisasi ulang untuk membuang metadata EXIF/lokasi; PNG unduhan memadukan foto penuh, gradasi, identitas NutriVerse, dan caption.</p>
                </div>
              </div>
            </div>
          </section>
        </div>,
        document.body
      )}
      
      {typeof document !== 'undefined' && createPortal(
        <button onClick={() => setComposerOpen(true)} className="fixed bottom-28 right-4 z-[60] grid h-16 w-16 place-items-center rounded-full bg-brand text-white shadow-2xl transition-transform active:scale-95 sm:hidden" aria-label="Tangkap Momen">
          <Camera className="h-8 w-8" />
        </button>,
        document.body
      )}
    </section>
  );
}
