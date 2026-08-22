"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Archive, ArchiveRestore, Camera, Check, ChevronDown, ChevronUp, Download, Eye, EyeOff, Heart, ImageIcon, LoaderCircle, Lock, MessageCircle, Pencil, Send, Sparkles, Trash2, UsersRound, X } from "lucide-react";

type ProfileMoment = {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string | null;
  privacyLevel: "PRIVATE" | "CIRCLE" | string;
  duringActivity: boolean;
  visibleOnProfile: boolean;
  profileDisplayOrder: number | null;
  isArchived: boolean;
  showLikeCount: boolean;
  likerListVisibility: "AUDIENCE" | "OWNER_ONLY";
  commentsMode: "AUDIENCE" | "FRIENDS_ONLY" | "OFF";
  createdAt: string;
  isOwner: boolean;
  likedByMe: boolean;
  user: { id: string; name: string; username: string | null; avatarUrl: string | null };
  activitySession: { id: string; activityType: string; startTime: string; distanceMeters: number; durationSeconds: number; verificationStatus: string } | null;
  community: { id: string; name: string; emblemUrl: string | null } | null;
  shareTemplate: { id: string; name: string; version: number } | null;
  _count: { reactions: number; comments: number };
};

type MomentComment = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  canDelete: boolean;
  user: { id: string; name: string; username: string | null; avatarUrl: string | null };
};

type MomentsResponse = {
  success?: boolean;
  error?: string;
  moments?: ProfileMoment[];
  nextCursor?: string | null;
  meta?: { showcaseCount?: number; showcaseLimit?: number };
};

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

