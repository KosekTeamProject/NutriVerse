"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, ChevronRight, MapPin, Plus, RefreshCw, Search, Send, UsersRound, X } from "lucide-react";
import { RecommendationCarousel, type RecommendationSlide } from "@/components/app/RecommendationCarousel";

type EventItem = {
  id: string; title: string; description: string; bannerUrl: string; startDate: string; endDate: string;
  location: string | null; capacity: number; registrations: Array<{ status: string }>;
  createdBy: { name: string; username: string | null } | null;
  _count: { registrations: number };
};
type Proposal = { id: string; title: string; startDate: string; endDate: string; location: string | null; approvalStatus: string; reviewNote: string | null; whatsappLinkStatus: string; createdAt: string };
type Tab = "events" | "joined" | "proposals";
type DiscoveryMeta = { mode: string; total?: number; hasMore: boolean; nextCursor?: string | null };

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: "Menunggu review", NEEDS_REVISION: "Perlu revisi", APPROVED: "Disetujui",
  REJECTED: "Ditolak", CANCELLED: "Dibatalkan", NONE: "Tidak diajukan", DISABLED: "Dinonaktifkan",
};
const emptyForm = { title: "", description: "", bannerUrl: "", location: "", startDate: "", endDate: "", capacity: "50", whatsappInviteUrl: "" };

function EventCard({ event }: { readonly event: EventItem }) {
  const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(event.startDate));
  const joined = event.registrations.some((registration) => registration.status !== "CANCELLED");
  return (
    <article className="group overflow-hidden rounded-3xl border border-line bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand to-[#073b2b]">
        {event.bannerUrl && <NextImage src={event.bannerUrl} alt="" fill unoptimized className="object-cover transition duration-500 group-hover:scale-105" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-[9px] font-bold text-white backdrop-blur">EVENT DISETUJUI</span>
        {joined && <span className="absolute right-4 top-4 rounded-full bg-brand px-2.5 py-1 text-[9px] font-bold text-white"><Check className="mr-1 inline h-3 w-3" />Terdaftar</span>}
        <h3 className="absolute inset-x-4 bottom-4 line-clamp-2 font-display text-lg font-extrabold text-white">{event.title}</h3>
      </div>
      <div className="p-4">
        <div className="space-y-2 text-[11px] text-muted-foreground"><p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-brand" />{date}</p><p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-brand" />{event.location ?? "Lokasi menyusul"}</p><p className="flex items-center gap-2"><UsersRound className="h-3.5 w-3.5 text-brand" />{event._count.registrations} / {event.capacity} peserta</p></div>
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{event.description}</p>
        <Link href={`/komunitas/event/${event.id}`} className="btn btn-outline btn-sm mt-4 w-full">Lihat detail &amp; diskusi <ChevronRight className="h-4 w-4" /></Link>
      </div>
    </article>
  );
}

