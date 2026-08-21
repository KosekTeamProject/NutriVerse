"use client";

import NextImage from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, Clock3, Search, UserPlus, UsersRound, X } from "lucide-react";

type SocialUser = { id: string; name: string; username: string | null; avatarUrl?: string | null };
type FriendConnection = { id: string; friend: SocialUser };
type PendingRequest = { id: string; requester: SocialUser };
type Relationship = "none" | "outgoing" | "incoming" | "friends";
type ActivePanel = "friends" | "requests" | "add" | null;

function Avatar({ user }: { readonly user: SocialUser }) {
  return user.avatarUrl ? (
    <NextImage src={user.avatarUrl} alt="" width={40} height={40} unoptimized className="h-10 w-10 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{user.name.slice(0, 2).toUpperCase()}</span>
  );
}

export function ProfileConnections() {
  const router = useRouter();
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [lookupUser, setLookupUser] = useState<SocialUser | null>(null);
  const [relationship, setRelationship] = useState<Relationship>("none");
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [friendsResponse, requestsResponse] = await Promise.all([
        fetch("/api/connections?list=friends", { cache: "no-store" }),
        fetch("/api/connections?incoming=true", { cache: "no-store" }),
      ]);
      const [friendsResult, requestsResult] = await Promise.all([
        friendsResponse.json().catch(() => null) as Promise<{ success?: boolean; connections?: FriendConnection[] } | null>,
        requestsResponse.json().catch(() => null) as Promise<{ success?: boolean; connections?: PendingRequest[] } | null>,
      ]);
      if (friendsResponse.ok && friendsResult?.success) setFriends((friendsResult.connections ?? []).map((connection) => connection.friend));
      if (requestsResponse.ok && requestsResult?.success) setRequests(requestsResult.connections ?? []);
    } catch {
      // Profil tetap dapat digunakan ketika ringkasan teman sedang tidak tersedia.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filteredUsers = useMemo(() => {
    const listedUsers = activePanel === "friends" ? friends : activePanel === "requests" ? requests.map((request) => request.requester) : [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return listedUsers;
    return listedUsers.filter((user) => `${user.name} ${user.username ?? ""}`.toLowerCase().includes(normalized));
  }, [activePanel, friends, query, requests]);

  function openPanel(panel: Exclude<ActivePanel, null>) {
    setMessage("");
    setQuery("");
    setLookupUser(null);
    setRelationship("none");
    setActivePanel(panel);
  }

  async function respond(connectionId: string, action: "accept" | "reject") {
    try {
      const response = action === "accept"
        ? await fetch(`/api/connections/${connectionId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "accept" }) })
        : await fetch(`/api/connections/${connectionId}`, { method: "DELETE" });
      const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      if (!response.ok || !result?.success) throw new Error(result?.error ?? "Permintaan belum dapat diperbarui.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Permintaan belum dapat diperbarui.");
    }
  }

  async function lookupUsername(event: React.FormEvent) {
    event.preventDefault();
    const username = query.trim().replace(/^@+/, "").toLowerCase();
    setChecking(true);
    setLookupUser(null);
    setMessage("");
    try {
      const response = await fetch(`/api/connections/lookup?username=${encodeURIComponent(username)}`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as { success?: boolean; user?: SocialUser; relationship?: Relationship; error?: string } | null;
      if (!response.ok || !result?.success || !result.user || !result.relationship) throw new Error(result?.error ?? "Username tidak ditemukan.");
      setLookupUser(result.user);
      setRelationship(result.relationship);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Username tidak ditemukan.");
    } finally {
      setChecking(false);
    }
  }

  async function sendRequest() {
    if (!lookupUser) return;
    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUserId: lookupUser.id }) });
      const result = await response.json().catch(() => null) as { success?: boolean; connection?: { status?: string }; error?: string } | null;
      if (!response.ok || !result?.success) throw new Error(result?.error ?? "Request teman gagal dikirim.");
      const accepted = result.connection?.status === "ACCEPTED";
      setRelationship(accepted ? "friends" : "outgoing");
      setMessage(accepted ? "Sekarang kalian sudah berteman." : "Request teman berhasil dikirim.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request teman gagal dikirim.");
    } finally {
      setSending(false);
    }
  }

  const dialog = activePanel && typeof document !== "undefined" ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[9vh] backdrop-blur-sm sm:pt-[12vh]" role="dialog" aria-modal="true" aria-labelledby="profile-connections-title" onClick={() => setActivePanel(null)}>
      <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-line px-5 py-4"><div className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-brand" /><h2 id="profile-connections-title" className="font-display text-base font-extrabold">Teman NutriVerse</h2></div><button type="button" onClick={() => setActivePanel(null)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tutup"><X className="h-5 w-5" /></button></header>
        <div className="grid grid-cols-3 border-b border-line bg-secondary/30 p-1.5">
          {(["friends", "requests", "add"] as const).map((panel) => <button key={panel} type="button" onClick={() => openPanel(panel)} className={`rounded-xl px-2 py-2 text-[11px] font-bold transition ${activePanel === panel ? "bg-card text-brand shadow-sm" : "text-muted-foreground"}`}>{panel === "friends" ? `Teman (${friends.length})` : panel === "requests" ? `Request (${requests.length})` : "Tambah Teman"}</button>)}
        </div>
        <div className="p-4 sm:p-5">
          {activePanel === "add" ? <>
            <p className="text-xs text-muted-foreground">Masukkan username lengkap. Sistem hanya menampilkan satu akun yang cocok.</p>
            <form onSubmit={lookupUsername} className="mt-3 flex gap-2"><label className="relative min-w-0 flex-1"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">@</span><input value={query} onChange={(event) => { setQuery(event.target.value.replace(/^@+/, "")); setLookupUser(null); setMessage(""); }} maxLength={30} autoCapitalize="none" autoComplete="off" spellCheck={false} className="input h-10 pl-7 text-xs" placeholder="username" autoFocus /></label><button type="submit" disabled={checking || query.trim().length < 3} className="btn btn-outline btn-sm"><Search className="h-4 w-4" /> {checking ? "Memeriksa…" : "Periksa"}</button></form>
            {lookupUser && <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-line bg-secondary/25 p-3 sm:flex-row sm:items-center"><Avatar user={lookupUser} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{lookupUser.name}</p><p className="truncate text-[11px] text-muted-foreground">@{lookupUser.username}</p></div>{relationship === "friends" ? <span className="pill bg-brand-soft text-xs font-bold text-brand"><Check className="h-3.5 w-3.5" /> Sudah teman</span> : relationship === "outgoing" ? <span className="pill bg-secondary text-xs font-bold text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> Menunggu</span> : <button type="button" onClick={() => void sendRequest()} disabled={sending} className="btn btn-primary btn-sm"><UserPlus className="h-4 w-4" /> {relationship === "incoming" ? "Setujui Request" : "Kirim Request"}</button>}</div>}
          </> : <>
            <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input h-10 pl-9 text-xs" placeholder={activePanel === "requests" ? "Cari request…" : "Cari teman…"} autoFocus /></label>
            <div className="mt-3 max-h-[52vh] space-y-2 overflow-y-auto pr-1">{filteredUsers.length === 0 ? <p className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-muted-foreground">{query ? "Pengguna tidak ditemukan." : activePanel === "requests" ? "Tidak ada request teman." : "Belum ada teman."}</p> : filteredUsers.map((user) => { const request = activePanel === "requests" ? requests.find((item) => item.requester.id === user.id) : null; return <div key={user.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary/50"><Avatar user={user} /><button type="button" onClick={() => { if (!request) { setActivePanel(null); router.push(`/profil/${user.id}`); } }} className={`min-w-0 flex-1 text-left ${request ? "cursor-default" : "cursor-pointer"}`}><p className="truncate text-xs font-bold">{user.name}</p><p className="truncate text-[10px] text-muted-foreground">{user.username ? `@${user.username}` : "Username belum diatur"}</p></button>{request && <div className="flex gap-1"><button type="button" onClick={() => void respond(request.id, "accept")} className="btn btn-primary btn-xs"><Check className="h-3.5 w-3.5" /> Setujui</button><button type="button" onClick={() => void respond(request.id, "reject")} className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Tolak request dari ${user.name}`}><X className="h-3.5 w-3.5" /></button></div>}</div>; })}</div>
          </>}
          {message && <p role="status" className="mt-3 rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">{message}</p>}
        </div>
      </section>
    </div>, document.body,
  ) : null;

  return <><div className="mt-3 flex items-center gap-5 text-xs sm:text-sm"><button type="button" onClick={() => openPanel("friends")} className="text-left transition hover:text-brand"><span className="font-extrabold">{friends.length}</span><span className="ml-1 text-muted-foreground">teman</span></button><button type="button" onClick={() => openPanel("requests")} className="text-left transition hover:text-brand"><span className="font-extrabold">{requests.length}</span><span className="ml-1 text-muted-foreground">request</span></button><button type="button" onClick={() => openPanel("add")} className="font-bold text-brand transition hover:opacity-75">Tambah teman</button></div>{dialog}</>;
}