function momentStatus(moment: ProfileMoment) {
  if (moment.shareTemplate) return `Studio Berbagi · ${moment.shareTemplate.name}`;
  if (moment.activitySession) return `${moment.duringActivity ? "Saat" : "Setelah"} ${activityName(moment.activitySession.activityType)}`;
  return "Momen Harian";
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function ProfileMomentsGallery() {
  const [moments, setMoments] = useState<ProfileMoment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ProfileMoment | null>(null);
  const [showcaseCount, setShowcaseCount] = useState(0);
  const [showcaseLimit, setShowcaseLimit] = useState(6);
  const [showcaseSavingId, setShowcaseSavingId] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [comments, setComments] = useState<MomentComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [editShowLikeCount, setEditShowLikeCount] = useState(true);
  const [editLikerList, setEditLikerList] = useState<"AUDIENCE" | "OWNER_ONLY">("AUDIENCE");
  const [editCommentsMode, setEditCommentsMode] = useState<"AUDIENCE" | "FRIENDS_ONLY" | "OFF">("AUDIENCE");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const touchStartYRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef(0);
  const commentRequestRef = useRef(0);
  const navigationLockedRef = useRef(false);
  const detailScrollRef = useRef<HTMLDivElement>(null);

  function audience(moment: ProfileMoment) {
    if (moment.privacyLevel === "PUBLIC") return { label: "Publik", icon: Sparkles };
    if (moment.privacyLevel === "COMMUNITY") return { label: moment.community?.name ?? "Komunitas", icon: UsersRound };
    if (moment.privacyLevel === "CIRCLE") return { label: "Teman", icon: UsersRound };
    return { label: "Hanya Saya", icon: Lock };
  }

  async function download(moment: ProfileMoment) {
    const response = await fetch(moment.imageUrl);
    if (!response.ok) return;
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nutriverse-moment-${moment.id}.jpg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function load(cursor?: string): Promise<ProfileMoment[]> {
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ scope: "mine", limit: "24" });
      if (cursor) params.set("cursor", cursor);
      const response = await fetch(`/api/moments?${params.toString()}`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as MomentsResponse | null;
      if (!response.ok || !result?.success) {
        setError(result?.error ?? "Riwayat momen belum dapat dimuat.");
        return [];
      }

      const incoming = result.moments ?? [];
      setMoments((current) => cursor
        ? [...current, ...incoming.filter((item) => !current.some((existing) => existing.id === item.id))]
        : incoming);
      setNextCursor(result.nextCursor ?? null);
      if (typeof result.meta?.showcaseCount === "number") setShowcaseCount(result.meta.showcaseCount);
      if (typeof result.meta?.showcaseLimit === "number") setShowcaseLimit(result.meta.showcaseLimit);
      return incoming;
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function toggleShowcase(moment: ProfileMoment) {
    if (showcaseSavingId || moment.isArchived) return;
    setShowcaseSavingId(moment.id);
    setError("");
    try {
      const response = await fetch(`/api/moments/${moment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibleOnProfile: !moment.visibleOnProfile }),
      });
      const result = await response.json().catch(() => null) as { success?: boolean; moment?: ProfileMoment; showcaseCount?: number; showcaseLimit?: number; error?: string } | null;
      if (!response.ok || !result?.success || !result.moment) {
        setError(result?.error ?? "Pengaturan momen profil belum dapat diperbarui.");
        return;
      }
      setMoments((current) => current.map((item) => item.id === moment.id ? { ...item, visibleOnProfile: result.moment?.visibleOnProfile ?? false, profileDisplayOrder: result.moment?.profileDisplayOrder ?? null } : item));
      setSelected((current) => current?.id === moment.id ? { ...current, visibleOnProfile: result.moment?.visibleOnProfile ?? false, profileDisplayOrder: result.moment?.profileDisplayOrder ?? null } : current);
      if (typeof result.showcaseCount === "number") setShowcaseCount(result.showcaseCount);
      if (typeof result.showcaseLimit === "number") setShowcaseLimit(result.showcaseLimit);
    } finally {
      setShowcaseSavingId(null);
    }
  }

  async function restoreMoment(moment: ProfileMoment) {
    if (showcaseSavingId) return;
    setShowcaseSavingId(moment.id);
    setError("");
    try {
      const response = await fetch(`/api/moments/${moment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      const result = await response.json().catch(() => null) as { success?: boolean; moment?: ProfileMoment; error?: string } | null;
      if (!response.ok || !result?.success || !result.moment) {
        setError(result?.error ?? "Momen belum dapat dipulihkan.");
        return;
      }
      updateMoment(moment.id, (item) => ({ ...item, isArchived: false }));
    } finally {
      setShowcaseSavingId(null);
    }
  }

  async function openMoment(moment: ProfileMoment) {
    const requestId = commentRequestRef.current + 1;
    commentRequestRef.current = requestId;
    setSelected(moment);
    setComments([]);
    setCommentsLoading(true);
    setCommentDraft("");
    setCommentsEnabled(moment.commentsMode !== "OFF");
    setEditOpen(false);
    setActionMessage("");
    window.requestAnimationFrame(() => {
      if (detailScrollRef.current) detailScrollRef.current.scrollTop = 0;
    });
    try {
      const response = await fetch(`/api/moments/${moment.id}/comments`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as { comments?: MomentComment[]; commentsEnabled?: boolean } | null;
      if (requestId === commentRequestRef.current && response.ok) { setComments(result?.comments ?? []); setCommentsEnabled(result?.commentsEnabled !== false); }
    } finally {
      if (requestId === commentRequestRef.current) setCommentsLoading(false);
    }
  }

  function startEditing(moment: ProfileMoment) {
    setEditCaption(moment.caption ?? "");
    setEditShowLikeCount(moment.showLikeCount);
    setEditLikerList(moment.likerListVisibility);
    setEditCommentsMode(moment.commentsMode);
    setEditOpen(true);
  }

  async function saveMoment() {
    if (!selected || actionBusy) return;
    setActionBusy(true); setActionMessage("");
    const response = await fetch(`/api/moments/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption: editCaption, showLikeCount: editShowLikeCount, likerListVisibility: editLikerList, commentsMode: editCommentsMode }) });
    const result = await response.json().catch(() => null) as { success?: boolean; moment?: ProfileMoment; error?: string } | null;
    setActionBusy(false);
    if (!response.ok || !result?.success || !result.moment) { setActionMessage(result?.error ?? "Momen belum dapat diperbarui."); return; }
    updateMoment(selected.id, (item) => ({ ...item, caption: result.moment?.caption ?? null, showLikeCount: editShowLikeCount, likerListVisibility: editLikerList, commentsMode: editCommentsMode }));
    setCommentsEnabled(editCommentsMode !== "OFF"); setEditOpen(false); setActionMessage("Perubahan Momen tersimpan.");
  }

  async function archiveSelected() {
    if (!selected || actionBusy) return;
    setActionBusy(true);
    const response = await fetch(`/api/moments/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isArchived: true }) });
    setActionBusy(false);
    if (!response.ok) { setActionMessage("Momen belum dapat diarsipkan."); return; }
    if (selected.visibleOnProfile) setShowcaseCount((current) => Math.max(0, current - 1));
    updateMoment(selected.id, (item) => ({ ...item, isArchived: true, visibleOnProfile: false, profileDisplayOrder: null }));
    setActionMessage("Momen dipindahkan ke arsip dan tidak terlihat audiens.");
  }

  async function deleteSelected() {
    if (!selected || actionBusy || !window.confirm("Hapus Momen ini secara permanen?")) return;
    setActionBusy(true);
    const response = await fetch(`/api/moments/${selected.id}`, { method: "DELETE" });
    setActionBusy(false);
    if (!response.ok) { setActionMessage("Momen belum dapat dihapus."); return; }
    if (selected.visibleOnProfile) setShowcaseCount((current) => Math.max(0, current - 1));
    setMoments((current) => current.filter((item) => item.id !== selected.id)); setSelected(null);
  }

  function updateMoment(id: string, update: (moment: ProfileMoment) => ProfileMoment) {
    setMoments((current) => current.map((moment) => moment.id === id ? update(moment) : moment));
    setSelected((current) => current?.id === id ? update(current) : current);
  }

  async function toggleLike(moment: ProfileMoment) {
    const response = await fetch(`/api/moments/${moment.id}/reaction`, {
      method: moment.likedByMe ? "DELETE" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: moment.likedByMe ? undefined : JSON.stringify({ type: "ENCOURAGE" }),
    });
    if (!response.ok) return;
    updateMoment(moment.id, (item) => ({
      ...item,
      likedByMe: !item.likedByMe,
      _count: { ...item._count, reactions: Math.max(0, item._count.reactions + (item.likedByMe ? -1 : 1)) },
    }));
  }

  async function addComment(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !commentsEnabled || !commentDraft.trim() || commentBusy) return;
    setCommentBusy(true);
    const response = await fetch(`/api/moments/${selected.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentDraft.trim() }),
    });
    const result = await response.json().catch(() => null) as { comment?: MomentComment } | null;
    setCommentBusy(false);
    if (!response.ok || !result?.comment) return;
    setComments((current) => [...current, result.comment as MomentComment]);
    setCommentDraft("");
    updateMoment(selected.id, (item) => ({ ...item, _count: { ...item._count, comments: item._count.comments + 1 } }));
  }

  async function removeComment(comment: MomentComment) {
    if (!selected) return;
    const response = await fetch(`/api/moments/${selected.id}/comments/${comment.id}`, { method: "DELETE" });
    if (!response.ok) return;
    setComments((current) => current.filter((item) => item.id !== comment.id));
    updateMoment(selected.id, (item) => ({ ...item, _count: { ...item._count, comments: Math.max(0, item._count.comments - 1) } }));
  }

  async function navigateSelected(direction: -1 | 1) {
    if (!selected || navigating || navigationLockedRef.current) return;
    const currentIndex = moments.findIndex((moment) => moment.id === selected.id);
    const target = moments[currentIndex + direction];
    if (target) {
      navigationLockedRef.current = true;
      void openMoment(target);
      window.setTimeout(() => { navigationLockedRef.current = false; }, 420);
      return;
    }
    if (direction < 0 || !nextCursor) return;
    navigationLockedRef.current = true;
    setNavigating(true);
    try {
      const incoming = await load(nextCursor);
      if (incoming[0]) void openMoment(incoming[0]);
    } finally {
      setNavigating(false);
      window.setTimeout(() => { navigationLockedRef.current = false; }, 420);
    }
  }

  function handleMomentWheel(event: React.WheelEvent) {
    if (window.innerWidth < 1024 || navigating) return;
    event.preventDefault();
    wheelDeltaRef.current += event.deltaY;
    if (Math.abs(wheelDeltaRef.current) < 60) return;
    const direction: -1 | 1 = wheelDeltaRef.current > 0 ? 1 : -1;
    wheelDeltaRef.current = 0;
    void navigateSelected(direction);
  }

  function handleMomentTouchEnd(event: React.TouchEvent) {
    const startY = touchStartYRef.current;
    touchStartYRef.current = null;
    if (startY === null || navigating) return;
    const distance = startY - (event.changedTouches[0]?.clientY ?? startY);
    if (Math.abs(distance) < 50) return;
    void navigateSelected(distance > 0 ? 1 : -1);
  }

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setSelected(null); return; }
      if (event.key === "ArrowDown") { event.preventDefault(); void navigateSelected(1); }
      if (event.key === "ArrowUp") { event.preventDefault(); void navigateSelected(-1); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
  // Navigasi memakai snapshot galeri pada saat momen aktif berubah.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const selectedIndex = selected ? moments.findIndex((moment) => moment.id === selected.id) : -1;

  return (
    <section id="momen-saya" className="scroll-mt-24 overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
      <header className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
            <ImageIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-extrabold">Momen Saya</h2>
            <p className="mt-1 text-[10px] text-muted-foreground">Galeri seluruh foto sehat yang pernah kamu unggah.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2"><span className="pill bg-secondary text-[10px] font-bold text-muted-foreground">{showcaseCount}/{showcaseLimit} tampil di profil</span><Link href="/momen" className="btn btn-primary btn-sm self-start sm:self-auto"><Camera className="h-4 w-4" /> Unggah Momen</Link></div>
      </header>

      {loading ? (
        <div className="grid min-h-72 place-items-center">
          <div className="text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin text-brand" /><p className="mt-3 text-xs text-muted-foreground">Memuat galeri…</p></div>
        </div>
      ) : error && moments.length === 0 ? (
        <div className="grid min-h-72 place-items-center p-6 text-center">
          <div><p className="text-sm font-bold">Galeri belum dapat dimuat</p><p className="mt-2 text-xs text-muted-foreground">{error}</p><button type="button" onClick={() => void load()} className="btn btn-outline btn-sm mt-4">Coba Lagi</button></div>
        </div>
      ) : moments.length === 0 ? (
        <div className="grid min-h-72 place-items-center p-6 text-center">
          <div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground"><Camera className="h-6 w-6" /></span><p className="mt-4 text-sm font-bold">Belum ada momen</p><p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">Foto yang kamu unggah akan tersusun otomatis di galeri ini.</p></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1.5 p-1.5 sm:grid-cols-3 sm:gap-2 sm:p-2">
            {moments.map((moment) => {
              const AudienceIcon = audience(moment).icon;
              return <article key={moment.id} className={`group relative aspect-square overflow-hidden rounded-xl bg-secondary sm:rounded-2xl ${moment.isArchived ? "opacity-75" : ""}`}><button type="button" onClick={() => void openMoment(moment)} className="absolute inset-0 text-left" aria-label={`Buka momen ${moment.caption ?? "tanpa caption"}`}>{moment.imageUrl ? <NextImage src={moment.imageUrl} alt={moment.caption ?? "Momen NutriVerse"} fill unoptimized sizes="(max-width: 640px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-105" /> : <span className="absolute inset-0 grid place-items-center text-muted-foreground"><ImageIcon className="h-7 w-7" /></span>}<span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 transition group-hover:opacity-100" /><span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-white"><span className="line-clamp-2 text-[9px] font-bold leading-relaxed sm:text-[10px]">{moment.caption || "Momen sehatku"}</span><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black/35 backdrop-blur"><AudienceIcon className="h-3 w-3" /></span></span></button>{moment.isArchived ? <button type="button" disabled={showcaseSavingId === moment.id} onClick={() => void restoreMoment(moment)} className="absolute left-2 top-2 z-10 inline-flex h-8 items-center gap-1.5 rounded-full bg-amber/85 px-2.5 text-[9px] font-bold text-white backdrop-blur"><ArchiveRestore className="h-3.5 w-3.5" /> Pulihkan</button> : <button type="button" disabled={showcaseSavingId === moment.id} onClick={() => void toggleShowcase(moment)} className={`absolute left-2 top-2 z-10 inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[9px] font-bold text-white backdrop-blur transition disabled:opacity-60 ${moment.visibleOnProfile ? "bg-brand/85" : "bg-black/55 hover:bg-black/70"}`} aria-label={moment.visibleOnProfile ? "Sembunyikan dari profil" : "Tampilkan di profil"}>{showcaseSavingId === moment.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : moment.visibleOnProfile ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{moment.visibleOnProfile ? "Ditampilkan" : "Tampilkan"}</button>}</article>;
            })}
          </div>
          <footer className="flex flex-col items-center gap-3 border-t border-line p-4">
            <p className="text-[10px] text-muted-foreground">{moments.length} momen ditampilkan</p>
            {error && <p className="text-[10px] text-destructive">{error}</p>}
            {nextCursor && <button type="button" disabled={loadingMore} onClick={() => void load(nextCursor)} className="btn btn-outline btn-sm disabled:opacity-50">{loadingMore ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Memuat…</> : "Muat Lebih Banyak"}</button>}
          </footer>
        </>
      )}

      {selected && typeof document !== "undefined" && createPortal((
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-sm lg:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Detail momen saya"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}
        >
          <article
            key={selected.id}
            className="flex h-[100dvh] w-full flex-col overflow-y-auto bg-card shadow-2xl lg:grid lg:h-[min(88dvh,820px)] lg:max-w-6xl lg:grid-cols-[minmax(0,1fr)_400px] lg:overflow-hidden lg:rounded-3xl lg:border lg:border-line"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-line bg-card/95 p-3 backdrop-blur lg:hidden">
              <Link href="/profil" className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-xs font-bold text-white">
                {selected.user.avatarUrl ? <NextImage src={selected.user.avatarUrl} alt="" fill unoptimized className="object-cover" /> : initials(selected.user.name)}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-extrabold">{selected.user.name}</p>
                <p className="truncate text-[9px] text-muted-foreground">@{selected.user.username ?? "pengguna"} · {relativeTime(selected.createdAt)}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div
              className="relative aspect-[4/5] w-full shrink-0 touch-none bg-black lg:aspect-auto lg:h-full lg:min-h-0"
              onWheel={handleMomentWheel}
              onTouchStart={(event) => { touchStartYRef.current = event.touches[0]?.clientY ?? null; }}
              onTouchEnd={handleMomentTouchEnd}
            >
              {selected.imageUrl ? (
                <NextImage src={selected.imageUrl} alt={selected.caption ?? "Momen NutriVerse"} fill unoptimized sizes="(max-width: 1023px) 100vw, 70vw" className="object-contain" />
              ) : (
                <span className="absolute inset-0 grid place-items-center"><ImageIcon className="h-10 w-10 text-white/50" /></span>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center lg:hidden">
                <span className="rounded-full bg-black/55 px-3 py-1.5 text-[9px] font-bold text-white backdrop-blur">Geser ↑↓ untuk momen lain</span>
              </div>
              <nav className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-2 lg:flex" aria-label="Navigasi antar momen">
                <button type="button" disabled={selectedIndex <= 0 || navigating} onClick={() => void navigateSelected(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Momen sebelumnya">
                  <ChevronUp className="h-5 w-5" />
                </button>
                <button type="button" disabled={(selectedIndex >= moments.length - 1 && !nextCursor) || navigating} onClick={() => void navigateSelected(1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Momen berikutnya">
                  {navigating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </nav>
            </div>

            <aside className="flex min-h-0 flex-col bg-card lg:h-full">
              <header className="hidden shrink-0 items-center gap-3 border-b border-line p-4 lg:flex">
                <Link href="/profil" className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-xs font-bold text-white">
                  {selected.user.avatarUrl ? <NextImage src={selected.user.avatarUrl} alt="" fill unoptimized className="object-cover" /> : initials(selected.user.name)}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{selected.user.name}</p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">@{selected.user.username ?? "pengguna"} · {relativeTime(selected.createdAt)}</p>
                  <p className="mt-1 truncate text-[9px] font-bold text-brand">{momentStatus(selected)}{selected.community ? ` · ${selected.community.name}` : ""}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tutup">
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div ref={detailScrollRef} className="overscroll-contain p-4 [scrollbar-gutter:stable] lg:min-h-0 lg:flex-1 lg:overflow-y-scroll lg:p-5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-brand">
                  {momentStatus(selected)}{selected.community ? ` · ${selected.community.name}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void toggleLike(selected)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold ${selected.likedByMe ? "bg-rose-500/10 text-rose-500" : "bg-secondary text-muted-foreground"}`}>
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

                <div className="mt-4 flex flex-wrap gap-2 border-b border-line pb-4">
                  {selected.isArchived ? <button type="button" disabled={showcaseSavingId === selected.id} onClick={() => void restoreMoment(selected)} className="btn btn-outline btn-sm"><ArchiveRestore className="h-4 w-4" /> Pulihkan dari arsip</button> : <button type="button" disabled={showcaseSavingId === selected.id} onClick={() => void toggleShowcase(selected)} className="btn btn-outline btn-sm disabled:opacity-60">
                    {showcaseSavingId === selected.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : selected.visibleOnProfile ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {selected.visibleOnProfile ? "Ditampilkan di profil" : "Tampilkan di profil"}
                  </button>}
                  <button type="button" onClick={() => void download(selected)} className="btn btn-outline btn-sm">
                    <Download className="h-4 w-4" /> Download
                  </button>
                  <button type="button" onClick={() => startEditing(selected)} className="btn btn-outline btn-sm"><Pencil className="h-4 w-4" /> Edit</button>
                  {!selected.isArchived && <button type="button" disabled={actionBusy} onClick={() => void archiveSelected()} className="btn btn-outline btn-sm"><Archive className="h-4 w-4" /> Arsipkan</button>}
                  <button type="button" disabled={actionBusy} onClick={() => void deleteSelected()} className="btn btn-outline btn-sm border-rose-500/25 text-rose-500"><Trash2 className="h-4 w-4" /> Hapus</button>
                </div>

                {editOpen && (
                  <section className="mt-4 space-y-3 rounded-2xl border border-brand/20 bg-brand-soft/25 p-3">
                    <div className="flex items-center justify-between"><p className="text-xs font-extrabold">Edit &amp; privasi Momen</p><button type="button" onClick={() => setEditOpen(false)}><X className="h-4 w-4" /></button></div>
                    <textarea value={editCaption} onChange={(event) => setEditCaption(event.target.value)} maxLength={280} rows={3} className="input resize-none" placeholder="Caption boleh dikosongkan" />
                    <button type="button" onClick={() => setEditShowLikeCount((current) => !current)} className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-3 py-2 text-[10px] font-bold"><span>Tampilkan jumlah suka</span>{editShowLikeCount ? <Eye className="h-4 w-4 text-brand" /> : <EyeOff className="h-4 w-4" />}</button>
                    <select value={editLikerList} onChange={(event) => setEditLikerList(event.target.value as "AUDIENCE" | "OWNER_ONLY")} className="input"><option value="AUDIENCE">Daftar penyuka terlihat audiens</option><option value="OWNER_ONLY">Daftar penyuka hanya saya</option></select>
                    <select value={editCommentsMode} onChange={(event) => setEditCommentsMode(event.target.value as "AUDIENCE" | "FRIENDS_ONLY" | "OFF")} className="input"><option value="AUDIENCE">Komentar semua audiens</option><option value="FRIENDS_ONLY">Komentar teman saja</option><option value="OFF">Komentar dimatikan</option></select>
                    <button type="button" disabled={actionBusy} onClick={() => void saveMoment()} className="btn btn-primary w-full"><Check className="h-4 w-4" /> Simpan perubahan</button>
                  </section>
                )}
                {actionMessage && <p className="mt-3 rounded-xl bg-secondary px-3 py-2 text-[10px] text-muted-foreground">{actionMessage}</p>}

                <section className="pt-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Komentar</h3>
                  {!commentsEnabled ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-line p-6 text-center"><Lock className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-xs font-bold">Komentar dinonaktifkan</p></div>
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
                                <button type="button" onClick={() => void removeComment(comment)} className="ml-auto text-rose-500" aria-label="Hapus komentar">
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

              {commentsEnabled ? <form onSubmit={addComment} className="flex shrink-0 gap-2 border-t border-line bg-card p-3 sm:p-4">
                <input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength={500} className="input min-w-0 flex-1" placeholder="Tulis komentar…" />
                <button type="submit" disabled={commentBusy || !commentDraft.trim()} className="btn btn-primary shrink-0 px-4" aria-label="Kirim komentar">
                  {commentBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form> : <div className="flex shrink-0 items-center justify-center gap-2 border-t border-line p-4 text-[10px] font-bold text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Komentar dimatikan</div>}
            </aside>
          </article>
        </div>
      ), document.body)}
    </section>
  );
}
