"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Eye, EyeOff, Plus, RefreshCw, Search, Send, UsersRound, X } from "lucide-react";
import { RecommendationCarousel, type RecommendationSlide } from "@/components/app/RecommendationCarousel";

type Membership = { role: string; status: string; visibleOnProfile: boolean };
type Community = {
  id: string; name: string; description: string | null; emblemUrl: string | null; category: string; joinPolicy: string;
  leader: { name: string; username: string | null } | null; members: Membership[]; _count: { members: number; posts: number };
};
type Proposal = { id: string; name: string; category: string; approvalStatus: string; reviewNote: string | null; isActive: boolean; createdAt: string };
type Eligibility = { used: number; limit: number; currentTier: string; minimumTier: string; eligible: boolean; usernameReady: boolean; tierReady: boolean };
type View = "explore" | "mine" | "proposals";
type DiscoveryMeta = { mode: string; total?: number; hasMore: boolean; nextCursor?: string | null };

const STATUS: Record<string, string> = { PENDING_REVIEW: "Menunggu review", NEEDS_REVISION: "Perlu revisi", APPROVED: "Disetujui", REJECTED: "Ditolak", ARCHIVED: "Diarsipkan" };
const emptyForm = { name: "", description: "", category: "", emblemUrl: "", joinPolicy: "OPEN", rule1: "", rule2: "", rule3: "" };

