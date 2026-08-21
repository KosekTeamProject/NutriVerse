"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, MessageCircle, Pin, RefreshCw, Send, Trash2, UserCheck, UsersRound } from "lucide-react";

type Community = {
  id: string; name: string; description: string | null; emblemUrl: string | null; category: string; rules: string[]; joinPolicy: string;
  leader: { id: string; name: string; username: string | null; avatarUrl: string | null } | null;
  membership: { role: string; status: string; visibleOnProfile: boolean } | null;
  _count: { members: number; posts: number };
};
type Comment = { id: string; content: string; createdAt: string; userId: string; user: { id: string; name: string; username: string | null; avatarUrl: string | null } };
type Post = { id: string; content: string; isPinned: boolean; isOwner: boolean; createdAt: string; user: { id: string; name: string; username: string | null; avatarUrl: string | null }; comments: Comment[]; _count: { reactions: number } };
type Member = { id: string; role: string; status: string; joinedAt: string; user: { id: string; name: string; username: string | null; avatarUrl: string | null } };

export function CommunityDetail({ communityId }: { readonly communityId: string }) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [content, setContent] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/communities/${communityId}`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as { success?: boolean; community?: Community; error?: string } | null;
      if (!response.ok || !result?.success || !result.community) throw new Error(result?.error ?? "Komunitas tidak ditemukan.");
      setCommunity(result.community);
      if (result.community.membership?.status === "ACTIVE") {
        const postResponse = await fetch(`/api/communities/${communityId}/posts`, { cache: "no-store" });
        const postResult = await postResponse.json().catch(() => null) as { success?: boolean; posts?: Post[] } | null;
        if (postResponse.ok && postResult?.success) setPosts(postResult.posts ?? []);
        if (["OWNER", "ADMIN"].includes(result.community.membership.role)) {
          const memberResponse = await fetch(`/api/communities/${communityId}/members`, { cache: "no-store" });
          const memberResult = await memberResponse.json().catch(() => null) as { success?: boolean; members?: Member[] } | null;
          if (memberResponse.ok && memberResult?.success) setMembers(memberResult.members ?? []);
        }
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Komunitas gagal dimuat."); }
    finally { setLoading(false); }
  }, [communityId]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function join() {
    const response = await fetch(`/api/communities/${communityId}/membership`, { method: "POST" });
    const result = await response.json().catch(() => null) as { success?: boolean; membership?: { status: string }; error?: string } | null;
    if (!response.ok || !result?.success) setMessage(result?.error ?? "Permintaan bergabung gagal.");
    else { setMessage(result.membership?.status === "ACTIVE" ? "Kamu berhasil bergabung." : "Permintaan bergabung dikirim kepada pengelola."); await load(); }
  }

  async function toggleVisibility() {
    if (!community?.membership) return;
    const response = await fetch(`/api/communities/${communityId}/membership`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visibleOnProfile: !community.membership.visibleOnProfile }) });
    if (response.ok) await load();
  }

  async function submitPost(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(`/api/communities/${communityId}/posts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
    const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
    if (!response.ok || !result?.success) setMessage(result?.error ?? "Informasi gagal dibagikan."); else { setContent(""); await load(); }
  }

  async function submitComment(postId: string) {
    const value = comments[postId]?.trim(); if (!value) return;
    const response = await fetch(`/api/communities/${communityId}/posts/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: value }) });
    if (response.ok) { setComments((current) => ({ ...current, [postId]: "" })); await load(); } else setMessage("Komentar gagal dikirim.");
  }

  async function updatePost(post: Post, action: "pin" | "delete") {
    const response = await fetch(`/api/communities/${communityId}/posts/${post.id}`, action === "delete" ? { method: "DELETE" } : { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPinned: !post.isPinned }) });
    if (response.ok) await load();
  }

  async function reviewMember(memberId: string, action: "approve" | "reject") {
    const response = await fetch(`/api/communities/${communityId}/members`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ membershipId: memberId, action }) });
    if (response.ok) await load();
  }

  if (loading) return <div className="grid min-h-[55vh] place-items-center"><RefreshCw className="h-7 w-7 animate-spin text-brand" /></div>;
  if (!community) return <div className="mx-auto max-w-4xl space-y-4"><Link href="/komunitas" className="btn btn-outline btn-sm"><ArrowLeft className="h-4 w-4" /> Kembali</Link><div className="card card-pad text-sm text-destructive">{message || "Komunitas tidak ditemukan."}</div></div>;
  const active = community.membership?.status === "ACTIVE";
  const manager = active && ["OWNER", "ADMIN"].includes(community.membership?.role ?? "");
  const pending = members.filter((member) => member.status === "PENDING");
  return <div className="mx-auto max-w-5xl space-y-5"><Link href="/komunitas" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-brand"><ArrowLeft className="h-4 w-4" /> Kembali ke Komunitas &amp; Event</Link><section className="overflow-hidden rounded-3xl border border-line bg-card shadow-soft"><div className="h-28 bg-gradient-to-br from-[#073b2b] via-brand to-lime sm:h-36" /><div className="relative p-5 sm:p-7"><div className="-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">{community.emblemUrl ? <NextImage src={community.emblemUrl} alt="" width={96} height={96} unoptimized className="h-24 w-24 rounded-3xl border-4 border-card object-cover" /> : <span className="grid h-24 w-24 place-items-center rounded-3xl border-4 border-card bg-brand text-white"><UsersRound className="h-10 w-10" /></span>}<div className="flex flex-wrap gap-2">{active ? <><span className="pill bg-brand-soft text-xs font-bold text-brand"><Check className="h-4 w-4" /> {community.membership?.role === "OWNER" ? "Pemilik" : community.membership?.role === "ADMIN" ? "Moderator" : "Anggota"}</span><button onClick={() => void toggleVisibility()} className="btn btn-outline btn-sm">{community.membership?.visibleOnProfile ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} {community.membership?.visibleOnProfile ? "Tampil di profil" : "Disembunyikan"}</button></> : community.membership?.status === "PENDING" ? <span className="pill bg-amber/10 text-xs font-bold text-amber">Menunggu persetujuan</span> : <button onClick={() => void join()} className="btn btn-primary"><UserCheck className="h-4 w-4" /> {community.joinPolicy === "OPEN" ? "Gabung" : "Minta Bergabung"}</button>}</div></div><span className="mt-5 block text-[9px] font-bold uppercase tracking-wider text-brand">{community.category}</span><h1 className="mt-1 font-display text-3xl font-extrabold">{community.name}</h1><p className="mt-2 text-xs text-muted-foreground">{community._count.members} anggota · Dikelola {community.leader?.name ?? "NutriVerse"}</p><p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{community.description}</p></div></section>{message && <p className="rounded-2xl border border-line bg-card px-4 py-3 text-xs text-muted-foreground">{message}</p>}
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]"><main className="space-y-4">{active ? <><form onSubmit={submitPost} className="card card-pad"><label className="label">Bagikan informasi ke anggota</label><textarea required minLength={2} maxLength={1500} rows={4} value={content} onChange={(event) => setContent(event.target.value)} className="input mt-2 resize-none" placeholder="Tulis informasi, pertanyaan, atau pengumuman…" /><div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-muted-foreground">{content.length}/1500 · hanya anggota</span><button disabled={!content.trim()} className="btn btn-primary btn-sm"><Send className="h-4 w-4" /> Bagikan</button></div></form>{posts.length === 0 ? <div className="card card-pad text-center text-xs text-muted-foreground">Belum ada informasi. Mulai diskusi pertama komunitas ini.</div> : posts.map((post) => <article key={post.id} className={`card overflow-hidden ${post.isPinned ? "border-brand/30" : ""}`}><div className="p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{post.user.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold">{post.user.name}</p>{post.isPinned && <span className="flex items-center gap-1 text-[9px] font-bold text-brand"><Pin className="h-3 w-3" /> Disematkan</span>}<span className="text-[9px] text-muted-foreground">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(post.createdAt))}</span></div><p className="mt-3 whitespace-pre-line text-sm leading-7">{post.content}</p>{(manager || post.isOwner) && <div className="mt-3 flex gap-3">{manager && <button onClick={() => void updatePost(post, "pin")} className="text-[10px] font-bold text-brand">{post.isPinned ? "Lepas sematan" : "Sematkan"}</button>}<button onClick={() => void updatePost(post, "delete")} className="flex items-center gap-1 text-[10px] font-bold text-rose-500"><Trash2 className="h-3 w-3" /> Hapus</button></div>}</div></div></div><div className="border-t border-line bg-secondary/20 p-4"><p className="mb-3 flex items-center gap-2 text-[10px] font-bold text-muted-foreground"><MessageCircle className="h-3.5 w-3.5" /> {post.comments.length} komentar</p><div className="space-y-3">{post.comments.map((comment) => <div key={comment.id} className="rounded-xl bg-card px-3 py-2"><p className="text-[10px] font-bold">{comment.user.name}</p><p className="mt-1 text-xs text-muted-foreground">{comment.content}</p></div>)}</div><div className="mt-3 flex gap-2"><input maxLength={500} value={comments[post.id] ?? ""} onChange={(event) => setComments((current) => ({ ...current, [post.id]: event.target.value }))} className="input h-9 flex-1 text-xs" placeholder="Tambahkan komentar…" /><button onClick={() => void submitComment(post.id)} className="btn btn-primary btn-sm"><Send className="h-3.5 w-3.5" /></button></div></div></article>)}</> : <section className="card card-pad text-center"><LockKeyhole className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-display text-base font-extrabold">Diskusi khusus anggota</h2><p className="mt-1 text-xs text-muted-foreground">Bergabunglah untuk membaca dan membagikan informasi.</p></section>}</main><aside className="space-y-4"><section className="card card-pad"><h2 className="text-sm font-bold">Peraturan komunitas</h2><ol className="mt-3 space-y-3">{community.rules.map((rule, index) => <li key={rule} className="flex gap-2 text-xs leading-relaxed text-muted-foreground"><span className="font-bold text-brand">{index + 1}.</span>{rule}</li>)}</ol></section>{manager && pending.length > 0 && <section className="card card-pad"><h2 className="text-sm font-bold">Request Anggota</h2><div className="mt-3 space-y-3">{pending.map((member) => <div key={member.id} className="rounded-xl border border-line p-3"><p className="text-xs font-bold">{member.user.name}</p><p className="text-[9px] text-muted-foreground">@{member.user.username}</p><div className="mt-2 flex gap-2"><button onClick={() => void reviewMember(member.id, "approve")} className="btn btn-primary btn-sm">Terima</button><button onClick={() => void reviewMember(member.id, "reject")} className="btn btn-outline btn-sm">Tolak</button></div></div>)}</div></section>}</aside></div></div>;
}
