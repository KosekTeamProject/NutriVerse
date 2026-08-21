"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, EyeOff, LoaderCircle, UsersRound } from "lucide-react";

type Community = {
  id: string;
  name: string;
  category: string;
  members: Array<{ role: string; status: string; visibleOnProfile: boolean }>;
  _count: { members: number };
};

type MembershipResult = { success?: boolean; error?: string };

export function ProfileCommunities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/communities?scope=mine", { cache: "no-store" });
    const result = await response.json().catch(() => null) as { success?: boolean; communities?: Community[] } | null;
    if (response.ok && result?.success) setCommunities(result.communities ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function toggle(community: Community) {
    const membership = community.members[0];
    if (!membership || updatingId) return;

    const nextVisibility = !membership.visibleOnProfile;
    setUpdatingId(community.id);
    setMessage(null);

    try {
      const response = await fetch(`/api/communities/${community.id}/membership`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibleOnProfile: nextVisibility }),
      });
      const result = await response.json().catch(() => null) as MembershipResult | null;
      if (!response.ok || !result?.success) {
        setMessage(result?.error ?? "Pengaturan tampilan komunitas gagal disimpan.");
        return;
      }

      setCommunities((current) => current.map((item) => item.id === community.id
        ? { ...item, members: item.members.map((member, index) => index === 0 ? { ...member, visibleOnProfile: nextVisibility } : member) }
        : item));
      setMessage(nextVisibility
        ? `${community.name} sekarang ditampilkan kepada teman di profilmu.`
        : `${community.name} sekarang disembunyikan dari profil teman.`);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section id="komunitas-profil" className="card card-pad scroll-mt-24">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
            <UsersRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-sm font-extrabold">Komunitas yang Diikuti</h2>
            <p className="text-[10px] text-muted-foreground">Pilih komunitas yang boleh dilihat teman di profil.</p>
          </div>
        </div>
        <Link href="/komunitas" className="text-[10px] font-bold text-brand">Lihat semua</Link>
      </div>

      {message && <p className="mt-4 rounded-xl border border-line bg-secondary/40 px-3 py-2 text-[10px] text-muted-foreground">{message}</p>}

      {loading ? (
        <p className="mt-4 text-xs text-muted-foreground">Memuat komunitas…</p>
      ) : communities.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line p-4 text-center text-xs text-muted-foreground">Kamu belum bergabung ke komunitas.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {communities.map((community) => {
            const membership = community.members[0];
            const visible = membership?.visibleOnProfile ?? false;
            const updating = updatingId === community.id;

            return (
              <div key={community.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                <Link href={`/komunitas/ruang/${community.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{community.name}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground">{community.category} · {community._count.members} anggota</p>
                </Link>
                <button
                  type="button"
                  onClick={() => void toggle(community)}
                  disabled={updating}
                  className="btn btn-outline btn-sm shrink-0"
                  title={visible ? "Klik untuk menyembunyikan dari profil teman" : "Klik untuk menampilkan di profil teman"}
                >
                  {updating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : visible ? <Eye className="h-4 w-4 text-brand" /> : <EyeOff className="h-4 w-4" />}
                  {visible ? "Ditampilkan" : "Disembunyikan"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