export function CommunityEvents() {
  const [tab, setTab] = useState<Tab>("events");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<EventItem[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<EventItem[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [quota, setQuota] = useState({ used: 0, limit: 2 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [rotation, setRotation] = useState(0);
  const [meta, setMeta] = useState<DiscoveryMeta>({ mode: "recommendation", hasMore: false });

  const loadSupporting = useCallback(async () => {
    try {
      const [joinedResponse, proposalsResponse] = await Promise.all([fetch("/api/events?scope=joined", { cache: "no-store" }), fetch("/api/event-proposals", { cache: "no-store" })]);
      const joinedResult = await joinedResponse.json().catch(() => null) as { success?: boolean; events?: EventItem[]; error?: string } | null;
      const proposalResult = await proposalsResponse.json().catch(() => null) as { success?: boolean; proposals?: Proposal[]; quota?: { used: number; limit: number } } | null;
      if (!joinedResponse.ok || !joinedResult?.success) throw new Error(joinedResult?.error ?? "Event Saya gagal dimuat.");
      setJoinedEvents(joinedResult.events ?? []);
      if (proposalsResponse.ok && proposalResult?.success) setProposals(proposalResult.proposals ?? []);
      if (proposalResult?.quota) setQuota(proposalResult.quota);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Event gagal dimuat.");
    }
  }, []);

  const loadEvents = useCallback(async (queryValue: string, rotationValue: number, cursor?: string | null, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: queryValue ? "20" : "12" });
      if (queryValue) params.set("q", queryValue); else params.set("rotation", String(rotationValue));
      if (cursor) params.set("cursor", cursor);
      const response = await fetch(`/api/events?${params.toString()}`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as { success?: boolean; events?: EventItem[]; meta?: DiscoveryMeta; error?: string } | null;
      if (!response.ok || !result?.success) throw new Error(result?.error ?? "Event gagal dimuat.");
      setEvents((current) => append ? [...current, ...(result.events ?? [])] : result.events ?? []);
      setMeta(result.meta ?? { mode: queryValue ? "search" : "recommendation", hasMore: false });
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Event gagal dimuat."); }
    finally { setLoading(false); }
  }, []);

  const loadFeatured = useCallback(async () => {
    setFeaturedLoading(true);
    try {
      const response = await fetch("/api/events?scope=featured&limit=6", { cache: "no-store" });
      const result = await response.json().catch(() => null) as { success?: boolean; events?: EventItem[] } | null;
      if (response.ok && result?.success) setFeaturedEvents(result.events ?? []);
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350); return () => window.clearTimeout(timer); }, [query]);
  useEffect(() => { const timer = window.setTimeout(() => void loadSupporting(), 0); return () => window.clearTimeout(timer); }, [loadSupporting]);
  useEffect(() => { const timer = window.setTimeout(() => void loadFeatured(), 0); return () => window.clearTimeout(timer); }, [loadFeatured]);
  useEffect(() => { if (tab !== "events") return; const timer = window.setTimeout(() => void loadEvents(debouncedQuery, rotation), 0); return () => window.clearTimeout(timer); }, [debouncedQuery, loadEvents, rotation, tab]);
  useEffect(() => {
    if (!showForm) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setShowForm(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showForm]);

  async function submitProposal(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true); setMessage("");
    try {
      const response = await fetch("/api/event-proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, capacity: Number(form.capacity) }) });
      const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      if (!response.ok || !result?.success) throw new Error(result?.error ?? "Pengajuan event gagal dikirim.");
      setForm(emptyForm); setShowForm(false); setTab("proposals"); setMessage("Pengajuan event dikirim dan menunggu review Super Admin.");
      await Promise.all([loadSupporting(), loadEvents(debouncedQuery, rotation)]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Pengajuan event gagal dikirim."); }
    finally { setSubmitting(false); }
  }

  const visibleEvents = tab === "joined" ? joinedEvents : events;
  const featuredSlides: RecommendationSlide[] = (featuredEvents.length > 0 ? featuredEvents : events.filter((event) => new Date(event.startDate) >= new Date()).slice(0, 6)).map((event) => {
    const joined = event.registrations.some((registration) => registration.status !== "CANCELLED");
    const startDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(event.startDate));
    return {
      id: event.id,
      label: joined ? "Event yang kamu ikuti" : "Event akan dimulai",
      title: event.title,
      description: event.description,
      imageUrl: event.bannerUrl,
      meta: [startDate, event.location ?? "Lokasi menyusul", `${event._count.registrations} / ${event.capacity} peserta`],
      href: `/komunitas/event/${event.id}`,
      actionLabel: joined ? "Buka event" : "Lihat event",
    };
  });

  return (
    <div className="space-y-6">
      <RecommendationCarousel kind="event" slides={featuredSlides} loading={featuredLoading} />

      <div id="event-directory" className="grid scroll-mt-24 grid-cols-3 gap-1 rounded-2xl bg-secondary p-1 sm:inline-grid sm:grid-cols-3">
        {(["events", "joined", "proposals"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${tab === item ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>{item === "events" ? "Event Tersedia" : item === "joined" ? "Event Saya" : "Pengajuan Saya"}</button>)}
      </div>

      {tab === "events" && <div className="rounded-2xl border border-line bg-card p-3 shadow-sm"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input h-11 pl-10 pr-10" placeholder="Cari nama, lokasi, atau penyelenggara event…" aria-label="Cari event" />{query && <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Hapus pencarian"><X className="h-4 w-4" /></button>}</div><p className="mt-2 px-1 text-[10px] text-muted-foreground">{debouncedQuery ? `Hasil pencarian untuk “${debouncedQuery}”` : `Menampilkan ${events.length}${meta.total !== undefined ? ` dari ${meta.total}` : ""} rekomendasi event.`}</p></div>}

      {message && <p role="status" className="rounded-2xl border border-line bg-card px-4 py-3 text-xs text-muted-foreground">{message}</p>}
      {tab === "proposals" ? (
        <section className="card card-pad"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-extrabold">Pengajuan Event Saya</h2><p className="mt-1 text-xs text-muted-foreground">Status review dan catatan Super Admin · kuota {quota.used}/{quota.limit} aktif.</p></div><button disabled={quota.used >= quota.limit} onClick={() => setShowForm(true)} className="btn btn-primary btn-sm"><Plus className="h-4 w-4" /> Ajukan</button></div><div className="mt-5 space-y-3">{proposals.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-6 text-center text-xs text-muted-foreground">Belum ada pengajuan event.</p> : proposals.map((proposal) => <article key={proposal.id} className="rounded-2xl border border-line p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-bold">{proposal.title}</h3><p className="mt-1 text-[11px] text-muted-foreground">{new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(proposal.startDate))} · {proposal.location}</p></div><span className="pill bg-secondary text-[10px] font-bold text-muted-foreground">{STATUS_LABEL[proposal.approvalStatus] ?? proposal.approvalStatus}</span></div>{proposal.reviewNote && <p className="mt-3 rounded-xl bg-amber/10 p-3 text-xs text-amber">Catatan review: {proposal.reviewNote}</p>}<p className="mt-3 text-[10px] text-muted-foreground">Link WhatsApp: {STATUS_LABEL[proposal.whatsappLinkStatus] ?? proposal.whatsappLinkStatus}</p></article>)}</div></section>
      ) : loading ? <div className="grid min-h-60 place-items-center"><RefreshCw className="h-6 w-6 animate-spin text-brand" /></div> : visibleEvents.length === 0 ? <div className="card card-pad grid min-h-60 place-items-center text-center"><div><CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm font-bold">Belum ada event</p><p className="mt-1 text-xs text-muted-foreground">Event akan muncul setelah disetujui Super Admin.</p></div></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleEvents.map((event) => <EventCard key={event.id} event={event} />)}</div>}

      {tab === "events" && !loading && events.length > 0 && <div className="flex justify-center">{debouncedQuery && meta.hasMore ? <button type="button" onClick={() => void loadEvents(debouncedQuery, rotation, meta.nextCursor, true)} className="btn btn-outline"><Plus className="h-4 w-4" /> Muat hasil lainnya</button> : !debouncedQuery && meta.hasMore ? <button type="button" onClick={() => setRotation((value) => value + 1)} className="btn btn-outline"><RefreshCw className="h-4 w-4" /> Lihat rekomendasi lain</button> : null}</div>}

      {showForm && typeof document !== "undefined" && createPortal((
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-proposal-title"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}
        >
          <form
            onSubmit={submitProposal}
            onMouseDown={(event) => event.stopPropagation()}
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-line bg-card px-5 py-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-brand">Pengajuan terkontrol</p>
                <h2 id="event-proposal-title" className="font-display text-lg font-extrabold">Ajukan Event</h2>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-secondary" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="label">Nama event</span><input required minLength={3} maxLength={150} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input mt-1" /></label>
                <label className="sm:col-span-2"><span className="label">Deskripsi</span><textarea required minLength={20} maxLength={2000} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input mt-1 resize-none" /></label>
                <label><span className="label">Mulai</span><input required type="datetime-local" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="input mt-1" /></label>
                <label><span className="label">Selesai</span><input required type="datetime-local" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="input mt-1" /></label>
                <label><span className="label">Lokasi</span><input required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="input mt-1" /></label>
                <label><span className="label">Kapasitas</span><input required type="number" min="1" max="100000" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} className="input mt-1" /></label>
                <label className="sm:col-span-2"><span className="label">Banner URL (opsional)</span><input type="url" value={form.bannerUrl} onChange={(event) => setForm({ ...form, bannerUrl: event.target.value })} className="input mt-1" placeholder="https://…" /></label>
                <label className="sm:col-span-2"><span className="label">Link grup WhatsApp (opsional)</span><input type="url" value={form.whatsappInviteUrl} onChange={(event) => setForm({ ...form, whatsappInviteUrl: event.target.value })} className="input mt-1" placeholder="https://chat.whatsapp.com/…" /><span className="mt-1 block text-[10px] text-muted-foreground">Link diperiksa Super Admin dan hanya terlihat oleh peserta terdaftar.</span></label>
              </div>
            </div>
            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-line bg-card px-5 py-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Batal</button>
              <button disabled={submitting} className="btn btn-primary"><Send className="h-4 w-4" /> {submitting ? "Mengirim…" : "Kirim Pengajuan"}</button>
            </footer>
          </form>
        </div>
      ), document.body)}
    </div>
  );
}
