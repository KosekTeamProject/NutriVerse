"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Archive, Ban, Bookmark, Camera, Check, ChevronDown, ChevronUp, Eye, EyeOff, Flag, Heart, ImagePlus, LoaderCircle, Lock, MessageCircle, MoreHorizontal, Pencil, Send, ShieldCheck, Sparkles, Trash2, UserPlus, UsersRound, VolumeX, X } from "lucide-react";

type FeedScope = "public" | "community" | "friends" | "saved";
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
  bookmarkedByMe: boolean;
  likeCount: number | null;
  showLikeCount: boolean;
  likerListVisibility: "AUDIENCE" | "OWNER_ONLY";
  commentsMode: "AUDIENCE" | "FRIENDS_ONLY" | "OFF";
  isArchived: boolean;
  user: { id: string; name: string; username: string | null; avatarUrl: string | null };
  activitySession: { id: string; activityType: string; startTime: string; distanceMeters: number; durationSeconds: number; verificationStatus: string } | null;
  community: { id: string; name: string; emblemUrl: string | null } | null;
  shareTemplate: { id: string; name: string; version: number } | null;
  _count: { reactions: number; comments: number };
  connection: { id: string | null; state: "SELF" | "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIEND" };
};

type MomentLiker = { id: string; createdAt: string; user: { id: string; name: string; username: string | null; avatarUrl: string | null } };

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
type TemplateElement = { id: string; kind: "text" | "image"; dataKey?: string; staticText?: string; x: number; y: number; width: number; height: number; fontSize?: number; fontFamily?: "INTER" | "JAKARTA" | "ARIAL" | "GEORGIA"; fontWeight?: number; color?: string; align?: CanvasTextAlign; required?: boolean; userCanHide?: boolean };
type ShareTemplate = { id: string; name: string; category: string; description: string | null; aspectRatio: string; width: number; height: number; backgroundUrl: string | null; thumbnailUrl: string | null; layoutConfig: { elements?: TemplateElement[]; photoAsBackground?: boolean; presetKey?: string }; allowedDataKeys: string[]; version: number };
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
  const [commentsEnabled, setCommentsEnabled] = useState(true);
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
  const [showLikeCount, setShowLikeCount] = useState(true);
  const [likerListVisibility, setLikerListVisibility] = useState<"AUDIENCE" | "OWNER_ONLY">("AUDIENCE");
  const [commentsMode, setCommentsMode] = useState<"AUDIENCE" | "FRIENDS_ONLY" | "OFF">("AUDIENCE");
  const [likers, setLikers] = useState<MomentLiker[]>([]);
  const [likersOpen, setLikersOpen] = useState(false);
  const [likersLoading, setLikersLoading] = useState(false);
  const [momentMenuOpen, setMomentMenuOpen] = useState(false);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [editShowLikeCount, setEditShowLikeCount] = useState(true);
  const [editLikerList, setEditLikerList] = useState<"AUDIENCE" | "OWNER_ONLY">("AUDIENCE");
  const [editCommentsMode, setEditCommentsMode] = useState<"AUDIENCE" | "FRIENDS_ONLY" | "OFF">("AUDIENCE");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [reportReason, setReportReason] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const wheelDeltaRef = useRef(0);
  const momentNavigationLockedRef = useRef(false);
  const commentRequestRef = useRef(0);
  const feedRequestRef = useRef<AbortController | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const selectedTemplate = useMemo(() => templates.find((template) => template.id === templateId) ?? null, [templateId, templates]);
  const selectedActivity = studioContext?.activities.find((activity) => activity.id === activityId) ?? studioContext?.activities[0] ?? null;
  const selectedTemplateUsesActivity = selectedTemplate?.allowedDataKeys.some((key) => key.startsWith("activity.")) ?? false;
  const selectedTemplateUsesPhoto = selectedTemplate?.allowedDataKeys.includes("moment.photo") ?? false;
  const selectedIndex = selected ? moments.findIndex((moment) => moment.id === selected.id) : -1;
  const composerHasDraft = Boolean(sourcePhoto || outputPhoto || caption.trim());

  async function loadOptions() {
    const [communityResponse, templateResponse, contextResponse, settingsResponse] = await Promise.all([
      fetch("/api/communities?scope=mine", { cache: "no-store" }),
      fetch("/api/share-templates", { cache: "no-store" }),
      fetch("/api/share-templates/context", { cache: "no-store" }),
      fetch("/api/settings", { cache: "no-store" }),
    ]);
    const communityResult = await communityResponse.json().catch(() => null) as { communities?: Community[] } | null;
    const templateResult = await templateResponse.json().catch(() => null) as { templates?: ShareTemplate[] } | null;
    const contextResult = await contextResponse.json().catch(() => null) as { context?: StudioContext } | null;
    const settingsResult = await settingsResponse.json().catch(() => null) as { settings?: { defaultMomentShowLikeCount: boolean; defaultMomentLikerList: "AUDIENCE" | "OWNER_ONLY"; defaultMomentComments: "AUDIENCE" | "FRIENDS_ONLY" | "OFF" } } | null;
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
    if (settingsResponse.ok && settingsResult?.settings) {
      setShowLikeCount(settingsResult.settings.defaultMomentShowLikeCount);
      setLikerListVisibility(settingsResult.settings.defaultMomentLikerList);
      setCommentsMode(settingsResult.settings.defaultMomentComments);
    }
  }

  async function loadFeed(cursor?: string): Promise<Moment[]> {
    const controller = new AbortController();
    feedRequestRef.current?.abort();
    feedRequestRef.current = controller;
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ scope, limit: "20" });
      if (cursor) params.set("cursor", cursor);
      if (scope === "community" && communityFilter) params.set("communityId", communityFilter);
      const response = await fetch(`/api/moments?${params}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null) as { success?: boolean; moments?: Moment[]; nextCursor?: string | null; error?: string } | null;
      if (!response.ok || !result?.success) { setError(result?.error ?? "Feed momen belum dapat dimuat."); return []; }
      const receivedMoments = result.moments ?? [];
      setMoments((current) => cursor ? [...current, ...receivedMoments.filter((item) => !current.some((old) => old.id === item.id))] : receivedMoments);
      setNextCursor(result.nextCursor ?? null);
      return receivedMoments;
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return [];
      setError("Feed momen belum dapat dimuat. Periksa koneksi lalu coba lagi.");
      return [];
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  useEffect(() => { const timer = window.setTimeout(() => void loadOptions(), 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    feedRequestRef.current?.abort();
  }, []);
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
      if (composerHasDraft && !window.confirm("Buang foto dan caption yang belum dibagikan?")) return;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraActive(false);
      setSourcePhoto(null);
      setOutputPhoto(null);
      setCaption("");
      setComposerOpen(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [composerHasDraft, composerOpen]);
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
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        void navigateMoment(1);
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
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

  function chooseScope(nextScope: FeedScope) {
    if (nextScope === scope) return;
    setScope(nextScope);
    setCommunityFilter("");
    setMoments([]);
  }

  async function openMoment(moment: Moment) {
    const requestId = commentRequestRef.current + 1;
    commentRequestRef.current = requestId;
    setSelected(moment); setComments([]); setLikers([]); setCommentsLoading(true); setCommentsEnabled(moment.commentsMode !== "OFF"); setMomentMenuOpen(false); setEditPanelOpen(false); setActionMessage("");
    try {
      const likerPreviewRequest = moment.isOwner || moment.likerListVisibility === "AUDIENCE"
        ? fetch(`/api/moments/${moment.id}/reaction?limit=3`, { cache: "no-store" })
        : null;
      const response = await fetch(`/api/moments/${moment.id}/comments`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as { comments?: MomentComment[]; commentsEnabled?: boolean } | null;
      if (requestId === commentRequestRef.current && response.ok) { setComments(result?.comments ?? []); setCommentsEnabled(result?.commentsEnabled !== false); }
      if (likerPreviewRequest) {
        const likerResponse = await likerPreviewRequest;
        const likerResult = await likerResponse.json().catch(() => null) as { reactions?: MomentLiker[] } | null;
        if (requestId === commentRequestRef.current && likerResponse.ok) setLikers(likerResult?.reactions ?? []);
      }
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
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const distanceX = start.x - (touch?.clientX ?? start.x);
    const distanceY = start.y - (touch?.clientY ?? start.y);
    if (Math.abs(distanceX) < 55 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
    void navigateMoment(distanceX > 0 ? 1 : -1);
  }

  function updateMoment(id: string, update: (moment: Moment) => Moment) {
    setMoments((current) => current.map((moment) => moment.id === id ? update(moment) : moment));
    setSelected((current) => current?.id === id ? update(current) : current);
  }

  async function toggleLike(moment: Moment) {
    const response = await fetch(`/api/moments/${moment.id}/reaction`, { method: moment.likedByMe ? "DELETE" : "PUT", headers: { "Content-Type": "application/json" }, body: moment.likedByMe ? undefined : JSON.stringify({ type: "ENCOURAGE" }) });
    if (!response.ok) return;
    updateMoment(moment.id, (item) => {
      const delta = item.likedByMe ? -1 : 1;
      return { ...item, likedByMe: !item.likedByMe, likeCount: item.likeCount === null ? null : Math.max(0, item.likeCount + delta), _count: { ...item._count, reactions: Math.max(0, item._count.reactions + delta) } };
    });
    if (selected?.id === moment.id && (moment.isOwner || moment.likerListVisibility === "AUDIENCE")) {
      const previewResponse = await fetch(`/api/moments/${moment.id}/reaction?limit=3`, { cache: "no-store" });
      const previewResult = await previewResponse.json().catch(() => null) as { reactions?: MomentLiker[] } | null;
      if (previewResponse.ok) setLikers(previewResult?.reactions ?? []);
    }
  }

  async function toggleBookmark(moment: Moment) {
    const response = await fetch(`/api/moments/${moment.id}/bookmark`, { method: moment.bookmarkedByMe ? "DELETE" : "PUT" });
    if (!response.ok) return;
    updateMoment(moment.id, (item) => ({ ...item, bookmarkedByMe: !item.bookmarkedByMe }));
    if (scope === "saved" && moment.bookmarkedByMe) setMoments((current) => current.filter((item) => item.id !== moment.id));
  }

  async function openLikers(moment: Moment) {
    if (moment.likerListVisibility === "OWNER_ONLY" && !moment.isOwner) return;
    setLikersOpen(true); setLikersLoading(true); setLikers([]);
    const response = await fetch(`/api/moments/${moment.id}/reaction?limit=50`, { cache: "no-store" });
    const result = await response.json().catch(() => null) as { reactions?: MomentLiker[]; error?: string } | null;
    if (response.ok) setLikers(result?.reactions ?? []); else setActionMessage(result?.error ?? "Daftar penyuka tidak dapat dimuat.");
    setLikersLoading(false);
  }

  function openEditPanel(moment: Moment) {
    setEditCaption(moment.caption ?? "");
    setEditShowLikeCount(moment.showLikeCount);
    setEditLikerList(moment.likerListVisibility);
    setEditCommentsMode(moment.commentsMode);
    setMomentMenuOpen(false);
    setEditPanelOpen(true);
  }

  async function saveMomentSettings() {
    if (!selected || actionBusy) return;
    setActionBusy(true); setActionMessage("");
    const response = await fetch(`/api/moments/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption: editCaption, showLikeCount: editShowLikeCount, likerListVisibility: editLikerList, commentsMode: editCommentsMode }) });
    const result = await response.json().catch(() => null) as { moment?: Moment; error?: string } | null;
    setActionBusy(false);
    if (!response.ok || !result?.moment) { setActionMessage(result?.error ?? "Pengaturan Momen belum dapat disimpan."); return; }
    updateMoment(selected.id, (item) => ({ ...item, caption: result.moment?.caption ?? null, showLikeCount: result.moment?.showLikeCount ?? editShowLikeCount, likerListVisibility: result.moment?.likerListVisibility ?? editLikerList, commentsMode: result.moment?.commentsMode ?? editCommentsMode, likeCount: editShowLikeCount ? item._count.reactions : null }));
    setCommentsEnabled(editCommentsMode !== "OFF"); setEditPanelOpen(false); setActionMessage("Pengaturan Momen diperbarui.");
  }

  async function archiveMoment() {
    if (!selected || actionBusy) return;
    setActionBusy(true);
    const response = await fetch(`/api/moments/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isArchived: true }) });
    setActionBusy(false);
    if (!response.ok) { setActionMessage("Momen belum dapat diarsipkan."); return; }
    setMoments((current) => current.filter((item) => item.id !== selected.id)); setSelected(null);
  }

  async function deleteMoment() {
    if (!selected || actionBusy || !window.confirm("Hapus Momen ini secara permanen?")) return;
    setActionBusy(true);
    const response = await fetch(`/api/moments/${selected.id}`, { method: "DELETE" });
    setActionBusy(false);
    if (!response.ok) { setActionMessage("Momen belum dapat dihapus."); return; }
    setMoments((current) => current.filter((item) => item.id !== selected.id)); setSelected(null);
  }

  async function safetyAction(action: "mute" | "block") {
    if (!selected || selected.isOwner || actionBusy) return;
    setActionBusy(true);
    const response = await fetch(`/api/users/${selected.userId}/safety`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    setActionBusy(false);
    if (!response.ok) { setActionMessage("Aksi keamanan belum dapat diproses."); return; }
    setMoments((current) => current.filter((item) => item.userId !== selected.userId)); setSelected(null);
  }

  async function reportMoment() {
    if (!selected || selected.isOwner || reportReason.trim().length < 5 || actionBusy) return;
    setActionBusy(true);
    const response = await fetch("/api/community/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ momentId: selected.id, reason: reportReason.trim() }) });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    setActionBusy(false);
    if (!response.ok) { setActionMessage(result?.error ?? "Laporan belum dapat dikirim."); return; }
    setReportReason(""); setMomentMenuOpen(false); setActionMessage("Laporan dikirim ke moderator NutriVerse.");
  }

  async function addComment(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !commentsEnabled || !commentDraft.trim() || commentBusy) return;
    setCommentBusy(true);
    const response = await fetch(`/api/moments/${selected.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: commentDraft.trim() }) });
    const result = await response.json().catch(() => null) as { comment?: MomentComment | null; moderated?: boolean; message?: string; error?: string } | null;
    setCommentBusy(false);
    if (!response.ok) { setActionMessage(result?.error ?? "Komentar belum dapat dikirim."); return; }
    if (result?.moderated || !result?.comment) { setCommentDraft(""); setActionMessage(result?.message ?? "Komentar masuk moderasi."); return; }
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

  function closeComposer(force = false) {
    if (!force && composerHasDraft && !window.confirm("Buang foto dan caption yang belum dibagikan?")) return;
    stopCamera();
    setSourcePhoto(null);
    setOutputPhoto(null);
    setCaption("");
    setComposerMessage("");
    setCameraError("");
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
      "healthPulse.current": context?.healthPulse.current === null || context?.healthPulse.current === undefined ? "Belum tersedia" : context.healthPulse.current.toFixed(0),
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
    const requiresPhoto = template.layoutConfig.photoAsBackground
      || (template.layoutConfig.elements?.some((element) => element.dataKey === "moment.photo" && element.required) ?? false);
    if (usesActivity && !selectedActivity) { setOutputPhoto(null); setComposerMessage("Template ini memerlukan aktivitas tervalidasi. Selesaikan aktivitas terlebih dahulu."); return null; }
    if (requiresPhoto && !photoSource) { setOutputPhoto(null); setComposerMessage("Template ini memerlukan foto. Ambil atau unggah foto terlebih dahulu."); return null; }
    await document.fonts.ready;
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
      const rootStyle = getComputedStyle(document.documentElement);
      const fontFamily = element.fontFamily === "JAKARTA"
        ? rootStyle.getPropertyValue("--font-jakarta").trim() || "Arial"
        : element.fontFamily === "INTER"
          ? rootStyle.getPropertyValue("--font-inter").trim() || "Arial"
          : element.fontFamily === "GEORGIA"
            ? "Georgia"
            : "Arial";
      context.save(); context.fillStyle = element.color ?? "#ffffff"; context.font = `${element.fontWeight ?? 800} ${element.fontSize ?? 32}px ${fontFamily}`; context.textAlign = element.align ?? "left"; context.textBaseline = "top";
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
      const response = await fetch("/api/moments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imagePath: upload.path, caption, privacyLevel: audience, communityId: audience === "COMMUNITY" ? targetCommunity : null, activitySessionId: studioActivityId, duringActivity: Boolean(studioActivityId), shareTemplateId: composerMode === "studio" ? templateId || null : null, showLikeCount, likerListVisibility, commentsMode }) });
      const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      if (!response.ok || !result?.success) { setComposerMessage(`Penyimpanan Momen gagal: ${result?.error ?? "Record Momen tidak dapat dibuat."}`); return; }
      closeComposer(true);
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

  useEffect(() => {
    const openCamera = () => openComposer("capture");
    window.addEventListener("nutriverse:open-moment-camera", openCamera);
    return () => window.removeEventListener("nutriverse:open-moment-camera", openCamera);
  // Shortcut kamera global hanya dipasang sekali selama halaman Momen aktif.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const followLabel = (moment: Moment) => moment.connection.state === "FRIEND" ? "Teman" : moment.connection.state === "PENDING_SENT" ? "Menunggu" : moment.connection.state === "PENDING_RECEIVED" ? "Terima" : "Ikuti";
  const firstLiker = likers[0]?.user;
  const remainingLikes = selected?.likeCount === null || selected?.likeCount === undefined ? null : Math.max(0, selected.likeCount - 1);
  const emptyState = scope === "community"
    ? communities.length === 0
      ? { title: "Belum mengikuti komunitas", description: "Gabung komunitas untuk menemukan cerita sehat dari anggota lain.", action: "Jelajahi Komunitas" }
      : { title: "Belum ada Momen komunitas", description: "Momen dari komunitas yang kamu ikuti akan tampil di sini.", action: "Jelajahi Komunitas" }
    : scope === "friends"
      ? { title: "Belum ada Momen teman", description: "Hubungkan akun dengan teman agar perjalanan sehat kalian dapat saling menguatkan.", action: "Lihat Momen Publik" }
      : scope === "saved"
        ? { title: "Koleksi tersimpan masih kosong", description: "Simpan Momen yang ingin kamu lihat kembali tanpa membuatnya terlihat oleh orang lain.", action: "Jelajahi Momen" }
        : { title: "Belum ada Momen publik", description: "Jadilah yang pertama membagikan perjalanan sehat hari ini.", action: "Buat Momen" };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-line bg-card shadow-soft">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#063c2b] via-brand to-lime p-5 text-white sm:p-8">
          <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full border-[28px] border-white/10 sm:-right-10 sm:-top-12 sm:h-52 sm:w-52 sm:border-[34px]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/75">NutriVerse Moments</p>
              <h1 className="mt-2 max-w-xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">Cerita sehat yang dekat, relevan, dan terkontrol.</h1>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/80 sm:text-sm">Lihat Momen publik, komunitas yang kamu ikuti, atau temanmu dalam ruang yang terpisah.</p>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <button onClick={() => openComposer("studio")} className="btn min-w-0 border-white/30 bg-white/10 px-3 text-xs text-white hover:bg-white/20 sm:px-4 sm:text-sm"><Sparkles className="h-4 w-4" /> Studio Berbagi</button>
              <button onClick={() => openComposer("capture")} className="btn min-w-0 bg-white px-3 text-xs text-[#06422f] hover:bg-white/90 sm:px-4 sm:text-sm"><Camera className="h-4 w-4" /> Ambil Momen</button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full space-y-5">
        <div className="sticky top-[7rem] z-30 -mx-4 border-y border-line/60 bg-background/95 px-4 py-2 shadow-[0_8px_24px_-22px_rgba(0,0,0,.45)] backdrop-blur-md sm:top-20 sm:mx-0 sm:rounded-2xl sm:border sm:p-1.5 lg:top-24">
          <div className="flex min-w-0 items-center gap-2">
            <nav className="grid min-w-0 flex-1 grid-cols-3 rounded-xl bg-secondary/80 p-1" aria-label="Sumber Momen">
              {(["public", "community", "friends"] as FeedScope[]).map((item) => {
                const shortLabel = item === "public" ? "Publik" : item === "community" ? "Komunitas" : "Teman";
                return (
                  <button
                    key={item}
                    onClick={() => chooseScope(item)}
                    className={"min-w-0 rounded-lg px-2 py-2.5 text-[10px] font-extrabold transition sm:px-4 sm:text-xs " + (scope === item ? "bg-card text-brand shadow-sm ring-1 ring-line/70" : "text-muted-foreground hover:text-foreground")}
                  >
                    <span className="sm:hidden">{shortLabel}</span>
                    <span className="hidden sm:inline">Momen {shortLabel}</span>
                  </button>
                );
              })}
            </nav>
            <button
              onClick={() => chooseScope("saved")}
              className={"inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-extrabold transition sm:h-auto sm:min-w-36 sm:self-stretch sm:px-4 " + (scope === "saved" ? "border-brand bg-brand text-white shadow-sm" : "border-line bg-card text-muted-foreground hover:border-brand/30 hover:text-brand")}
              aria-label="Momen tersimpan"
              title="Momen tersimpan"
            >
              <Bookmark className={`h-4 w-4 ${scope === "saved" ? "fill-current" : ""}`} />
              <span className="hidden sm:inline">Tersimpan</span>
            </button>
          </div>
        </div>

        {scope === "saved" && (
          <div className="flex items-center gap-3 rounded-2xl border border-brand/15 bg-brand-soft/45 px-4 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white"><Bookmark className="h-4 w-4 fill-current" /></span>
            <div><p className="text-xs font-extrabold text-foreground">Koleksi Momen Tersimpan</p><p className="mt-0.5 text-[10px] text-muted-foreground">Koleksi pribadi yang hanya dapat dilihat olehmu.</p></div>
          </div>
        )}

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
          <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-2xl sm:gap-2 2xl:grid-cols-4" aria-busy="true" aria-label="Memuat Momen">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} className="aspect-square animate-pulse bg-secondary sm:rounded-xl" />
            ))}
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
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground"><ImagePlus className="h-5 w-5" /></span>
              <p className="mt-4 text-sm font-bold">{emptyState.title}</p>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">{emptyState.description}</p>
              {scope === "community" ? (
                <Link href="/komunitas" className="btn btn-outline btn-sm mt-5">{emptyState.action}</Link>
              ) : scope === "public" ? (
                <button onClick={() => openComposer("capture")} className="btn btn-primary btn-sm mt-5"><Camera className="h-4 w-4" /> {emptyState.action}</button>
              ) : (
                <button onClick={() => chooseScope("public")} className="btn btn-outline btn-sm mt-5">{emptyState.action}</button>
              )}
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
                    <Heart className="h-5 w-5 fill-current" /> {moment.likeCount ?? "—"}
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
                <button disabled={selected.connection.state === "PENDING_SENT" || selected.connection.state === "FRIEND"} onClick={() => void follow(selected)} className="btn btn-outline btn-sm hidden px-3 text-[10px] min-[430px]:inline-flex">
                  {followLabel(selected)}
                </button>
              )}
              <button onClick={() => setMomentMenuOpen((current) => !current)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tindakan lainnya"><MoreHorizontal className="h-5 w-5" /></button>
              <button onClick={() => setSelected(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div
              className="relative aspect-[4/5] w-full shrink-0 touch-pan-y bg-black lg:aspect-auto lg:h-full lg:min-h-0"
              onWheel={handleMomentWheel}
              onTouchStart={(event) => {
                const touch = event.touches[0];
                touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
              }}
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
                <span className="rounded-full bg-black/55 px-3 py-1.5 text-[9px] font-bold text-white backdrop-blur">Geser ←→ untuk Momen lain · {selectedIndex + 1}/{moments.length}</span>
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
                <button onClick={() => setMomentMenuOpen((current) => !current)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tindakan lainnya"><MoreHorizontal className="h-5 w-5" /></button>
                <button onClick={() => setSelected(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tutup">
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div ref={detailScrollRef} className="overscroll-contain p-4 [scrollbar-gutter:stable] lg:min-h-0 lg:flex-1 lg:overflow-y-scroll lg:p-5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-brand">
                  {momentStatus(selected)}{selected.community ? ` · ${selected.community.name}` : ""}
                </p>
                <div className="mt-3 flex items-center gap-4 border-b border-line pb-3">
                  <button onClick={() => void toggleLike(selected)} className={`inline-flex items-center gap-1.5 text-sm font-extrabold transition active:scale-90 ${selected.likedByMe ? "text-rose-500" : "text-foreground"}`} aria-label={selected.likedByMe ? "Batalkan suka" : "Sukai Momen"}>
                    <Heart className={`h-7 w-7 ${selected.likedByMe ? "fill-current" : ""}`} />
                    {selected.likeCount !== null && <span>{selected.likeCount}</span>}
                  </button>
                  <button onClick={() => detailScrollRef.current?.querySelector("[data-moment-comments]")?.scrollIntoView({ behavior: "smooth", block: "start" })} disabled={!commentsEnabled} className="inline-flex items-center gap-1.5 text-sm font-extrabold text-foreground transition active:scale-90 disabled:opacity-35" aria-label="Lihat komentar">
                    <MessageCircle className="h-7 w-7" /><span>{selected._count.comments}</span>
                  </button>
                  <button onClick={() => void toggleBookmark(selected)} className={`ml-auto transition active:scale-90 ${selected.bookmarkedByMe ? "text-brand" : "text-foreground"}`} aria-label={selected.bookmarkedByMe ? "Hapus dari tersimpan" : "Simpan Momen"}>
                    <Bookmark className={`h-7 w-7 ${selected.bookmarkedByMe ? "fill-current" : ""}`} />
                  </button>
                </div>

                {scope === "public" && !selected.isOwner && (
                  <button
                    disabled={selected.connection.state === "PENDING_SENT" || selected.connection.state === "FRIEND"}
                    onClick={() => void follow(selected)}
                    className="btn btn-outline btn-sm mt-3 w-full min-[430px]:hidden"
                  >
                    <UserPlus className="h-4 w-4" /> {followLabel(selected)}
                  </button>
                )}

                {(selected.isOwner || selected.likerListVisibility === "AUDIENCE") && (firstLiker || (selected.likeCount ?? 0) > 0) && (
                  <button onClick={() => void openLikers(selected)} className="mt-3 flex max-w-full items-center text-left text-xs text-foreground hover:text-brand">
                    {likers.length > 0 && <span className="mr-2 flex shrink-0 pl-1">{likers.slice(0, 3).map((liker, index) => <span key={liker.id} className="relative -ml-1 grid h-7 w-7 place-items-center overflow-hidden rounded-full border-2 border-card bg-brand text-[8px] font-bold text-white" style={{ zIndex: 3 - index }}>{liker.user.avatarUrl ? <NextImage src={liker.user.avatarUrl} alt="" fill unoptimized className="object-cover" /> : initials(liker.user.name)}</span>)}</span>}
                    <span className="truncate">{firstLiker ? <>Disukai oleh <strong>{firstLiker.username ?? firstLiker.name}</strong>{remainingLikes && remainingLikes > 0 ? <> dan <strong>{remainingLikes} lainnya</strong></> : null}</> : "Lihat pengguna yang menyukai"}</span>
                  </button>
                )}

                {momentMenuOpen && (
                  <section className="fixed inset-x-3 bottom-3 z-40 max-h-[75dvh] overflow-y-auto rounded-3xl border border-line bg-card p-4 shadow-2xl lg:static lg:z-auto lg:mt-3 lg:max-h-none lg:overflow-visible lg:rounded-2xl lg:bg-secondary/35 lg:p-3 lg:shadow-none">
                    <div className="mb-3 flex items-center justify-between lg:hidden"><div><p className="text-sm font-extrabold">Opsi Momen</p><p className="text-[9px] text-muted-foreground">Kelola privasi dan keamanan Momen.</p></div><button onClick={() => setMomentMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-muted-foreground"><X className="h-4 w-4" /></button></div>
                    {selected.isOwner ? (
                      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                        <button onClick={() => openEditPanel(selected)} className="btn btn-outline btn-sm justify-start"><Pencil className="h-4 w-4" /> Edit Momen</button>
                        <button onClick={() => void archiveMoment()} disabled={actionBusy} className="btn btn-outline btn-sm justify-start"><Archive className="h-4 w-4" /> Arsipkan</button>
                        <button onClick={() => void deleteMoment()} disabled={actionBusy} className="btn btn-outline btn-sm justify-start border-rose-500/25 text-rose-500"><Trash2 className="h-4 w-4" /> Hapus permanen</button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                          <button onClick={() => void safetyAction("mute")} disabled={actionBusy} className="btn btn-outline btn-sm justify-start"><VolumeX className="h-4 w-4" /> Bisukan @{selected.user.username ?? "pengguna"}</button>
                          <button onClick={() => void safetyAction("block")} disabled={actionBusy} className="btn btn-outline btn-sm justify-start border-rose-500/25 text-rose-500"><Ban className="h-4 w-4" /> Blokir pengguna</button>
                        </div>
                        <label className="block">
                          <span className="label">Laporkan Momen</span>
                          <textarea value={reportReason} onChange={(event) => setReportReason(event.target.value)} maxLength={500} rows={2} className="input mt-1 resize-none" placeholder="Jelaskan alasan laporan…" />
                        </label>
                        <button onClick={() => void reportMoment()} disabled={actionBusy || reportReason.trim().length < 5} className="btn btn-outline btn-sm w-full border-amber/30 text-amber"><Flag className="h-4 w-4" /> Kirim ke moderator</button>
                      </div>
                    )}
                  </section>
                )}

                {editPanelOpen && selected.isOwner && (
                  <section className="fixed inset-x-3 bottom-3 z-40 max-h-[80dvh] space-y-3 overflow-y-auto rounded-3xl border border-brand/20 bg-card p-4 shadow-2xl lg:static lg:z-auto lg:mt-3 lg:max-h-none lg:overflow-visible lg:rounded-2xl lg:bg-brand-soft/25 lg:p-3 lg:shadow-none">
                    <div className="flex items-center justify-between"><p className="text-xs font-extrabold">Edit Momen &amp; privasi interaksi</p><button onClick={() => setEditPanelOpen(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button></div>
                    <textarea value={editCaption} onChange={(event) => setEditCaption(event.target.value)} maxLength={280} rows={3} className="input resize-none" placeholder="Caption boleh dikosongkan" />
                    <button onClick={() => setEditShowLikeCount((current) => !current)} className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-3 py-2 text-left">
                      <span><span className="block text-[10px] font-bold">Tampilkan jumlah suka</span><span className="text-[8px] text-muted-foreground">Berlaku khusus Momen ini</span></span>
                      {editShowLikeCount ? <Eye className="h-4 w-4 text-brand" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <select value={editLikerList} onChange={(event) => setEditLikerList(event.target.value as "AUDIENCE" | "OWNER_ONLY")} className="input">
                      <option value="AUDIENCE">Daftar penyuka: terlihat audiens</option>
                      <option value="OWNER_ONLY">Daftar penyuka: hanya saya</option>
                    </select>
                    <select value={editCommentsMode} onChange={(event) => setEditCommentsMode(event.target.value as "AUDIENCE" | "FRIENDS_ONLY" | "OFF")} className="input">
                      <option value="AUDIENCE">Komentar: semua audiens</option>
                      <option value="FRIENDS_ONLY">Komentar: teman saja</option>
                      <option value="OFF">Komentar: dinonaktifkan</option>
                    </select>
                    <button onClick={() => void saveMomentSettings()} disabled={actionBusy} className="btn btn-primary w-full"><Check className="h-4 w-4" /> Simpan perubahan</button>
                  </section>
                )}

                {actionMessage && <p className="mt-3 rounded-xl bg-secondary px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">{actionMessage}</p>}

                {selected.caption && (
                  <p className="mt-4 border-b border-line pb-4 text-sm leading-6">
                    <span className="mr-2 font-extrabold">{selected.user.username ?? selected.user.name}</span>
                    {selected.caption}
                  </p>
                )}

                <section data-moment-comments className="scroll-mt-4 pt-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Komentar</h3>
                  {!commentsEnabled ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-line p-6 text-center">
                      <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
                      <p className="mt-2 text-xs font-bold">Komentar dinonaktifkan pemilik Momen</p>
                    </div>
                  ) : commentsLoading ? (
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

              {commentsEnabled ? (
                <form onSubmit={addComment} className="sticky bottom-0 z-20 flex shrink-0 gap-2 border-t border-line bg-card/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:p-4">
                  <input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength={500} className="input min-w-0 flex-1" placeholder={selected.commentsMode === "FRIENDS_ONLY" ? "Komentar khusus teman…" : "Tulis komentar…"} />
                  <button disabled={commentBusy || !commentDraft.trim()} className="btn btn-primary shrink-0 px-4" aria-label="Kirim komentar">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <div className="flex shrink-0 items-center justify-center gap-2 border-t border-line bg-card p-4 text-[10px] font-bold text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Komentar dimatikan</div>
              )}
            </aside>
          </article>
        </div>
      ), document.body)}

      {selected && likersOpen && typeof document !== "undefined" && createPortal((
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Daftar penyuka" onMouseDown={(event) => { if (event.target === event.currentTarget) setLikersOpen(false); }}>
          <section className="flex max-h-[min(75dvh,620px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-line p-4"><div><p className="font-display text-lg font-extrabold">Disukai oleh</p><p className="text-[10px] text-muted-foreground">{selected.likeCount ?? selected._count.reactions} interaksi</p></div><button onClick={() => setLikersOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button></header>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {likersLoading ? <p className="py-10 text-center text-xs text-muted-foreground">Memuat penyuka…</p> : likers.length === 0 ? <p className="py-10 text-center text-xs text-muted-foreground">Belum ada yang menyukai Momen ini.</p> : (
                <div className="space-y-1">{likers.map((liker) => <Link key={liker.id} href={`/profil/${liker.user.id}`} onClick={() => setLikersOpen(false)} className="flex items-center gap-3 rounded-2xl p-3 hover:bg-secondary"><span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-xs font-bold text-white">{liker.user.avatarUrl ? <NextImage src={liker.user.avatarUrl} alt="" fill unoptimized className="object-cover" /> : initials(liker.user.name)}</span><span className="min-w-0"><span className="block truncate text-xs font-extrabold">{liker.user.name}</span><span className="block truncate text-[10px] text-muted-foreground">@{liker.user.username ?? "pengguna"}</span></span></Link>)}</div>
              )}
            </div>
          </section>
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
              <button onClick={() => closeComposer()} className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tutup">
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

                <section className="rounded-2xl border border-line bg-secondary/25 p-3">
                  <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /><div><p className="text-[10px] font-extrabold">Privasi interaksi</p><p className="text-[8px] text-muted-foreground">Pengaturan ini hanya berlaku untuk Momen baru ini.</p></div></div>
                  <button onClick={() => setShowLikeCount((current) => !current)} className="mt-3 flex w-full items-center justify-between rounded-xl border border-line bg-card px-3 py-2 text-left"><span className="text-[9px] font-bold">Tampilkan jumlah suka</span>{showLikeCount ? <Eye className="h-4 w-4 text-brand" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</button>
                  <select value={likerListVisibility} onChange={(event) => setLikerListVisibility(event.target.value as "AUDIENCE" | "OWNER_ONLY")} className="input mt-2 text-[9px]"><option value="AUDIENCE">Daftar penyuka terlihat audiens</option><option value="OWNER_ONLY">Daftar penyuka hanya saya</option></select>
                  <select value={commentsMode} onChange={(event) => setCommentsMode(event.target.value as "AUDIENCE" | "FRIENDS_ONLY" | "OFF")} className="input mt-2 text-[9px]"><option value="AUDIENCE">Komentar untuk semua audiens</option><option value="FRIENDS_ONLY">Komentar hanya teman</option><option value="OFF">Komentar dinonaktifkan</option></select>
                </section>

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
