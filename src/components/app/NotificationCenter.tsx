"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Archive,
  BellRing,
  CalendarDays,
  CheckCheck,
  CircleAlert,
  Gift,
  History,
  LoaderCircle,
  MessageCircle,
  Sparkles,
  Trophy,
} from "lucide-react";

type NotificationScope = "active" | "history";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  archivedAt: string | null;
  expiresAt: string | null;
  requiresAction: boolean;
  processingAt: string | null;
  resolvedAt: string | null;
  actionUrl: string | null;
  createdAt: string;
};

type NotificationResponse = {
  success?: boolean;
  notifications?: NotificationItem[];
  totalCount?: number;
  unreadCount?: number;
  nextCursor?: string | null;
  error?: string;
};

const typePresentation: Record<
  string,
  { label: string; icon: typeof BellRing; tone: string }
> = {
  ACTIVITY: { label: "Aktivitas", icon: Activity, tone: "bg-brand-soft text-brand" },
  CHEAT_ALERT: { label: "Verifikasi", icon: CircleAlert, tone: "bg-amber/15 text-amber" },
  CHALLENGE: { label: "Tantangan", icon: Trophy, tone: "bg-sky/10 text-sky" },
  EVENT: { label: "Event", icon: CalendarDays, tone: "bg-violet-500/10 text-violet-600" },
  REWARD: { label: "Reward", icon: Gift, tone: "bg-lime/15 text-lime" },
  SOCIAL: { label: "Sosial", icon: MessageCircle, tone: "bg-rose-500/10 text-rose-600" },
  WEEKLY_LETTER: { label: "Nora", icon: Sparkles, tone: "bg-brand-soft text-brand" },
};

function presentationFor(type: string) {
  return typePresentation[type] ?? {
    label: "Sistem",
    icon: BellRing,
    tone: "bg-secondary text-muted-foreground",
  };
}

function fallbackHref(type: string) {
  if (type === "CHALLENGE") return "/challenge";
  if (type === "REWARD") return "/reward";
  if (type === "EVENT") return "/komunitas";
  if (type === "SOCIAL") return "/profil";
  if (type === "ACTIVITY" || type === "CHEAT_ALERT") return "/aktivitas";
  if (type === "WEEKLY_LETTER") return "/companion/weekly-letter";
  return "/todays-journey";
}

function notificationHref(item: NotificationItem) {
  return item.actionUrl?.startsWith("/") && !item.actionUrl.startsWith("//")
    ? item.actionUrl
    : fallbackHref(item.type);
}

function fullTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusFor(item: NotificationItem) {
  const expired = item.expiresAt && new Date(item.expiresAt).getTime() <= Date.now();
  if (item.resolvedAt) return { label: "Selesai", className: "bg-brand-soft text-brand" };
  if (expired) return { label: "Kedaluwarsa", className: "bg-secondary text-muted-foreground" };
  if (item.processingAt) return { label: "Sedang diproses", className: "bg-sky/10 text-sky" };
  if (item.requiresAction) return { label: "Perlu tindakan", className: "bg-amber/15 text-amber" };
  if (!item.isRead) return { label: "Baru", className: "bg-brand-soft text-brand" };
  return { label: "Sudah dibaca", className: "bg-secondary text-muted-foreground" };
}

function dateGroup(item: NotificationItem) {
  const expired = item.expiresAt && new Date(item.expiresAt).getTime() <= Date.now();
  if (item.requiresAction && !item.processingAt && !item.resolvedAt && !expired) {
    return "Perlu perhatian";
  }
  if (item.processingAt && !item.resolvedAt && !expired) return "Sedang diproses";

  const created = new Date(item.createdAt);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startCreated = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const difference = Math.round((startToday.getTime() - startCreated.getTime()) / 86_400_000);
  if (difference === 0) return "Hari ini";
  if (difference === 1) return "Kemarin";
  return "Sebelumnya";
}

