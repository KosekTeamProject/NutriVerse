"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, ChevronDown, ChevronUp, Heart, ImagePlus, LoaderCircle, Lock, MessageCircle, Send, ShieldCheck, Sparkles, Trash2, UserPlus, UsersRound, X } from "lucide-react";

type FeedScope = "public" | "community" | "friends";
type Audience = "PUBLIC" | "COMMUNITY" | "CIRCLE" | "PRIVATE";

type Moment = {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string | null;
  duringActivity: boolean;
  privacyLevel: string;
  createdAt: string;
  isOwner: boolean;
  likedByMe: boolean;
  user: { id: string; name: string; username: string | null; avatarUrl: string | null };
  activitySession: { id: string; activityType: string; startTime: string; distanceMeters: number; durationSeconds: number; verificationStatus: string } | null;
  community: { id: string; name: string; emblemUrl: string | null } | null;
  shareTemplate: { id: string; name: string; version: number } | null;
  _count: { reactions: number; comments: number };
  connection: { id: string | null; state: "SELF" | "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIEND" };
};

type MomentComment = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  canDelete: boolean;
  user: { id: string; name: string; username: string | null; avatarUrl: string | null };
};

type Community = { id: string; name: string };
type Activity = { id: string; activityType: string; startTime: string; distanceMeters: number; durationSeconds: number; caloriesBurned: number; verificationStatus: string };
type TemplateElement = { id: string; kind: "text" | "image"; dataKey?: string; staticText?: string; x: number; y: number; width: number; height: number; fontSize?: number; color?: string; align?: CanvasTextAlign; required?: boolean; userCanHide?: boolean };
type ShareTemplate = { id: string; name: string; category: string; description: string | null; aspectRatio: string; width: number; height: number; backgroundUrl: string | null; thumbnailUrl: string | null; layoutConfig: { elements?: TemplateElement[]; photoAsBackground?: boolean }; allowedDataKeys: string[]; version: number };
type StudioContext = { user: { name: string; username: string | null; avatarUrl: string | null }; progress: { totalXp: number; currentTier: string; streakDays: number } | null; healthPulse: { current: number | null; previous: number | null; delta: number | null; trend: string }; activities: Activity[] };

