"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Award, CalendarDays, Check, ExternalLink, Lock, MapPin, Pin, RefreshCw, Reply, Send, ShieldCheck, Trash2, UsersRound } from "lucide-react";

type EventData = {
  id: string; title: string; description: string; bannerUrl: string; startDate: string; endDate: string;
  location: string | null; capacity: number; isJoined: boolean; hasWhatsappGroup: boolean; createdByUserId: string | null;
  participationHp: number; firstPlaceBonusHp: number; secondPlaceBonusHp: number; thirdPlaceBonusHp: number;
  createdBy: { id: string; name: string; username: string | null; avatarUrl: string | null } | null;
  _count: { registrations: number; comments: number };
};
type CommentItem = {
  id: string; content: string; isPinned: boolean; isOwner: boolean; roleLabel: string | null; createdAt: string;
  author: { id: string; name: string; username: string | null; avatarUrl: string | null };
  replies: CommentItem[];
};

function RoleBadge({ label }: { readonly label: string | null }) {
  if (!label) return null;
  const style = label === "Moderator" ? "bg-violet-500/10 text-violet-500" : label === "Penyelenggara" ? "bg-sky-500/10 text-sky-500" : "bg-brand-soft text-brand";
  return <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${style}`}>{label}</span>;
}

export function EventDetail({ eventId }: { readonly eventId: string }) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [activeTab, setActiveTab] = useState<"detail" | "discussion">("detail");
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eventResponse, commentResponse] = await Promise.all([
        fetch(`/api/events/${eventId}`, { cache: "no-store" }),
        fetch(`/api/events/${eventId}/comments`, { cache: "no-store" }),
      ]);
      const eventResult = await eventResponse.json().catch(() => null) as { success?: boolean; event?: EventData; error?: string } | null;
      const commentResult = await commentResponse.json().catch(() => null) as { success?: boolean; comments?: CommentItem[] } | null;
      if (!eventResponse.ok || !eventResult?.success || !eventResult.event) throw new Error(eventResult?.error ?? "Event tidak ditemukan.");
      setEvent(eventResult.event);
      if (commentResponse.ok && commentResult?.success) setComments(commentResult.comments ?? []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Event gagal dimuat."); }
    finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function joinEvent() {
    const response = await fetch(`/api/events/${eventId}/registration`, { method: "POST" });
    const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
    if (!response.ok || !result?.success) { setMessage(result?.error ?? "Pendaftaran event gagal."); return; }
    setEvent((current) => current ? { ...current, isJoined: true, _count: { ...current._count, registrations: current._count.registrations + 1 } } : current);
    setMessage("Pendaftaran berhasil. Informasi resmi tetap dapat dipantau di halaman ini.");
  }

  async function openWhatsapp() {
    const response = await fetch(`/api/events/${eventId}/whatsapp`, { cache: "no-store" });
    const result = await response.json().catch(() => null) as { success?: boolean; url?: string; error?: string } | null;
    if (!response.ok || !result?.success || !result.url) { setMessage(result?.error ?? "Link WhatsApp belum tersedia."); return; }
    if (!window.confirm("Lanjut ke grup WhatsApp? Nomor dan profil WhatsApp kamu mungkin terlihat oleh anggota grup. Informasi resmi event tetap berada di NutriVerse.")) return;
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    const response = await fetch(`/api/events/${eventId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: comment, parentId: replyTo?.id ?? null }) });
    const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
    if (!response.ok || !result?.success) setMessage(result?.error ?? "Komentar gagal dikirim.");
    else { setComment(""); setReplyTo(null); await load(); setActiveTab("discussion"); }
    setSubmitting(false);
  }

  async function deleteComment(commentId: string) {
    if (!window.confirm("Hapus komentar ini?")) return;
    const response = await fetch(`/api/events/${eventId}/comments/${commentId}`, { method: "DELETE" });
    if (response.ok) await load();
  }

  if (loading) return <div className="grid min-h-[55vh] place-items-center"><RefreshCw className="h-7 w-7 animate-spin text-brand" /></div>;
  if (!event) return <div className="card card-pad text-center"><p className="font-bold">{message || "Event tidak ditemukan."}</p><Link href="/komunitas" className="btn btn-outline mt-4">Kembali ke Komunitas</Link></div>;

  const start = new Date(event.startDate);
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <Link href="/komunitas" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-brand"><ArrowLeft className="h-4 w-4" /> Kembali ke Komunitas &amp; Event</Link>
      <section className="overflow-hidden rounded-3xl border border-line bg-card shadow-soft">
        <div className="relative min-h-64 bg-gradient-to-br from-brand to-[#073b2b] sm:min-h-80">{event.bannerUrl && <NextImage src={event.bannerUrl} alt="" fill unoptimized className="object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" /><div className="absolute inset-x-5 bottom-5 text-white sm:inset-x-8 sm:bottom-7"><span className="pill border border-white/20 bg-black/25 text-[10px] font-bold text-white"><ShieldCheck className="h-3.5 w-3.5" /> EVENT DISETUJUI</span><h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold sm:text-4xl">{event.title}</h1><p className="mt-2 text-sm text-white/75">Oleh {event.createdBy?.name ?? "NutriVerse"}</p></div></div>
        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"><div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand" />{new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(start)}</span><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand" />{event.location ?? "Lokasi menyusul"}</span><span className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-brand" />{event._count.registrations} / {event.capacity} peserta</span><span className="flex items-center gap-2"><Award className="h-4 w-4 text-brand" />{event.participationHp} HP hadir · bonus podium +{event.firstPlaceBonusHp}/+{event.secondPlaceBonusHp}/+{event.thirdPlaceBonusHp}</span></div><div className="flex flex-wrap gap-2">{event.isJoined ? <><span className="pill bg-brand-soft text-xs font-bold text-brand"><Check className="h-4 w-4" /> Sudah terdaftar</span>{event.hasWhatsappGroup && <button type="button" onClick={() => void openWhatsapp()} className="btn btn-outline btn-sm"><ExternalLink className="h-4 w-4" /> Gabung Grup WhatsApp</button>}</> : <button type="button" onClick={() => void joinEvent()} className="btn btn-primary"><Check className="h-4 w-4" /> Ikuti Event</button>}</div></div>
      </section>

      {message && <p role="status" className="rounded-2xl border border-line bg-card px-4 py-3 text-xs text-muted-foreground">{message}</p>}
      <div className="grid grid-cols-2 rounded-2xl bg-secondary p-1 sm:w-96"><button onClick={() => setActiveTab("detail")} className={`rounded-xl px-4 py-2.5 text-xs font-bold ${activeTab === "detail" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>Detail Event</button><button onClick={() => setActiveTab("discussion")} className={`rounded-xl px-4 py-2.5 text-xs font-bold ${activeTab === "discussion" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>Diskusi ({event._count.comments})</button></div>

      {activeTab === "detail" ? <section className="card card-pad"><h2 className="font-display text-lg font-extrabold">Tentang event</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{event.description}</p><div className="mt-5 rounded-2xl border border-brand/15 bg-brand-soft/40 p-4"><p className="flex items-center gap-2 text-xs font-bold text-brand"><Lock className="h-4 w-4" /> Informasi resmi tetap di NutriVerse</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Jadwal, lokasi, pendaftaran, dan perubahan event dipantau dari halaman ini. Grup WhatsApp hanya komunikasi tambahan bagi peserta.</p></div></section> : <section className="card overflow-hidden"><div className="border-b border-line p-5"><h2 className="font-display text-lg font-extrabold">Diskusi Event</h2><p className="mt-1 text-xs text-muted-foreground">Komentar hanya berada di event ini dan tidak tercampur dengan event lain.</p><form onSubmit={submitComment} className="mt-4"><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} rows={3} className="input resize-none" placeholder={replyTo ? `Balas ${replyTo.author.name}…` : "Tulis pertanyaan atau informasi…"} />{replyTo && <button type="button" onClick={() => setReplyTo(null)} className="mt-1 text-[10px] font-bold text-brand">Batalkan balasan</button>}<div className="mt-2 flex items-center justify-between"><span className="text-[10px] text-muted-foreground">{comment.length}/500</span><button disabled={submitting || !comment.trim()} className="btn btn-primary btn-sm"><Send className="h-4 w-4" /> {submitting ? "Mengirim…" : "Kirim"}</button></div></form></div><div className="divide-y divide-line/70">{comments.length === 0 ? <p className="p-8 text-center text-xs text-muted-foreground">Belum ada diskusi pada event ini.</p> : comments.map((item) => <article key={item.id} className={`p-5 ${item.isPinned ? "bg-brand-soft/25" : ""}`}><div className="flex items-start gap-3">{item.author.avatarUrl ? <NextImage src={item.author.avatarUrl} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{item.author.name.slice(0, 2).toUpperCase()}</span>}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold">{item.author.name}</p><RoleBadge label={item.roleLabel} />{item.isPinned && <span className="flex items-center gap-1 text-[9px] font-bold text-brand"><Pin className="h-3 w-3" /> Disematkan</span>}<span className="text-[9px] text-muted-foreground">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</span></div><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">{item.content}</p><div className="mt-2 flex gap-3"><button type="button" onClick={() => { setReplyTo(item); setComment(""); }} className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-brand"><Reply className="h-3 w-3" /> Balas</button>{item.isOwner && <button type="button" onClick={() => void deleteComment(item.id)} className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /> Hapus</button>}</div>{item.replies?.length > 0 && <div className="mt-4 space-y-3 border-l-2 border-line pl-4">{item.replies.map((reply) => <div key={reply.id}><div className="flex flex-wrap items-center gap-2"><p className="text-[11px] font-bold">{reply.author.name}</p><RoleBadge label={reply.roleLabel} /></div><p className="mt-1 text-xs leading-relaxed">{reply.content}</p></div>)}</div>}</div></div></article>)}</div></section>}
    </div>
  );
}