function CommunityCard({ community, onVisibility }: { readonly community: Community; readonly onVisibility: (community: Community) => void }) {
  const membership = community.members[0];
  return <article className="rounded-3xl border border-line bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"><div className="flex items-start gap-4">{community.emblemUrl ? <NextImage src={community.emblemUrl} alt="" width={56} height={56} unoptimized className="h-14 w-14 rounded-2xl object-cover" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-lime text-white"><UsersRound className="h-6 w-6" /></span>}<div className="min-w-0 flex-1"><span className="text-[9px] font-bold uppercase tracking-wider text-brand">{community.category}</span><h3 className="mt-1 truncate font-display text-base font-extrabold">{community.name}</h3><p className="mt-1 text-[10px] text-muted-foreground">{community._count.members} anggota · {community._count.posts} informasi</p></div></div><p className="mt-4 line-clamp-3 min-h-12 text-xs leading-relaxed text-muted-foreground">{community.description}</p><div className="mt-4 flex items-center gap-2">{membership?.status === "ACTIVE" && <button type="button" onClick={() => onVisibility(community)} className="btn btn-outline btn-sm" title="Atur tampilan di profil">{membership.visibleOnProfile ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} {membership.visibleOnProfile ? "Ditampilkan" : "Disembunyikan"}</button>}<Link href={`/komunitas/ruang/${community.id}`} className="btn btn-primary btn-sm ml-auto">{membership?.status === "ACTIVE" ? "Masuk" : membership?.status === "PENDING" ? "Menunggu" : "Lihat"}<ChevronRight className="h-4 w-4" /></Link></div></article>;
}

export function CommunityDirectory() {
  const [view, setView] = useState<View>("explore");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [featuredCommunities, setFeaturedCommunities] = useState<Community[]>([]);
  const [mine, setMine] = useState<Community[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
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
      const [mineResponse, proposalResponse] = await Promise.all([fetch("/api/communities?scope=mine", { cache: "no-store" }), fetch("/api/community-proposals", { cache: "no-store" })]);
      const own = await mineResponse.json() as { success?: boolean; communities?: Community[] };
      const proposal = await proposalResponse.json() as { success?: boolean; proposals?: Proposal[]; eligibility?: Eligibility };
      setMine(own.communities ?? []); setProposals(proposal.proposals ?? []); setEligibility(proposal.eligibility ?? null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Komunitas gagal dimuat."); }
  }, []);

  const loadExplore = useCallback(async (queryValue: string, rotationValue: number, cursor?: string | null, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: queryValue ? "20" : "12" });
      if (queryValue) params.set("q", queryValue); else params.set("rotation", String(rotationValue));
      if (cursor) params.set("cursor", cursor);
      const response = await fetch(`/api/communities?${params.toString()}`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as { success?: boolean; communities?: Community[]; meta?: DiscoveryMeta; error?: string } | null;
      if (!response.ok || !result?.success) throw new Error(result?.error ?? "Komunitas gagal dimuat.");
      setCommunities((current) => append ? [...current, ...(result.communities ?? [])] : result.communities ?? []);
      setMeta(result.meta ?? { mode: queryValue ? "search" : "recommendation", hasMore: false });
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Komunitas gagal dimuat."); }
    finally { setLoading(false); }
  }, []);

  const loadFeatured = useCallback(async () => {
    setFeaturedLoading(true);
    try {
      const response = await fetch("/api/communities?scope=featured&limit=6", { cache: "no-store" });
      const result = await response.json().catch(() => null) as { success?: boolean; communities?: Community[] } | null;
      if (response.ok && result?.success) setFeaturedCommunities(result.communities ?? []);
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350); return () => window.clearTimeout(timer); }, [query]);
  useEffect(() => { const timer = window.setTimeout(() => void loadSupporting(), 0); return () => window.clearTimeout(timer); }, [loadSupporting]);
  useEffect(() => { const timer = window.setTimeout(() => void loadFeatured(), 0); return () => window.clearTimeout(timer); }, [loadFeatured]);
  useEffect(() => { if (view !== "explore") return; const timer = window.setTimeout(() => void loadExplore(debouncedQuery, rotation), 0); return () => window.clearTimeout(timer); }, [debouncedQuery, loadExplore, rotation, view]);
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

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSubmitting(true); setMessage("");
    const response = await fetch("/api/community-proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, description: form.description, category: form.category, emblemUrl: form.emblemUrl, joinPolicy: form.joinPolicy, rules: [form.rule1, form.rule2, form.rule3] }) });
    const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
    if (!response.ok || !result?.success) setMessage(result?.error ?? "Pengajuan komunitas gagal dikirim.");
    else { setForm(emptyForm); setShowForm(false); setView("proposals"); setMessage("Pengajuan komunitas dikirim dan menunggu review Super Admin."); await loadSupporting(); }
    setSubmitting(false);
  }

  async function toggleVisibility(community: Community) {
    const membership = community.members[0]; if (!membership) return;
    const response = await fetch(`/api/communities/${community.id}/membership`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visibleOnProfile: !membership.visibleOnProfile }) });
    if (response.ok) await Promise.all([loadSupporting(), loadExplore(debouncedQuery, rotation)]); else setMessage("Visibility komunitas gagal diperbarui.");
  }

  const shown = view === "mine" ? mine : communities;
  const reason = !eligibility?.usernameReady ? "Lengkapi username terlebih dahulu." : !eligibility?.tierReady ? `Minimal rank ${eligibility?.minimumTier ?? "SEEDLING"}.` : eligibility && eligibility.used >= eligibility.limit ? "Kuota komunitas aktif sudah penuh." : "";
  const featuredSlides: RecommendationSlide[] = (featuredCommunities.length > 0 ? featuredCommunities : communities.slice(0, 6)).map((community) => {
    const membership = community.members[0];
    return {
      id: community.id,
      label: membership?.status === "ACTIVE" ? "Komunitas yang kamu ikuti" : "Rekomendasi komunitas",
      title: community.name,
      description: community.description ?? "Ruang diskusi sehat bersama pengguna NutriVerse.",
      imageUrl: community.emblemUrl,
      meta: [community.category, `${community._count.members} anggota`, community.joinPolicy === "OPEN" ? "Terbuka" : "Perlu persetujuan"],
      href: `/komunitas/ruang/${community.id}`,
      actionLabel: membership?.status === "ACTIVE" ? "Masuk komunitas" : "Lihat komunitas",
    };
  });
  return <div className="space-y-5"><RecommendationCarousel kind="community" slides={featuredSlides} loading={featuredLoading} />
    <div id="community-directory" className="flex scroll-mt-24 flex-wrap items-center justify-between gap-3"><div className="grid grid-cols-3 gap-1 rounded-2xl bg-secondary p-1">{(["explore", "mine", "proposals"] as const).map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-xl px-3 py-2.5 text-xs font-bold ${view === item ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>{item === "explore" ? "Jelajahi" : item === "mine" ? "Komunitas Saya" : "Pengajuan Saya"}</button>)}</div>{eligibility && <span className="pill bg-card text-[10px] font-bold text-muted-foreground">Komunitas dibuat: {eligibility.used}/{eligibility.limit}</span>}</div>
    {view === "explore" && <div className="rounded-2xl border border-line bg-card p-3 shadow-sm"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input h-11 pl-10 pr-10" placeholder="Cari nama, kategori, atau informasi komunitas…" aria-label="Cari komunitas" />{query && <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Hapus pencarian"><X className="h-4 w-4" /></button>}</div><p className="mt-2 px-1 text-[10px] text-muted-foreground">{debouncedQuery ? `Hasil pencarian untuk “${debouncedQuery}”` : `Menampilkan ${communities.length}${meta.total !== undefined ? ` dari ${meta.total}` : ""} rekomendasi komunitas.`}</p></div>}
    {message && <p role="status" className="rounded-2xl border border-line bg-card px-4 py-3 text-xs text-muted-foreground">{message}</p>}
    {view === "proposals" ? <section className="card card-pad"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-lg font-extrabold">Pengajuan Komunitas Saya</h3><p className="mt-1 text-xs text-muted-foreground">Buat komunitas dari bagian ini dan pantau status review Super Admin.</p>{reason && <p className="mt-1 text-[10px] text-amber">{reason}</p>}</div><button disabled={!eligibility?.eligible} onClick={() => setShowForm(true)} className="btn btn-primary btn-sm"><Plus className="h-4 w-4" /> Ajukan</button></div><div className="mt-5 space-y-3">{proposals.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-6 text-center text-xs text-muted-foreground">Belum ada pengajuan komunitas.</p> : proposals.map((proposal) => <article key={proposal.id} className="rounded-2xl border border-line p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="text-sm font-bold">{proposal.name}</h4><p className="mt-1 text-[10px] text-muted-foreground">{proposal.category}</p></div><span className="pill bg-secondary text-[9px] font-bold text-muted-foreground">{STATUS[proposal.approvalStatus] ?? proposal.approvalStatus}</span></div>{proposal.reviewNote && <p className="mt-3 rounded-xl bg-amber/10 p-3 text-xs text-amber">Catatan: {proposal.reviewNote}</p>}</article>)}</div></section> : loading ? <div className="grid min-h-60 place-items-center"><RefreshCw className="h-6 w-6 animate-spin text-brand" /></div> : shown.length === 0 ? <div className="card card-pad grid min-h-52 place-items-center text-center"><div><UsersRound className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm font-bold">Belum ada komunitas</p><p className="mt-1 text-xs text-muted-foreground">Komunitas akan muncul setelah disetujui.</p></div></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{shown.map((community) => <CommunityCard key={community.id} community={community} onVisibility={(item) => void toggleVisibility(item)} />)}</div>}
    {view === "explore" && !loading && communities.length > 0 && <div className="flex justify-center">{debouncedQuery && meta.hasMore ? <button type="button" onClick={() => void loadExplore(debouncedQuery, rotation, meta.nextCursor, true)} className="btn btn-outline"><Plus className="h-4 w-4" /> Muat hasil lainnya</button> : !debouncedQuery && meta.hasMore ? <button type="button" onClick={() => setRotation((value) => value + 1)} className="btn btn-outline"><RefreshCw className="h-4 w-4" /> Lihat rekomendasi lain</button> : null}</div>}
    {showForm && typeof document !== "undefined" && createPortal((
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-proposal-title"
        onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}
      >
        <form
          onSubmit={submit}
          onMouseDown={(event) => event.stopPropagation()}
          className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-line bg-card px-5 py-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-brand">Pengajuan terkontrol</p>
              <h2 id="community-proposal-title" className="font-display text-lg font-extrabold">Buat Komunitas</h2>
            </div>
            <button type="button" onClick={() => setShowForm(false)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-secondary" aria-label="Tutup">
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="label">Nama komunitas</span><input required minLength={3} maxLength={40} className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label><span className="label">Kategori</span><input required className="input mt-1" placeholder="Contoh: Aktivitas Fisik" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
              <label><span className="label">Cara bergabung</span><select className="input mt-1" value={form.joinPolicy} onChange={(e) => setForm({ ...form, joinPolicy: e.target.value })}><option value="OPEN">Langsung bergabung</option><option value="APPROVAL">Persetujuan pengelola</option></select></label>
              <label className="sm:col-span-2"><span className="label">Deskripsi dan tujuan</span><textarea required minLength={50} maxLength={1000} rows={4} className="input mt-1 resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
              <label className="sm:col-span-2"><span className="label">Logo URL (opsional)</span><input type="url" className="input mt-1" value={form.emblemUrl} onChange={(e) => setForm({ ...form, emblemUrl: e.target.value })} /></label>
              {(["rule1", "rule2", "rule3"] as const).map((key, index) => <label key={key} className="sm:col-span-2"><span className="label">Peraturan {index + 1}</span><input required minLength={3} maxLength={160} className="input mt-1" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}
            </div>
          </div>
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-line bg-card px-5 py-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Batal</button>
            <button disabled={submitting} className="btn btn-primary"><Send className="h-4 w-4" /> {submitting ? "Mengirim…" : "Kirim Pengajuan"}</button>
          </footer>
        </form>
      </div>
    ), document.body)}
  </div>;
}