export function NotificationCenter() {
  const [scope, setScope] = useState<NotificationScope>("active");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (
    selectedScope: NotificationScope,
    cursor: string | null = null,
    append = false,
  ) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/notifications?scope=${selectedScope}&limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
        { cache: "no-store" },
      );
      const result = (await response.json().catch(() => null)) as NotificationResponse | null;
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Notifikasi belum dapat dimuat.");
      }
      setItems((current) => append
        ? [...current, ...(result.notifications ?? [])]
        : result.notifications ?? []);
      setTotalCount(result.totalCount ?? 0);
      setUnreadCount(result.unreadCount ?? 0);
      setNextCursor(result.nextCursor ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Notifikasi belum dapat dimuat.");
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, NotificationItem[]>();
    for (const item of items) {
      const label = dateGroup(item);
      groups.set(label, [...(groups.get(label) ?? []), item]);
    }
    const order = ["Perlu perhatian", "Sedang diproses", "Hari ini", "Kemarin", "Sebelumnya"];
    return order.flatMap((label) => {
      const notifications = groups.get(label);
      return notifications?.length ? [{ label, notifications }] : [];
    });
  }, [items]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(scope), 0);
    return () => window.clearTimeout(timer);
  }, [load, scope]);

  async function markRead(item: NotificationItem) {
    if (item.isRead) return;
    setItems((current) => current.map((candidate) =>
      candidate.id === item.id
        ? { ...candidate, isRead: true, readAt: new Date().toISOString() }
        : candidate,
    ));
    setUnreadCount((count) => Math.max(0, count - 1));
    await fetch(`/api/notifications/${item.id}/read`, { method: "PATCH" }).catch(() => null);
  }

  async function markAllRead() {
    const response = await fetch("/api/notifications", { method: "PATCH" }).catch(() => null);
    if (!response?.ok) return;
    const now = new Date().toISOString();
    setItems((current) => current.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? now })));
    setUnreadCount(0);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-line/80 bg-card shadow-soft">
        <div className="relative px-5 py-6 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand-soft px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand">
                <BellRing className="h-3.5 w-3.5" /> Pusat notifikasi
              </span>
              <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Pembaruan yang tetap mudah diikuti
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Notifikasi yang dibaca tetap tersedia selama 24 jam. Pembaruan yang memerlukan tindakan tidak diarsipkan sebelum selesai atau kedaluwarsa.
              </p>
            </div>
            {scope === "active" && unreadCount > 0 && (
              <button onClick={markAllRead} className="btn btn-secondary btn-sm shrink-0">
                <CheckCheck className="h-4 w-4" /> Tandai semua dibaca
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="card overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-line/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="inline-flex w-fit rounded-2xl bg-secondary/70 p-1">
            <button
              onClick={() => setScope("active")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${scope === "active" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <BellRing className="h-4 w-4" /> Aktif
            </button>
            <button
              onClick={() => setScope("history")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${scope === "history" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <History className="h-4 w-4" /> Riwayat
            </button>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            {totalCount} {scope === "active" ? "notifikasi aktif" : "notifikasi tersimpan"}
          </p>
        </div>

        {loading && (
          <div className="grid min-h-64 place-items-center">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Memuat notifikasi...
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="grid min-h-64 place-items-center px-6 text-center">
            <div>
              <CircleAlert className="mx-auto h-8 w-8 text-amber" />
              <p className="mt-3 text-sm font-bold">Notifikasi belum dapat ditampilkan</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <button onClick={() => void load(scope)} className="btn btn-secondary btn-sm mt-4">Coba lagi</button>
            </div>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="grid min-h-64 place-items-center px-6 text-center">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                {scope === "active" ? <BellRing className="h-5 w-5" /> : <Archive className="h-5 w-5" />}
              </span>
              <p className="mt-4 text-sm font-bold">
                {scope === "active" ? "Belum ada pembaruan terbaru" : "Riwayat masih kosong"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {scope === "active" ? "Pembaruan aktivitas dan komunitas akan muncul di sini." : "Notifikasi yang sudah selesai akan tersimpan di sini."}
              </p>
            </div>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div>
            {groupedItems.map((group) => (
              <section key={group.label} aria-labelledby={`notification-group-${group.label.replaceAll(" ", "-").toLowerCase()}`}>
                <div className="border-y border-line/50 bg-secondary/35 px-4 py-2 sm:px-6">
                  <h2 id={`notification-group-${group.label.replaceAll(" ", "-").toLowerCase()}`} className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                    {group.label}
                  </h2>
                </div>
                <div className="divide-y divide-line/60">
                  {group.notifications.map((item) => {
              const presentation = presentationFor(item.type);
              const Icon = presentation.icon;
              const status = statusFor(item);
              return (
                <Link
                  key={item.id}
                  href={notificationHref(item)}
                  onClick={() => void markRead(item)}
                  className={`group flex gap-3 px-4 py-4 transition hover:bg-secondary/45 sm:gap-4 sm:px-6 ${!item.isRead && scope === "active" ? "bg-brand/[0.035]" : ""}`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${presentation.tone}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground group-hover:text-brand">{item.title}</span>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${status.className}`}>{status.label}</span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{item.message}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-muted-foreground">
                      <span>{presentation.label}</span>
                      <span aria-hidden="true">•</span>
                      <time dateTime={item.createdAt}>{fullTime(item.createdAt)}</time>
                      {item.processingAt && !item.resolvedAt
                        ? <span className="text-sky">Menunggu proses selesai</span>
                        : item.requiresAction && !item.resolvedAt && <span className="text-amber">Tetap aktif hingga selesai</span>}
                    </span>
                  </span>
                  {!item.isRead && <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-brand ring-4 ring-brand/10" aria-label="Belum dibaca" />}
                </Link>
              );
                  })}
                </div>
              </section>
            ))}
            {nextCursor && (
              <div className="border-t border-line/60 p-4 text-center">
                <button
                  onClick={() => void load(scope, nextCursor, true)}
                  disabled={loadingMore}
                  className="btn btn-secondary btn-sm"
                >
                  {loadingMore ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
                  {loadingMore ? "Memuat..." : "Muat lebih banyak"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