const AUDIENCES: Array<{ value: Audience; label: string; description: string; icon: typeof Lock }> = [
  { value: "PUBLIC", label: "Publik", description: "Semua user NutriVerse", icon: Sparkles },
  { value: "COMMUNITY", label: "Komunitas", description: "Anggota komunitas terpilih", icon: UsersRound },
  { value: "CIRCLE", label: "Teman", description: "Teman yang sudah diterima", icon: ShieldCheck },
  { value: "PRIVATE", label: "Hanya Saya", description: "Tampil di galeri profilmu", icon: Lock },
];

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)} jam lalu`;
  if (minutes < 10_080) return `${Math.floor(minutes / 1_440)} hari lalu`;
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function activityName(type?: string) {
  if (type === "RUN") return "Berlari";
  if (type === "CYCLED") return "Bersepeda";
  if (type === "WALK") return "Berjalan";
  return "Momen Harian";
}

function momentStatus(moment: Moment) {
  if (moment.shareTemplate) return `Studio Berbagi · ${moment.shareTemplate.name}`;
  if (moment.activitySession) return `${moment.duringActivity ? "Saat" : "Setelah"} ${activityName(moment.activitySession.activityType)}`;
  return "Momen Harian";
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    if (!source.startsWith("data:")) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.save(); context.beginPath(); context.rect(x, y, width, height); context.clip();
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight); context.restore();
}

export function NutriVerseMoments() {
  const [scope, setScope] = useState<FeedScope>("public");
  const [communityFilter, setCommunityFilter] = useState("");
  const [moments, setMoments] = useState<Moment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Moment | null>(null);
  const [comments, setComments] = useState<MomentComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<"capture" | "studio">("capture");
  const [sourcePhoto, setSourcePhoto] = useState<string | null>(null);
  const [outputPhoto, setOutputPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [audience, setAudience] = useState<Audience>("CIRCLE");
  const [targetCommunity, setTargetCommunity] = useState("");
  const [activityId, setActivityId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [templates, setTemplates] = useState<ShareTemplate[]>([]);
  const [studioContext, setStudioContext] = useState<StudioContext | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [composerMessage, setComposerMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef(0);
  const momentNavigationLockedRef = useRef(false);
  const commentRequestRef = useRef(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const selectedTemplate = useMemo(() => templates.find((template) => template.id === templateId) ?? null, [templateId, templates]);
  const selectedActivity = studioContext?.activities.find((activity) => activity.id === activityId) ?? studioContext?.activities[0] ?? null;
  const selectedTemplateUsesActivity = selectedTemplate?.allowedDataKeys.some((key) => key.startsWith("activity.")) ?? false;
  const selectedTemplateUsesPhoto = selectedTemplate?.allowedDataKeys.includes("moment.photo") ?? false;
  const selectedIndex = selected ? moments.findIndex((moment) => moment.id === selected.id) : -1;

  async function loadOptions() {
    const [communityResponse, templateResponse, contextResponse] = await Promise.all([
      fetch("/api/communities?scope=mine", { cache: "no-store" }),
      fetch("/api/share-templates", { cache: "no-store" }),
      fetch("/api/share-templates/context", { cache: "no-store" }),
    ]);
    const communityResult = await communityResponse.json().catch(() => null) as { communities?: Community[] } | null;
    const templateResult = await templateResponse.json().catch(() => null) as { templates?: ShareTemplate[] } | null;
    const contextResult = await contextResponse.json().catch(() => null) as { context?: StudioContext } | null;
    if (communityResponse.ok) setCommunities(communityResult?.communities ?? []);
    if (templateResponse.ok) {
      const publishedTemplates = templateResult?.templates ?? [];
      setTemplates(publishedTemplates);
      setTemplateId((current) => publishedTemplates.some((template) => template.id === current) ? current : publishedTemplates[0]?.id ?? "");
    }
    if (contextResponse.ok && contextResult?.context) {
      setStudioContext(contextResult.context);
      setActivityId((current) => current || contextResult.context?.activities[0]?.id || "");
    }
  }

  async function loadFeed(cursor?: string): Promise<Moment[]> {
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ scope, limit: "20" });
      if (cursor) params.set("cursor", cursor);
      if (scope === "community" && communityFilter) params.set("communityId", communityFilter);
      const response = await fetch(`/api/moments?${params}`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as { success?: boolean; moments?: Moment[]; nextCursor?: string | null; error?: string } | null;
      if (!response.ok || !result?.success) { setError(result?.error ?? "Feed momen belum dapat dimuat."); return []; }
      const receivedMoments = result.moments ?? [];
      setMoments((current) => cursor ? [...current, ...receivedMoments.filter((item) => !current.some((old) => old.id === item.id))] : receivedMoments);
      setNextCursor(result.nextCursor ?? null);
      return receivedMoments;
    } catch {
      setError("Feed momen belum dapat dimuat. Periksa koneksi lalu coba lagi.");
      return [];
    } finally { setLoading(false); setLoadingMore(false); }
  }

  useEffect(() => { const timer = window.setTimeout(() => void loadOptions(), 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => () => { streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play();
  }, [cameraActive]);
  useEffect(() => {
    if (!composerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraActive(false);
      setComposerOpen(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [composerOpen]);
  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelected(null);
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        void navigateMoment(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        void navigateMoment(-1);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  // Navigasi memakai snapshot feed pada saat momen aktif berubah.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
  useEffect(() => {
    if (!composerOpen || composerMode !== "studio" || !selectedTemplate || cameraActive) return;
    const timer = window.setTimeout(() => void renderStudio(selectedTemplate, sourcePhoto), 120);
    return () => window.clearTimeout(timer);
    // Rendering canvas mengikuti template admin dan data terbaru tanpa kontrol field dari user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive, caption, composerMode, composerOpen, selectedActivity, selectedTemplate, sourcePhoto, studioContext]);
  // Feed harus dimuat ulang hanya ketika filter audiens berubah.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const timer = window.setTimeout(() => void loadFeed(), 0); return () => window.clearTimeout(timer); }, [scope, communityFilter]);

  function chooseScope(nextScope: FeedScope) { setScope(nextScope); setCommunityFilter(""); setMoments([]); }

  async function openMoment(moment: Moment) {
    const requestId = commentRequestRef.current + 1;
    commentRequestRef.current = requestId;
    setSelected(moment); setComments([]); setCommentsLoading(true);
    try {
      const response = await fetch(`/api/moments/${moment.id}/comments`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as { comments?: MomentComment[] } | null;
      if (requestId === commentRequestRef.current && response.ok) setComments(result?.comments ?? []);
    } finally {
      if (requestId === commentRequestRef.current) setCommentsLoading(false);
    }
  }

  async function navigateMoment(direction: -1 | 1) {
    if (!selected || momentNavigationLockedRef.current) return;
    const currentIndex = moments.findIndex((moment) => moment.id === selected.id);
    if (currentIndex < 0) return;

    const target = moments[currentIndex + direction];
    if (target) {
      momentNavigationLockedRef.current = true;
      void openMoment(target);
      window.setTimeout(() => { momentNavigationLockedRef.current = false; }, 420);
      return;
    }

    if (direction === 1 && nextCursor && !loadingMore) {
      momentNavigationLockedRef.current = true;
      const loadedMoments = await loadFeed(nextCursor);
      const nextMoment = loadedMoments.find((moment) => moment.id !== selected.id);
      if (nextMoment) void openMoment(nextMoment);
      window.setTimeout(() => { momentNavigationLockedRef.current = false; }, 420);
    }
  }

  function handleMomentWheel(event: React.WheelEvent) {
    if (window.innerWidth < 1024) return;
    event.preventDefault();
    wheelDeltaRef.current += event.deltaY;
    if (Math.abs(wheelDeltaRef.current) < 60) return;
    const direction: -1 | 1 = wheelDeltaRef.current > 0 ? 1 : -1;
    wheelDeltaRef.current = 0;
    void navigateMoment(direction);
  }

  function handleMomentTouchEnd(event: React.TouchEvent) {
    const startY = touchStartYRef.current;
    touchStartYRef.current = null;
    if (startY === null) return;
    const endY = event.changedTouches[0]?.clientY ?? startY;
    const distance = startY - endY;
    if (Math.abs(distance) < 55) return;
    void navigateMoment(distance > 0 ? 1 : -1);
  }

  function updateMoment(id: string, update: (moment: Moment) => Moment) {
    setMoments((current) => current.map((moment) => moment.id === id ? update(moment) : moment));
    setSelected((current) => current?.id === id ? update(current) : current);
  }

  async function toggleLike(moment: Moment) {
    const response = await fetch(`/api/moments/${moment.id}/reaction`, { method: moment.likedByMe ? "DELETE" : "PUT", headers: { "Content-Type": "application/json" }, body: moment.likedByMe ? undefined : JSON.stringify({ type: "ENCOURAGE" }) });
    if (!response.ok) return;
    updateMoment(moment.id, (item) => ({ ...item, likedByMe: !item.likedByMe, _count: { ...item._count, reactions: Math.max(0, item._count.reactions + (item.likedByMe ? -1 : 1)) } }));
  }

  async function addComment(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !commentDraft.trim() || commentBusy) return;
    setCommentBusy(true);
    const response = await fetch(`/api/moments/${selected.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: commentDraft.trim() }) });
    const result = await response.json().catch(() => null) as { comment?: MomentComment } | null;
    setCommentBusy(false);
    if (!response.ok || !result?.comment) return;
    setComments((current) => [...current, result.comment as MomentComment]); setCommentDraft("");
    updateMoment(selected.id, (item) => ({ ...item, _count: { ...item._count, comments: item._count.comments + 1 } }));
  }

  async function removeComment(comment: MomentComment) {
    if (!selected) return;
    const response = await fetch(`/api/moments/${selected.id}/comments/${comment.id}`, { method: "DELETE" });
    if (!response.ok) return;
    setComments((current) => current.filter((item) => item.id !== comment.id));
    updateMoment(selected.id, (item) => ({ ...item, _count: { ...item._count, comments: Math.max(0, item._count.comments - 1) } }));
  }

  async function follow(moment: Moment) {
    if (moment.connection.state !== "NONE" && moment.connection.state !== "PENDING_RECEIVED") return;
    const response = await fetch("/api/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUserId: moment.userId }) });
    if (!response.ok) return;
    const nextState: Moment["connection"]["state"] = moment.connection.state === "PENDING_RECEIVED" ? "FRIEND" : "PENDING_SENT";
    setMoments((current) => current.map((item) => item.userId === moment.userId ? { ...item, connection: { ...item.connection, state: nextState } } : item));
    setSelected((current) => current?.userId === moment.userId ? { ...current, connection: { ...current.connection, state: nextState } } : current);
  }

  function readPhoto(file?: File) {
    if (!file || !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) { setComposerMessage("Gunakan gambar maksimal 10 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : null;
      setSourcePhoto(value);
      if (composerMode === "capture") setOutputPhoto(value);
      else if (selectedTemplate) void renderStudio(selectedTemplate, value);
    };
    reader.readAsDataURL(file);
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }

  async function startCamera() {
    stopCamera();
    setCameraError("");
    setComposerMessage("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Kamera tidak didukung oleh browser ini.");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1080 },
          height: { ideal: 1350 },
        },
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (error) {
      setCameraActive(false);
      setCameraError(error instanceof Error && error.message.includes("didukung")
        ? error.message
        : "Kamera tidak dapat dibuka. Izinkan akses kamera pada browser, lalu coba lagi.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      setCameraError("Kamera belum siap. Tunggu sebentar lalu ambil foto kembali.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL("image/jpeg", 0.92);
    setSourcePhoto(photo);
    if (composerMode === "studio" && selectedTemplate) void renderStudio(selectedTemplate, photo);
    else setOutputPhoto(photo);
    stopCamera();
  }

  function closeComposer() {
    stopCamera();
    setComposerOpen(false);
  }

  function templateValue(key: string) {
    const context = studioContext;
    const activity = selectedActivity;
    const values: Record<string, string> = {
      "user.name": context?.user.name ?? "NutriVerse User",
      "user.username": `@${context?.user.username ?? "username"}`,
      "moment.caption": caption || "Momen sehatku hari ini",
      "activity.type": activityName(activity?.activityType),
      "activity.date": activity ? new Date(activity.startTime).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Belum ada aktivitas",
      "activity.distance": activity ? `${(activity.distanceMeters / 1_000).toFixed(2)} km` : "0,00 km",
      "activity.duration": activity ? `${Math.round(activity.durationSeconds / 60)} menit` : "0 menit",
      "activity.calories": activity ? `${Math.round(activity.caloriesBurned)} kkal` : "0 kkal",
      "progress.streak": `${context?.progress?.streakDays ?? 0} hari streak`,
      "progress.rank": context?.progress?.currentTier ?? "SPROUT",
      "progress.xp": `${context?.progress?.totalXp ?? 0} XP`,
      "healthPulse.current": context?.healthPulse.current === null || context?.healthPulse.current === undefined ? "Health Pulse belum tersedia" : `Health Pulse ${context.healthPulse.current.toFixed(0)}`,
      "healthPulse.previous": context?.healthPulse.previous === null || context?.healthPulse.previous === undefined ? "Belum ada pembanding" : `Sebelumnya ${context.healthPulse.previous.toFixed(0)}`,
      "healthPulse.delta": context?.healthPulse.delta === null || context?.healthPulse.delta === undefined ? "Tren Health Pulse belum tersedia" : `${context.healthPulse.delta >= 0 ? "↑" : "↓"} ${Math.abs(context.healthPulse.delta).toFixed(1)} poin Health Pulse`,
      "healthPulse.trend": context?.healthPulse.trend === "UP" ? "Meningkat" : context?.healthPulse.trend === "DOWN" ? "Menurun" : "Stabil",
    };
    return values[key] ?? key;
  }

  async function renderStudio(template: ShareTemplate | null = selectedTemplate, photoSource: string | null = sourcePhoto) {
    setComposerMessage("");
    if (!template) { setOutputPhoto(null); setComposerMessage("Belum ada template yang dipublikasikan admin."); return null; }
    const usesActivity = template.allowedDataKeys.some((key) => key.startsWith("activity."));
    const requiresPhoto = template.layoutConfig.elements?.some((element) => element.dataKey === "moment.photo" && element.required) ?? false;
    if (usesActivity && !selectedActivity) { setOutputPhoto(null); setComposerMessage("Template ini memerlukan aktivitas tervalidasi. Selesaikan aktivitas terlebih dahulu."); return null; }
    if (requiresPhoto && !photoSource) { setOutputPhoto(null); setComposerMessage("Template ini memerlukan foto. Ambil atau unggah foto terlebih dahulu."); return null; }
    const canvas = document.createElement("canvas"); canvas.width = template.width; canvas.height = template.height;
    const context = canvas.getContext("2d"); if (!context) return null;
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height); gradient.addColorStop(0, "#052f22"); gradient.addColorStop(0.55, "#00a874"); gradient.addColorStop(1, "#a3e635"); context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height);
    if (template.layoutConfig.photoAsBackground && photoSource) {
      try { drawCover(context, await loadImage(photoSource), 0, 0, canvas.width, canvas.height); }
      catch { setComposerMessage("Foto background gagal dimuat. Pilih foto lain lalu coba kembali."); return null; }
    }
    if (template.backgroundUrl) { try { drawCover(context, await loadImage(template.backgroundUrl), 0, 0, canvas.width, canvas.height); } catch { setComposerMessage("Background template gagal dimuat; preview memakai warna NutriVerse."); } }
    for (const element of template.layoutConfig.elements ?? []) {
      if (template.layoutConfig.photoAsBackground && element.dataKey === "moment.photo") continue;
      const x = canvas.width * element.x / 100, y = canvas.height * element.y / 100, width = canvas.width * element.width / 100, height = canvas.height * element.height / 100;
      if (element.kind === "image") {
        const imageSource = element.dataKey === "moment.photo" ? photoSource : element.dataKey === "user.avatar" ? studioContext?.user.avatarUrl : null;
        if (imageSource) { try { drawCover(context, await loadImage(imageSource), x, y, width, height); } catch { /* elemen gambar opsional */ } }
        continue;
      }
      context.save(); context.fillStyle = element.color ?? "#ffffff"; context.font = `800 ${element.fontSize ?? 32}px Arial`; context.textAlign = element.align ?? "left"; context.textBaseline = "top";
      const textX = element.align === "center" ? x + width / 2 : element.align === "right" ? x + width : x;
      context.fillText(element.staticText ?? templateValue(element.dataKey ?? ""), textX, y, width); context.restore();
    }
    context.fillStyle = "rgba(0,0,0,.28)"; context.fillRect(0, canvas.height - 54, canvas.width, 54); context.fillStyle = "#ffffff"; context.font = "700 20px Arial"; context.textAlign = "center"; context.fillText("NUTRIVERSE • STUDIO BERBAGI", canvas.width / 2, canvas.height - 36);
    const renderedPhoto = canvas.toDataURL("image/jpeg", 0.92);
    setOutputPhoto(renderedPhoto);
    return renderedPhoto;
  }

  function selectStudioTemplate(template: ShareTemplate) {
    setTemplateId(template.id);
    setOutputPhoto(null);
    void renderStudio(template, sourcePhoto);
  }

  async function publish() {
    if (publishing) return;
    if (audience === "COMMUNITY" && !targetCommunity) { setComposerMessage("Pilih komunitas tujuan."); return; }
    setPublishing(true); setComposerMessage("");
    try {
      const photoToPublish = composerMode === "studio" ? await renderStudio(selectedTemplate, sourcePhoto) : outputPhoto;
      if (!photoToPublish) { setComposerMessage("Pilih template yang tersedia dan lengkapi kebutuhannya."); return; }
      const blob = await fetch(photoToPublish).then((response) => response.blob());
      const form = new FormData(); form.set("bucket", "moments"); form.set("file", new File([blob], "moment.jpg", { type: blob.type || "image/jpeg" }));
      const uploadResponse = await fetch("/api/storage/upload", { method: "POST", body: form });
      const upload = await uploadResponse.json().catch(() => null) as { path?: string; error?: string } | null;
      if (!uploadResponse.ok || !upload?.path) { setComposerMessage(`Upload foto gagal: ${upload?.error ?? "Storage tidak menerima foto."}`); return; }
      const studioActivityId = composerMode === "studio" && selectedTemplateUsesActivity ? selectedActivity?.id ?? null : activityId || null;
      const response = await fetch("/api/moments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imagePath: upload.path, caption, privacyLevel: audience, communityId: audience === "COMMUNITY" ? targetCommunity : null, activitySessionId: studioActivityId, duringActivity: Boolean(studioActivityId), shareTemplateId: composerMode === "studio" ? templateId || null : null }) });
      const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      if (!response.ok || !result?.success) { setComposerMessage(`Penyimpanan Momen gagal: ${result?.error ?? "Record Momen tidak dapat dibuat."}`); return; }
      closeComposer(); setSourcePhoto(null); setOutputPhoto(null); setCaption(""); setComposerMessage("");
      if ((scope === "public" && audience === "PUBLIC") || (scope === "community" && audience === "COMMUNITY") || (scope === "friends" && audience === "CIRCLE")) await loadFeed();
    } finally { setPublishing(false); }
  }

  function openComposer(mode: "capture" | "studio") {
    stopCamera();
    setComposerMode(mode);
    setComposerOpen(true);
    setComposerMessage("");
    setCameraError("");
    setSourcePhoto(null);
    setOutputPhoto(null);
    if (mode === "capture") window.setTimeout(() => void startCamera(), 0);
    else window.setTimeout(() => void renderStudio(selectedTemplate, null), 0);
  }
  const followLabel = (moment: Moment) => moment.connection.state === "FRIEND" ? "Teman" : moment.connection.state === "PENDING_SENT" ? "Menunggu" : moment.connection.state === "PENDING_RECEIVED" ? "Terima" : "Ikuti";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-line bg-card shadow-soft"><div className="relative overflow-hidden bg-gradient-to-br from-[#063c2b] via-brand to-lime p-6 text-white sm:p-8"><div className="absolute -right-10 -top-12 h-52 w-52 rounded-full border-[34px] border-white/10" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/75">NutriVerse Moments</p><h1 className="mt-2 max-w-xl font-display text-3xl font-extrabold">Cerita sehat yang dekat, relevan, dan terkontrol.</h1><p className="mt-2 max-w-2xl text-sm text-white/80">Lihat momen publik, komunitas yang kamu ikuti, atau temanmu dalam feed yang terpisah.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => openComposer("studio")} className="btn border-white/30 bg-white/10 text-white hover:bg-white/20"><Sparkles className="h-4 w-4" /> Studio Berbagi</button><button onClick={() => openComposer("capture")} className="btn bg-white text-[#06422f] hover:bg-white/90"><Camera className="h-4 w-4" /> Ambil Momen</button></div></div></div></section>

      <section className="mx-auto w-full space-y-5">
        <nav className="grid grid-cols-3 gap-1 rounded-2xl border border-line bg-secondary p-1" aria-label="Filter momen">
          {(["public", "community", "friends"] as FeedScope[]).map((item) => (
            <button
              key={item}
              onClick={() => chooseScope(item)}
              className={"rounded-xl px-2 py-3 text-xs font-bold transition " + (scope === item ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {item === "public" ? "Momen Publik" : item === "community" ? "Momen Komunitas" : "Momen Teman"}
            </button>
          ))}
        </nav>

        {scope === "community" && communities.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCommunityFilter("")}
              className={"shrink-0 rounded-full px-3 py-2 text-[10px] font-bold " + (!communityFilter ? "bg-brand text-white" : "bg-secondary text-muted-foreground")}
            >
              Semua Komunitas
            </button>
            {communities.map((community) => (
              <button
                key={community.id}
                onClick={() => setCommunityFilter(community.id)}
                className={"shrink-0 rounded-full px-3 py-2 text-[10px] font-bold " + (communityFilter === community.id ? "bg-brand text-white" : "bg-secondary text-muted-foreground")}
              >
                {community.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid min-h-80 place-items-center rounded-3xl border border-line bg-card">
            <div className="text-center">
              <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-brand" />
              <p className="mt-3 text-xs text-muted-foreground">Memuat momen…</p>
            </div>
          </div>
        ) : error && moments.length === 0 ? (
          <div className="grid min-h-72 place-items-center rounded-3xl border border-line bg-card p-6 text-center">
            <div>
              <p className="text-sm font-bold">Feed belum dapat dimuat</p>
              <p className="mt-2 text-xs text-muted-foreground">{error}</p>
              <button onClick={() => void loadFeed()} className="btn btn-outline btn-sm mt-4">Coba Lagi</button>
            </div>
          </div>
        ) : moments.length === 0 ? (
          <div className="grid min-h-72 w-full place-items-center rounded-3xl border border-dashed border-line bg-card p-6 text-center">
            <div>
              <ImagePlus className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-4 text-sm font-bold">Belum ada momen di sini</p>
              <p className="mt-2 text-xs text-muted-foreground">Momen akan muncul sesuai audiens yang dipilih pengunggah.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-2xl sm:gap-2 lg:grid-cols-3 2xl:grid-cols-4">
            {moments.map((moment) => (
              <button
                key={moment.id}
                type="button"
                onClick={() => void openMoment(moment)}
                className="group relative aspect-square min-w-0 overflow-hidden bg-[#06110d] outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-brand sm:rounded-xl"
                aria-label={`Buka momen ${moment.user.name}`}
              >
                <NextImage
                  src={moment.imageUrl}
                  alt={moment.caption ?? `Momen ${moment.user.name}`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 33vw, (max-width: 1536px) 33vw, 25vw"
                  className="object-cover transition duration-300 group-hover:scale-[1.025]"
                />
                <span className="absolute inset-0 hidden items-center justify-center gap-5 bg-black/45 text-white opacity-0 transition group-hover:opacity-100 sm:flex">
                  <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
                    <Heart className="h-5 w-5 fill-current" /> {moment._count.reactions}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
                    <MessageCircle className="h-5 w-5 fill-current" /> {moment._count.comments}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {nextCursor && (
          <div className="text-center">
            <button disabled={loadingMore} onClick={() => void loadFeed(nextCursor)} className="btn btn-outline">
              {loadingMore ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Memuat…</> : "Muat Lebih Banyak"}
            </button>
          </div>
        )}
      </section>


      {selected && typeof document !== "undefined" && createPortal((
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-sm lg:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Detail momen"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}
        >
          <article
            key={selected.id}
            className="flex h-[100dvh] w-full flex-col overflow-y-auto bg-card shadow-2xl lg:grid lg:h-[min(88dvh,820px)] lg:max-w-6xl lg:grid-cols-[minmax(0,1fr)_400px] lg:overflow-hidden lg:rounded-3xl lg:border lg:border-line"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-line bg-card/95 p-3 backdrop-blur lg:hidden">
              <Link href={selected.isOwner ? "/profil" : `/profil/${selected.user.id}`} className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-xs font-bold text-white">
                {selected.user.avatarUrl ? <NextImage src={selected.user.avatarUrl} alt="" fill unoptimized className="object-cover" /> : initials(selected.user.name)}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-extrabold">{selected.user.name}</p>
                <p className="truncate text-[9px] text-muted-foreground">@{selected.user.username ?? "pengguna"} · {relativeTime(selected.createdAt)}</p>
              </div>
              {scope === "public" && !selected.isOwner && (
                <button disabled={selected.connection.state === "PENDING_SENT" || selected.connection.state === "FRIEND"} onClick={() => void follow(selected)} className="btn btn-outline btn-sm px-3 text-[10px]">
                  {followLabel(selected)}
                </button>
              )}
              <button onClick={() => setSelected(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div
              className="relative aspect-[4/5] w-full shrink-0 touch-none bg-black lg:aspect-auto lg:h-full lg:min-h-0"
              onWheel={handleMomentWheel}
              onTouchStart={(event) => { touchStartYRef.current = event.touches[0]?.clientY ?? null; }}
              onTouchEnd={handleMomentTouchEnd}
            >
              <NextImage
                src={selected.imageUrl}
                alt={selected.caption ?? "Momen NutriVerse"}
                fill
                unoptimized
                sizes="(max-width: 1023px) 100vw, 70vw"
                className="object-contain"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center lg:hidden">
                <span className="rounded-full bg-black/55 px-3 py-1.5 text-[9px] font-bold text-white backdrop-blur">Geser ↑↓ untuk momen lain</span>
              </div>
              <nav className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-2 lg:flex" aria-label="Navigasi antar momen">
                <button
                  type="button"
                  disabled={selectedIndex <= 0}
                  onClick={() => void navigateMoment(-1)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Momen sebelumnya"
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  disabled={selectedIndex >= moments.length - 1 && !nextCursor}
                  onClick={() => void navigateMoment(1)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Momen berikutnya"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              </nav>
            </div>

            <aside className="flex min-h-0 flex-col bg-card lg:h-full">
              <header className="hidden shrink-0 items-center gap-3 border-b border-line p-4 lg:flex">
                <Link href={selected.isOwner ? "/profil" : `/profil/${selected.user.id}`} className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-xs font-bold text-white">
                  {selected.user.avatarUrl ? <NextImage src={selected.user.avatarUrl} alt="" fill unoptimized className="object-cover" /> : initials(selected.user.name)}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{selected.user.name}</p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">@{selected.user.username ?? "pengguna"} · {relativeTime(selected.createdAt)}</p>
                  <p className="mt-1 truncate text-[9px] font-bold text-brand">{momentStatus(selected)}{selected.community ? ` · ${selected.community.name}` : ""}</p>
                </div>
                {scope === "public" && !selected.isOwner && (
                  <button disabled={selected.connection.state === "PENDING_SENT" || selected.connection.state === "FRIEND"} onClick={() => void follow(selected)} className="btn btn-outline btn-sm px-3">
                    <UserPlus className="h-4 w-4" /> {followLabel(selected)}
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tutup">
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div ref={detailScrollRef} className="overscroll-contain p-4 [scrollbar-gutter:stable] lg:min-h-0 lg:flex-1 lg:overflow-y-scroll lg:p-5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-brand">
                  {momentStatus(selected)}{selected.community ? ` · ${selected.community.name}` : ""}
                </p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => void toggleLike(selected)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold ${selected.likedByMe ? "bg-rose-500/10 text-rose-500" : "bg-secondary text-muted-foreground"}`}>
                    <Heart className={`h-4 w-4 ${selected.likedByMe ? "fill-current" : ""}`} />
                    {selected._count.reactions} Suka
                  </button>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-bold text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    {selected._count.comments} Komentar
                  </span>
                </div>

                {selected.caption && (
                  <p className="mt-4 border-b border-line pb-4 text-sm leading-6">
                    <span className="mr-2 font-extrabold">{selected.user.username ?? selected.user.name}</span>
                    {selected.caption}
                  </p>
                )}

                <section className="pt-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Komentar</h3>
                  {commentsLoading ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">Memuat komentar…</p>
                  ) : comments.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">Belum ada komentar. Jadilah yang pertama.</p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-[10px] font-bold">
                            {comment.user.avatarUrl ? <NextImage src={comment.user.avatarUrl} alt="" fill unoptimized className="object-cover" /> : initials(comment.user.name)}
                          </span>
                          <div className="min-w-0 flex-1 rounded-2xl bg-secondary/60 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-[10px] font-extrabold">{comment.user.name}</p>
                              <span className="shrink-0 text-[8px] text-muted-foreground">{relativeTime(comment.createdAt)}</span>
                              {comment.canDelete && (
                                <button onClick={() => void removeComment(comment)} className="ml-auto text-rose-500" aria-label="Hapus komentar">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 break-words text-xs leading-5">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <form onSubmit={addComment} className="flex shrink-0 gap-2 border-t border-line bg-card p-3 sm:p-4">
                <input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength={500} className="input min-w-0 flex-1" placeholder="Tulis komentar…" />
                <button disabled={commentBusy || !commentDraft.trim()} className="btn btn-primary shrink-0 px-4" aria-label="Kirim komentar">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </aside>
          </article>
        </div>
      ), document.body)}

      {composerOpen && typeof document !== "undefined" && createPortal((
        <div
          className={"fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/65 p-3 transition sm:p-6 " + (cameraActive ? "backdrop-blur-md" : "backdrop-blur-sm")}
          role="dialog"
          aria-modal="true"
          aria-label={composerMode === "studio" ? "Studio Berbagi" : "Buat momen"}
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeComposer(); }}
        >
          <section className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <header className="z-20 flex shrink-0 items-center justify-between border-b border-line bg-card px-4 py-3 sm:px-5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand">
                  {composerMode === "studio" ? "Studio Berbagi NutriVerse" : "NutriVerse Moments"}
                </p>
                <h2 className="mt-1 font-display text-lg font-extrabold">
                  {composerMode === "studio" ? "Pilih template untuk ceritamu" : "Bagikan momen sehatmu"}
                </h2>
              </div>
              <button onClick={closeComposer} className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-4 sm:grid-cols-[minmax(0,1fr)_300px] sm:p-5">
              <div className="min-w-0">
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#07150f]">
                  {cameraActive ? (
                    <video ref={videoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-contain" />
                  ) : outputPhoto ? (
                    <NextImage src={outputPhoto} alt="Preview momen" fill unoptimized className="object-contain" />
                  ) : sourcePhoto ? (
                    <NextImage src={sourcePhoto} alt="Foto sumber" fill unoptimized className="object-contain" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                      <div>
                        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/10">
                          <Camera className="h-8 w-8" />
                        </span>
                        <p className="mt-4 text-sm font-bold">
                          {composerMode === "capture" ? "Kamera belum aktif" : selectedTemplateUsesPhoto ? "Tambahkan foto ke template" : "Pilih template dari admin"}
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          {composerMode === "capture" ? "Izinkan kamera untuk mengambil Momen secara langsung." : selectedTemplateUsesPhoto ? "Gunakan kamera atau unggah foto untuk melengkapi template." : "Preview otomatis dibuat setelah template dipilih."}
                        </p>
                        {(composerMode === "capture" || selectedTemplateUsesPhoto) && <button onClick={() => void startCamera()} className="btn mt-5 bg-white text-[#07150f]">Aktifkan Kamera</button>}
                      </div>
                    </div>
                  )}

                  {cameraActive && (
                    <button
                      onClick={capturePhoto}
                      className="absolute bottom-5 left-1/2 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-brand text-white shadow-xl transition active:scale-95"
                      aria-label="Ambil foto"
                    >
                      <Camera className="h-7 w-7" />
                    </button>
                  )}

                  <div className="absolute left-4 top-4 rounded-full bg-black/50 px-2.5 py-1.5 text-[8px] font-bold text-white backdrop-blur">
                    NUTRIVERSE · TANPA XP
                  </div>
                </div>

                {cameraError && (
                  <div className="mt-3 rounded-xl border border-amber/25 bg-amber/10 p-3 text-[10px] leading-relaxed text-amber">
                    {cameraError}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {!cameraActive && composerMode === "capture" && outputPhoto && (
                    <button onClick={() => void startCamera()} className="btn btn-outline btn-sm">
                      <Camera className="h-4 w-4" /> Ambil Ulang
                    </button>
                  )}
                  {composerMode === "studio" && selectedTemplateUsesPhoto && (
                    <>
                      <button onClick={() => void startCamera()} className="btn btn-outline btn-sm">
                        <Camera className="h-4 w-4" /> Buka Kamera
                      </button>
                      <label className="btn btn-outline btn-sm cursor-pointer">
                        <ImagePlus className="h-4 w-4" /> Upload Foto
                        <input type="file" accept="image/*" className="sr-only" onChange={(event) => readPhoto(event.target.files?.[0])} />
                      </label>
                    </>
                  )}
                </div>

                <p className="mt-2 text-center text-[9px] leading-relaxed text-muted-foreground">
                  {composerMode === "studio" ? "Template dan data dikendalikan admin. Foto hanya diminta jika desain menggunakannya." : "Foto tampil utuh dan metadata lokasi tidak digunakan. Ambil Momen hanya menerima kamera langsung."}
                </p>
              </div>

              <div className={composerMode === "capture" ? "min-w-0 space-y-3" : "min-w-0 space-y-4"}>
                {composerMode === "studio" && (
                  <>
                    <div>
                      <div className="flex items-end justify-between gap-3">
                        <div><span className="label">Pilih Template</span><p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">Isi data dan tata letak sudah ditentukan admin.</p></div>
                        <span className="shrink-0 rounded-full bg-brand-soft px-2 py-1 text-[8px] font-bold text-brand">{templates.length} tersedia</span>
                      </div>
                      {templates.length ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {templates.map((template) => {
                            const active = template.id === templateId;
                            const usesPhoto = template.allowedDataKeys.includes("moment.photo");
                            const usesActivity = template.allowedDataKeys.some((key) => key.startsWith("activity."));
                            const unavailable = usesActivity && !selectedActivity;
                            return (
                              <button
                                key={template.id}
                                type="button"
                                disabled={unavailable}
                                onClick={() => selectStudioTemplate(template)}
                                className={`overflow-hidden rounded-2xl border text-left transition ${active ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-line bg-secondary/25 hover:border-brand/40"} disabled:cursor-not-allowed disabled:opacity-45`}
                              >
                                <span className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#07553b] via-brand to-lime">
                                  {(template.thumbnailUrl || template.backgroundUrl) && <NextImage src={template.thumbnailUrl || template.backgroundUrl || ""} alt="" fill unoptimized className="object-cover" />}
                                  {active && <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-brand text-white shadow"><Check className="h-3.5 w-3.5" /></span>}
                                </span>
                                <span className="block p-2.5">
                                  <span className="block truncate text-[10px] font-extrabold">{template.name}</span>
                                  <span className="mt-1 block truncate text-[8px] text-muted-foreground">{template.category} · v{template.version}</span>
                                  <span className="mt-2 flex flex-wrap gap-1">
                                    {usesPhoto && <span className="rounded-full bg-card px-1.5 py-1 text-[7px] font-bold text-muted-foreground">Foto</span>}
                                    {usesActivity && <span className="rounded-full bg-card px-1.5 py-1 text-[7px] font-bold text-muted-foreground">Aktivitas terbaru</span>}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-2xl border border-dashed border-line p-5 text-center">
                          <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground" />
                          <p className="mt-2 text-[10px] font-bold">Belum ada template tersedia</p>
                          <p className="mt-1 text-[8px] text-muted-foreground">Template akan muncul setelah dipublikasikan admin.</p>
                        </div>
                      )}
                    </div>
                    {selectedTemplate && <div className="rounded-xl border border-brand/20 bg-brand-soft/60 p-3"><p className="text-[10px] font-extrabold text-brand">{selectedTemplate.name}</p><p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">{selectedTemplate.description || `Data ${selectedTemplateUsesActivity ? "aktivitas terbaru dan " : ""}profil diisi otomatis sesuai rancangan admin.`}</p></div>}
                  </>
                )}

                <label>
                  <span className="label">Caption</span>
                  <textarea value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={280} rows={4} className="input mt-1 min-h-24 resize-none" placeholder="Ceritakan momen sehatmu…" />
                  <span className="mt-1 block text-right text-[9px] text-muted-foreground">{caption.length}/280</span>
                </label>

                <div>
                  <span className="label">Audiens</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {AUDIENCES.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setAudience(option.value)}
                          className={"rounded-xl border p-2 text-center " + (audience === option.value ? "border-brand bg-brand-soft text-brand" : "border-line text-muted-foreground")}
                        >
                          <Icon className="mx-auto h-4 w-4" />
                          <p className="mt-1 text-[9px] font-extrabold">{option.label}</p>
                          {composerMode === "studio" && <p className="mt-1 text-[8px] text-muted-foreground">{option.description}</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {audience === "COMMUNITY" && (
                  <label>
                    <span className="label">Komunitas tujuan</span>
                    <select value={targetCommunity} onChange={(event) => setTargetCommunity(event.target.value)} className="input mt-1">
                      <option value="">Pilih komunitas</option>
                      {communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
                    </select>
                  </label>
                )}

                {composerMode === "capture" && (
                  <label>
                    <span className="label">Hubungkan aktivitas (opsional)</span>
                    <select value={activityId} onChange={(event) => setActivityId(event.target.value)} className="input mt-1">
                      <option value="">Momen harian</option>
                      {studioContext?.activities.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activityName(activity.activityType)} · {(activity.distanceMeters / 1000).toFixed(2)} km
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {composerMessage && <p className="rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">{composerMessage}</p>}

                <button onClick={() => void publish()} disabled={publishing || !outputPhoto || cameraActive} className="btn btn-primary w-full disabled:opacity-45">
                  <Check className="h-4 w-4" />{publishing ? "Menyimpan…" : "Bagikan Momen"}
                </button>
                <p className="text-[9px] leading-relaxed text-muted-foreground">
                  Foto user lain tidak dapat diunduh. Hasil Studio dan foto milikmu sendiri tetap tersedia melalui galeri profil.
                </p>
              </div>
            </div>
          </section>
        </div>
      ), document.body)}
    </div>
  );
}
