"use client";

import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Clock3, LoaderCircle, Search, UserPlus, UsersRound, X } from "lucide-react";

type SearchUser = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  relationship: "self" | "friends" | "outgoing" | "incoming" | "none";
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function relationshipMeta(relationship: SearchUser["relationship"]) {
  if (relationship === "friends") return { label: "Teman", icon: Check };
  if (relationship === "outgoing") return { label: "Menunggu", icon: Clock3 };
  if (relationship === "incoming") return { label: "Request", icon: UserPlus };
  if (relationship === "self") return { label: "Profilmu", icon: UsersRound };
  return { label: "Lihat profil", icon: UserPlus };
}

export function UserProfileSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Ketik minimal 2 karakter.");

  useEffect(() => {
    function closeFromOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeFromOutside);
    return () => document.removeEventListener("mousedown", closeFromOutside);
  }, []);

  useEffect(() => {
    const cleanQuery = query.trim().replace(/^@+/, "");
    if (cleanQuery.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setMessage("");
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(cleanQuery)}`, { cache: "no-store", signal: controller.signal });
        const result = await response.json().catch(() => null) as { success?: boolean; users?: SearchUser[]; error?: string } | null;
        if (!response.ok || !result?.success) {
          setUsers([]);
          setMessage(result?.error ?? "Pencarian pengguna belum dapat dilakukan.");
          return;
        }
        const nextUsers = result.users ?? [];
        setUsers(nextUsers);
        setMessage(nextUsers.length ? "" : "Pengguna tidak ditemukan.");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setUsers([]);
          setMessage("Pencarian pengguna belum dapat dilakukan.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function openProfile(user: SearchUser) {
    setOpen(false);
    setQuery("");
    router.push(user.relationship === "self" ? "/profil" : `/profil/${user.id}`);
  }

  return (
    <div ref={rootRef} className="relative min-w-0 max-w-xl flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          setOpen(true);
          if (value.trim().replace(/^@+/, "").length < 2) {
            setUsers([]);
            setLoading(false);
            setMessage("Ketik minimal 2 karakter.");
          }
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && users[0]) openProfile(users[0]);
        }}
        className="input h-10 w-full pl-9 pr-9 text-sm shadow-sm"
        placeholder="Cari nama atau @username..."
        aria-label="Cari profil pengguna"
        role="combobox"
        aria-controls="profile-search-results"
        aria-autocomplete="list"
        aria-expanded={open && Boolean(query.trim())}
      />
      {loading ? (
        <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand" />
      ) : query ? (
        <button onClick={() => { setQuery(""); setUsers([]); setOpen(false); }} className="absolute right-2 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Hapus pencarian">
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {open && query.trim() && (
        <section id="profile-search-results" className="absolute inset-x-0 top-[calc(100%+0.55rem)] z-50 max-h-[min(28rem,65vh)] overflow-y-auto rounded-2xl border border-line bg-card p-2 shadow-2xl" aria-label="Hasil pencarian pengguna">
          {users.length ? users.map((user) => {
            const meta = relationshipMeta(user.relationship);
            const RelationshipIcon = meta.icon;
            return (
              <button key={user.id} type="button" onClick={() => openProfile(user)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-secondary" role="option" aria-selected="false">
                <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-lime text-[10px] font-extrabold text-white">
                  {user.avatarUrl ? <NextImage src={user.avatarUrl} alt="" fill unoptimized className="object-cover" /> : initials(user.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-extrabold text-foreground">{user.name}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">@{user.username ?? "pengguna"}{user.bio ? ` · ${user.bio}` : ""}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-1 text-[8px] font-bold text-brand">
                  <RelationshipIcon className="h-3 w-3" /> {meta.label}
                </span>
              </button>
            );
          }) : (
            <div className="px-4 py-6 text-center">
              {loading ? <LoaderCircle className="mx-auto h-5 w-5 animate-spin text-brand" /> : <UsersRound className="mx-auto h-6 w-6 text-muted-foreground" />}
              <p className="mt-2 text-xs font-bold text-foreground">{loading ? "Mencari pengguna…" : message}</p>
              {!loading && <p className="mt-1 text-[10px] text-muted-foreground">Cari menggunakan nama atau username NutriVerse.</p>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
