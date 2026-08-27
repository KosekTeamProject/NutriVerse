"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Bell, CalendarDays, Check, CircleDollarSign, FileWarning, Gift, Images, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Trophy, UserCog, Users, X, Newspaper } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AdminEventPanel } from "@/components/admin/AdminEventPanel";
import { ShareTemplateAdmin } from "@/components/admin/ShareTemplateAdmin";
import { clearAdminSession, type AdminRole, type AdminSession } from "@/features/admin/session";

type AdminView = "overview" | "moderation" | "users" | "operations" | "templates" | "admins" | "settings" | "events";
type ReportStatus = "Menunggu" | "Dipertahankan" | "Diturunkan";

const NAV_ITEMS = [
  { id: "overview" as const, label: "Ringkasan", icon: LayoutDashboard },
  { id: "moderation" as const, label: "Moderasi", icon: FileWarning, badge: 12 },
  { id: "users" as const, label: "Pengguna", icon: Users },
  { id: "operations" as const, label: "Operasional", icon: Trophy },
  { id: "templates" as const, label: "Template Berbagi", icon: Images },
  { id: "admins" as const, label: "Daftar Admin", icon: UserCog },
  { id: "settings" as const, label: "Pengaturan Sistem", icon: Settings },
  { id: "events" as const, label: "Kelola Event", icon: CalendarDays },
];

const USER_ROWS = [
  { name: "Legacy", tier: "-", active: "-", trust: "-", status: "Aktif" },
];

// Kept as a visual fallback reference while the live overview is loading.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyOverview() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pengguna aktif", value: "2.143", note: "+124 hari ini", icon: Users, color: "text-emerald-500" },
          { label: "Aktivitas tervalidasi", value: "18.420", note: "97,2% lolos", icon: Activity, color: "text-sky-500" },
          { label: "Laporan terbuka", value: "12", note: "3 prioritas tinggi", icon: AlertTriangle, color: "text-amber-500" },
          { label: "HP beredar", value: "8,4 jt", note: "+4,8% bulan ini", icon: CircleDollarSign, color: "text-violet-500" },
        ].map((item) => { const Icon = item.icon; return <section key={item.label} className="rounded-2xl border border-line bg-card p-5 shadow-soft"><div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl bg-secondary ${item.color}`}><Icon className="h-5 w-5" /></span><span className="text-[9px] font-bold text-brand">LIVE DEMO</span></div><p className="mt-5 font-display text-2xl font-extrabold">{item.value}</p><p className="mt-1 text-xs font-bold">{item.label}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.note}</p></section>; })}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <section className="rounded-2xl border border-line bg-card p-5 shadow-soft"><div className="flex items-center justify-between"><div><h2 className="font-display text-base font-extrabold">Aktivitas platform 7 hari</h2><p className="mt-1 text-xs text-muted-foreground">Hari aktif tervalidasi menjadi indikator utama.</p></div><BarChart3 className="h-5 w-5 text-brand" /></div><div className="mt-7 flex h-44 items-end gap-3">{[58, 74, 64, 82, 78, 92, 86].map((value, index) => <div key={value + index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-xl bg-gradient-to-t from-brand to-lime" style={{ height: `${value}%` }} /><span className="text-[9px] text-muted-foreground">{["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"][index]}</span></div>)}</div></section>
        <section className="rounded-2xl border border-line bg-card p-5 shadow-soft"><h2 className="font-display text-base font-extrabold">Perlu perhatian</h2><div className="mt-4 space-y-3">{[{ label: "Laporan konten prioritas", value: "3", color: "bg-rose-500" }, { label: "Aktivitas terindikasi kendaraan", value: "28", color: "bg-amber-500" }, { label: "Reward stok menipis", value: "4", color: "bg-violet-500" }, { label: "Banding menunggu", value: "7", color: "bg-sky-500" }].map((item) => <div key={item.label} className="flex items-center gap-3 rounded-xl bg-secondary/45 p-3"><span className={`h-2.5 w-2.5 rounded-full ${item.color}`} /><p className="min-w-0 flex-1 text-xs font-bold">{item.label}</p><span className="text-xs font-extrabold">{item.value}</span></div>)}</div></section>
      </div>
      <section className="rounded-2xl border border-line bg-card p-5 shadow-soft"><h2 className="font-display text-base font-extrabold">Audit terbaru</h2><div className="mt-4 divide-y divide-line/60">{["Dimas mengubah stok Reward Voucher Gym", "Faishal mempertahankan Moment milik Dinda", "Sistem menandai 28 aktivitas untuk ditinjau", "Event AMIKOM Morning Run dipublikasikan"].map((text, index) => <div key={text} className="flex items-center gap-3 py-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">{index + 1}</span><p className="min-w-0 flex-1 text-xs">{text}</p><span className="text-[9px] text-muted-foreground">{index * 12 + 3} mnt</span></div>)}</div></section>
    </div>
  );
}

type AdminOverviewData = {
  counts: {
    users: number;
    activeUsers: number;
    verifiedActivities: number;
    activitiesPending: number;
    reportsPending: number;
    appealsPending: number;
    activeChallenges: number;
    rewardsLowStock: number;
    hpInCirculation: number;
  };
  activitySeries: Array<{ key: string; label: string; value: number }>;
  recentAudit: Array<{
    id: string;
    action: string;
    entityName: string;
    createdAt: string;
    actorUser: { name: string } | null;
  }>;
};

function Overview() {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/overview", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as
          | ({ success?: boolean; error?: string } & Partial<AdminOverviewData>)
          | null;
        if (!response.ok || !result?.success || !result.counts || !result.activitySeries) {
          throw new Error(result?.error ?? "Ringkasan admin belum dapat dimuat.");
        }
        setData({
          counts: result.counts,
          activitySeries: result.activitySeries,
          recentAudit: result.recentAudit ?? [],
        });
      })
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ringkasan admin belum dapat dimuat.",
        ),
      );
  }, []);

  if (!data) {
    return (
      <section className="rounded-2xl border border-line bg-card p-8 text-center text-xs text-muted-foreground">
        {error ?? "Memuat statistik operasional dari database..."}
      </section>
    );
  }

  const maximum = Math.max(1, ...data.activitySeries.map((point) => point.value));
  const metrics = [
    { label: "Pengguna aktif", value: data.counts.activeUsers.toLocaleString("id-ID"), note: `${data.counts.users.toLocaleString("id-ID")} total akun`, icon: Users, color: "text-emerald-500" },
    { label: "Aktivitas tervalidasi", value: data.counts.verifiedActivities.toLocaleString("id-ID"), note: `${data.counts.activitiesPending} menunggu tinjauan`, icon: Activity, color: "text-sky-500" },
    { label: "Laporan terbuka", value: data.counts.reportsPending.toLocaleString("id-ID"), note: `${data.counts.appealsPending} banding menunggu`, icon: AlertTriangle, color: "text-amber-500" },
    { label: "HP beredar", value: data.counts.hpInCirculation.toLocaleString("id-ID"), note: "saldo ledger saat ini", icon: CircleDollarSign, color: "text-violet-500" },
  ];
  const attention = [
    { label: "Laporan konten menunggu", value: data.counts.reportsPending, color: "bg-rose-500" },
    { label: "Aktivitas perlu ditinjau", value: data.counts.activitiesPending, color: "bg-amber-500" },
    { label: "Reward stok menipis", value: data.counts.rewardsLowStock, color: "bg-violet-500" },
    { label: "Banding menunggu", value: data.counts.appealsPending, color: "bg-sky-500" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <section key={item.label} className="rounded-2xl border border-line bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-xl bg-secondary ${item.color}`}><Icon className="h-5 w-5" /></span>
                <span className="text-[9px] font-bold text-brand">DATABASE</span>
              </div>
              <p className="mt-5 font-display text-2xl font-extrabold">{item.value}</p>
              <p className="mt-1 text-xs font-bold">{item.label}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{item.note}</p>
            </section>
          );
        })}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div><h2 className="font-display text-base font-extrabold">Aktivitas platform 7 hari</h2><p className="mt-1 text-xs text-muted-foreground">Sesi yang lolos verifikasi server per hari.</p></div>
            <BarChart3 className="h-5 w-5 text-brand" />
          </div>
          <div className="mt-7 flex h-44 items-end gap-3">
            {data.activitySeries.map((point) => (
              <div key={point.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[9px] font-bold text-foreground">{point.value}</span>
                <div className="w-full rounded-t-xl bg-gradient-to-t from-brand to-lime" style={{ height: `${Math.max(3, (point.value / maximum) * 100)}%` }} />
                <span className="text-[9px] text-muted-foreground">{point.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
          <h2 className="font-display text-base font-extrabold">Perlu perhatian</h2>
          <div className="mt-4 space-y-3">
            {attention.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl bg-secondary/45 p-3">
                <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <p className="min-w-0 flex-1 text-xs font-bold">{item.label}</p>
                <span className="text-xs font-extrabold">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
        <h2 className="font-display text-base font-extrabold">Audit terbaru</h2>
        <div className="mt-4 divide-y divide-line/60">
          {data.recentAudit.slice(0, 8).map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 py-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-[10px] font-bold text-brand"><ShieldCheck className="h-4 w-4" /></span>
              <p className="min-w-0 flex-1 text-xs">{entry.actorUser?.name ?? "Sistem"} · {entry.action} · {entry.entityName}</p>
              <span className="text-[9px] text-muted-foreground">{new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(new Date(entry.createdAt))}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Moderation() {
  type ReportRow = {
    id: string;
    reason: string;
    status: "PENDING" | "DISMISSED" | "ACTIONED";
    moment: { caption: string | null } | null;
    post: { content: string } | null;
    comment: { content: string } | null;
    reporterUser: { name: string };
  };
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [message, setMessage] = useState("Memuat laporan dari database...");

  useEffect(() => {
    void fetch("/api/admin/reports?limit=100", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; reports?: ReportRow[]; error?: string }
          | null;
        if (!response.ok || !result?.success) {
          throw new Error(result?.error ?? "Laporan gagal dimuat.");
        }
        setReports(result.reports ?? []);
        setMessage("");
      })
      .catch((error: unknown) =>
        setMessage(error instanceof Error ? error.message : "Laporan gagal dimuat."),
      );
  }, []);

  async function update(id: string, status: "DISMISSED" | "ACTIONED") {
    const response = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        reason: status === "ACTIONED"
          ? "Konten diturunkan melalui antrean moderasi."
          : "Laporan ditinjau dan konten dipertahankan.",
      }),
    });
    if (!response.ok) {
      setMessage("Keputusan moderasi gagal disimpan.");
      return;
    }
    setReports((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-card shadow-soft">
      <div className="border-b border-line p-5">
        <h2 className="font-display text-lg font-extrabold">Antrean Moderasi</h2>
        <p className="mt-1 text-xs text-muted-foreground">Laporan dan keputusan moderasi disimpan bersama audit log.</p>
      </div>
      {message && <p className="p-5 text-xs text-muted-foreground">{message}</p>}
      <div className="divide-y divide-line/60">
        {reports.map((report) => {
          const target = report.moment
            ? `Moment · ${report.moment.caption ?? "Tanpa caption"}`
            : report.post
              ? `Post · ${report.post.content}`
              : report.comment
                ? `Komentar · ${report.comment.content}`
                : "Konten";
          const label: ReportStatus =
            report.status === "PENDING"
              ? "Menunggu"
              : report.status === "ACTIONED"
                ? "Diturunkan"
                : "Dipertahankan";
          return (
            <article key={report.id} className="p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span className="rounded-full bg-amber/10 px-2.5 py-1 text-[9px] font-bold text-amber">LAPORAN</span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold">{target}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{report.reporterUser.name} · {report.reason}</p>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
              </div>
              {report.status === "PENDING" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => update(report.id, "DISMISSED")} className="btn btn-outline btn-sm"><Check className="h-3.5 w-3.5" /> Pertahankan</button>
                  <button onClick={() => update(report.id, "ACTIONED")} className="btn bg-rose-600 text-white btn-sm"><X className="h-3.5 w-3.5" /> Turunkan Konten</button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyModeration() {
  const [reports, setReports] = useState([
    { id: "RPT-1042", target: "Moment • Yoga Adyatma", reason: "Foto orang lain tanpa izin", risk: "Tinggi", status: "Menunggu" as ReportStatus },
    { id: "RPT-1041", target: "Caption • Aulia Rahmah", reason: "Bahasa tidak suportif", risk: "Sedang", status: "Menunggu" as ReportStatus },
    { id: "RPT-1038", target: "Aktivitas • Pengguna #891", reason: "Kecepatan menyerupai kendaraan", risk: "Tinggi", status: "Menunggu" as ReportStatus },
  ]);
  function update(id: string, status: ReportStatus) { setReports((current) => current.map((item) => item.id === id ? { ...item, status } : item)); }
  return <section className="rounded-2xl border border-line bg-card shadow-soft"><div className="border-b border-line p-5"><h2 className="font-display text-lg font-extrabold">Antrean Moderasi</h2><p className="mt-1 text-xs text-muted-foreground">Foto, caption, laporan pengguna, dan sinyal anti-cheat.</p></div><div className="divide-y divide-line/60">{reports.map((report) => <article key={report.id} className="p-5"><div className="flex flex-wrap items-start gap-3"><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${report.risk === "Tinggi" ? "bg-rose-500/10 text-rose-500" : "bg-amber/10 text-amber"}`}>{report.risk}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{report.target}</p><p className="mt-1 text-xs text-muted-foreground">{report.id} • {report.reason}</p></div><span className="text-[10px] font-bold text-muted-foreground">{report.status}</span></div>{report.status === "Menunggu" && <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => update(report.id, "Dipertahankan")} className="btn btn-outline btn-sm"><Check className="h-3.5 w-3.5" /> Pertahankan</button><button onClick={() => update(report.id, "Diturunkan")} className="btn bg-rose-600 text-white btn-sm"><X className="h-3.5 w-3.5" /> Turunkan Konten</button></div>}</article>)}</div></section>;
}

function UsersView() {
  type AdminUserRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuspended: boolean;
    updatedAt: string;
    economy: { currentTier: string } | null;
    _count: { activitySessions: number };
  };
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [message, setMessage] = useState("Memuat pengguna dari database...");

  useEffect(() => {
    void fetch("/api/admin/users?limit=250", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; users?: AdminUserRow[]; error?: string }
          | null;
        if (!response.ok || !result?.success) {
          throw new Error(result?.error ?? "Pengguna gagal dimuat.");
        }
        setUsers(result.users ?? []);
        setMessage("");
      })
      .catch((error: unknown) =>
        setMessage(error instanceof Error ? error.message : "Pengguna gagal dimuat."),
      );
  }, []);

  async function toggleSuspension(user: AdminUserRow) {
    const action = user.isSuspended ? "aktifkan kembali" : "nonaktifkan";
    if (!window.confirm(`Yakin ingin ${action} akun ${user.name}?`)) return;
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isSuspended: !user.isSuspended,
        ...(!user.isSuspended
          ? { reason: "Ditinjau melalui Admin Center NutriVerse." }
          : {}),
      }),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setMessage(result?.error ?? "Status akun gagal diperbarui.");
      return;
    }
    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? { ...item, isSuspended: !item.isSuspended }
          : item,
      ),
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
        <div>
          <h2 className="font-display text-lg font-extrabold">Pengguna NutriVerse</h2>
          <p className="mt-1 text-xs text-muted-foreground">Akun, tier, role, dan aktivitas dari database.</p>
        </div>
        <span className="pill bg-brand-soft text-brand">{users.length} akun</span>
      </div>
      {message && <p className="px-5 py-3 text-xs text-muted-foreground">{message}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-secondary/50 text-[9px] uppercase tracking-wider text-muted-foreground">
            <tr>{["Pengguna", "Tier", "Diperbarui", "Aktivitas", "Role", "Status", "Aksi"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {users.map((user) => (
              <tr key={user.id} className="text-xs">
                <td className="px-5 py-4"><p className="font-bold">{user.name}</p><p className="text-[9px] text-muted-foreground">{user.email}</p></td>
                <td className="px-5 py-4">{user.economy?.currentTier ?? "SPROUT"}</td>
                <td className="px-5 py-4 text-muted-foreground">{new Intl.DateTimeFormat("id-ID", { dateStyle: "short" }).format(new Date(user.updatedAt))}</td>
                <td className="px-5 py-4 font-bold text-brand">{user._count.activitySessions}</td>
                <td className="px-5 py-4">{user.role}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${user.isSuspended ? "bg-amber/10 text-amber" : "bg-brand-soft text-brand"}`}>{user.isSuspended ? "Ditinjau" : "Aktif"}</span></td>
                <td className="px-5 py-4"><button onClick={() => toggleSuspension(user)} className="font-bold text-brand">{user.isSuspended ? "Aktifkan" : "Nonaktifkan"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyUsersView() {
  return <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5"><div><h2 className="font-display text-lg font-extrabold">Pengguna NutriVerse</h2><p className="mt-1 text-xs text-muted-foreground">Status akun, tier, dan tingkat kepercayaan aktivitas.</p></div><button className="btn btn-outline btn-sm">Ekspor Ringkasan</button></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead className="bg-secondary/50 text-[9px] uppercase tracking-wider text-muted-foreground"><tr>{["Pengguna", "Tier", "Terakhir aktif", "Trust", "Status", "Aksi"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-line/60">{USER_ROWS.map((user) => <tr key={user.name} className="text-xs"><td className="px-5 py-4 font-bold">{user.name}</td><td className="px-5 py-4">{user.tier}</td><td className="px-5 py-4 text-muted-foreground">{user.active}</td><td className="px-5 py-4 font-bold text-brand">{user.trust}</td><td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${user.status === "Aktif" ? "bg-brand-soft text-brand" : "bg-amber/10 text-amber"}`}>{user.status}</span></td><td className="px-5 py-4"><button className="font-bold text-brand">Tinjau</button></td></tr>)}</tbody></table></div></section>;
}

function Operations({ canManage }: { readonly canManage: boolean }) {
  type EventRow = {
    id: string;
    title: string;
    capacity: number;
    bonusXp: number;
    isActive: boolean;
    description: string;
    startDate: string;
    location: string | null;
    approvalStatus: string;
    reviewNote: string | null;
    whatsappLinkStatus: string;
    createdBy: { name: string; username: string | null } | null;
    _count: { registrations: number };
  };
  type RewardRow = {
    id: string;
    title: string;
    stock: number;
    hpCost: number;
    isActive: boolean;
    _count: { redemptions: number };
  };
  type CommunityRow = {
    id: string;
    name: string;
    description: string | null;
    category: string;
    rules: string[];
    joinPolicy: string;
    approvalStatus: string;
    reviewNote: string | null;
    isActive: boolean;
    leader: { name: string; username: string | null; economy: { currentTier: string } | null } | null;
    _count: { members: number; posts: number };
  };
  const [events, setEvents] = useState<EventRow[]>([]);
  const [communities, setCommunities] = useState<CommunityRow[]>([]);
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [message, setMessage] = useState("Memuat operasional dari database...");

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/events", { cache: "no-store" }),
      fetch("/api/admin/communities", { cache: "no-store" }),
      fetch("/api/admin/rewards?includeInactive=true", { cache: "no-store" }),
    ])
      .then(async ([eventResponse, communityResponse, rewardResponse]) => {
        const eventResult = (await eventResponse.json().catch(() => null)) as
          | { success?: boolean; events?: EventRow[]; error?: string }
          | null;
        const rewardResult = (await rewardResponse.json().catch(() => null)) as
          | { success?: boolean; rewards?: RewardRow[]; error?: string }
          | null;
        const communityResult = (await communityResponse.json().catch(() => null)) as
          | { success?: boolean; communities?: CommunityRow[]; error?: string }
          | null;
        if (!eventResponse.ok || !eventResult?.success) {
          throw new Error(eventResult?.error ?? "Event gagal dimuat.");
        }
        if (!rewardResponse.ok || !rewardResult?.success) {
          throw new Error(rewardResult?.error ?? "Reward gagal dimuat.");
        }
        if (!communityResponse.ok || !communityResult?.success) {
          throw new Error(communityResult?.error ?? "Komunitas gagal dimuat.");
        }
        setEvents(eventResult.events ?? []);
        setCommunities(communityResult.communities ?? []);
        setRewards(rewardResult.rewards ?? []);
        setMessage("");
      })
      .catch((error: unknown) =>
        setMessage(error instanceof Error ? error.message : "Operasional gagal dimuat."),
      );
  }, []);

  async function toggleEvent(event: EventRow) {
    const response = await fetch(`/api/admin/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !event.isActive }),
    });
    if (!response.ok) {
      setMessage("Status event gagal disimpan.");
      return;
    }
    setEvents((current) =>
      current.map((item) =>
        item.id === event.id ? { ...item, isActive: !item.isActive } : item,
      ),
    );
  }

  async function reviewEvent(event: EventRow, action: "approve" | "needs_revision" | "reject") {
    const note = action === "approve" ? "Event dan link komunikasi telah diperiksa." : window.prompt(action === "reject" ? "Alasan penolakan:" : "Catatan revisi:");
    if (action !== "approve" && !note?.trim()) return;
    const response = await fetch(`/api/admin/events/${event.id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    const result = await response.json().catch(() => null) as { success?: boolean; event?: EventRow; error?: string } | null;
    if (!response.ok || !result?.success || !result.event) {
      setMessage(result?.error ?? "Review event gagal disimpan.");
      return;
    }
    setEvents((current) => current.map((item) => item.id === event.id ? { ...item, ...result.event } : item));
    setMessage("Keputusan review tersimpan di database dan audit log.");
  }

  async function reviewCommunity(community: CommunityRow, action: "approve" | "needs_revision" | "reject") {
    const note = action === "approve" ? "Komunitas telah diperiksa dan disetujui." : window.prompt(action === "reject" ? "Alasan penolakan:" : "Catatan revisi:");
    if (action !== "approve" && !note?.trim()) return;
    const response = await fetch(`/api/admin/communities/${community.id}/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, note }) });
    const result = await response.json().catch(() => null) as { success?: boolean; community?: CommunityRow; error?: string } | null;
    if (!response.ok || !result?.success || !result.community) { setMessage(result?.error ?? "Review komunitas gagal disimpan."); return; }
    setCommunities((current) => current.map((item) => item.id === community.id ? { ...item, ...result.community } : item));
    setMessage("Keputusan komunitas tersimpan di database dan audit log.");
  }

  async function toggleReward(reward: RewardRow) {
    const response = await fetch(`/api/admin/rewards/${reward.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isActive: !reward.isActive,
        reason: "Status diubah melalui Admin Center.",
      }),
    });
    if (!response.ok) {
      setMessage("Status reward gagal disimpan.");
      return;
    }
    setRewards((current) =>
      current.map((item) =>
        item.id === reward.id ? { ...item, isActive: !item.isActive } : item,
      ),
    );
  }

  const event = events[0];
  const pendingEvents = events.filter((item) => item.approvalStatus === "PENDING_REVIEW");
  const pendingCommunities = communities.filter((item) => item.approvalStatus === "PENDING_REVIEW");
  const reward = rewards[0];
  return (
    <div className="space-y-4">
      {message && <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">{message}</p>}
      <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-line p-5"><div><p className="text-[9px] font-bold uppercase tracking-wider text-brand">Persetujuan Super Admin</p><h2 className="mt-1 font-display text-lg font-extrabold">Pengajuan Komunitas</h2></div><span className="pill bg-amber/10 text-amber">{pendingCommunities.length} menunggu</span></div>
        <div className="divide-y divide-line/60">{pendingCommunities.length === 0 ? <p className="p-5 text-xs text-muted-foreground">Tidak ada pengajuan komunitas yang menunggu review.</p> : pendingCommunities.map((item) => <article key={item.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-bold">{item.name}</h3><p className="mt-1 text-[10px] text-muted-foreground">{item.category} · Oleh {item.leader?.name ?? "Pengguna"} · Rank {item.leader?.economy?.currentTier ?? "SPROUT"}</p></div><span className="pill bg-secondary text-[9px] font-bold text-muted-foreground">{item.joinPolicy === "OPEN" ? "Terbuka" : "Persetujuan anggota"}</span></div><p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{item.description}</p><p className="mt-2 text-[10px] text-muted-foreground">{item.rules.length} peraturan disertakan.</p><div className="mt-4 flex flex-wrap gap-2"><button disabled={!canManage} onClick={() => void reviewCommunity(item, "approve")} className="btn btn-primary btn-sm"><Check className="h-4 w-4" /> Setujui</button><button disabled={!canManage} onClick={() => void reviewCommunity(item, "needs_revision")} className="btn btn-outline btn-sm">Minta Revisi</button><button disabled={!canManage} onClick={() => void reviewCommunity(item, "reject")} className="btn btn-outline btn-sm text-rose-500">Tolak</button></div></article>)}</div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-line p-5"><div><p className="text-[9px] font-bold uppercase tracking-wider text-brand">Persetujuan Super Admin</p><h2 className="mt-1 font-display text-lg font-extrabold">Pengajuan Event</h2></div><span className="pill bg-amber/10 text-amber">{pendingEvents.length} menunggu</span></div>
        <div className="divide-y divide-line/60">{pendingEvents.length === 0 ? <p className="p-5 text-xs text-muted-foreground">Tidak ada pengajuan yang menunggu review.</p> : pendingEvents.map((item) => <article key={item.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-bold">{item.title}</h3><p className="mt-1 text-[10px] text-muted-foreground">Oleh {item.createdBy?.name ?? "Pengguna"} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.startDate))} · {item.location}</p></div><span className="pill bg-secondary text-[9px] font-bold text-muted-foreground">WhatsApp: {item.whatsappLinkStatus === "PENDING_REVIEW" ? "perlu dicek" : "tidak diajukan"}</span></div><p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{item.description}</p><div className="mt-4 flex flex-wrap gap-2"><button disabled={!canManage} onClick={() => void reviewEvent(item, "approve")} className="btn btn-primary btn-sm"><Check className="h-4 w-4" /> Setujui &amp; Publikasikan</button><button disabled={!canManage} onClick={() => void reviewEvent(item, "needs_revision")} className="btn btn-outline btn-sm">Minta Revisi</button><button disabled={!canManage} onClick={() => void reviewEvent(item, "reject")} className="btn btn-outline btn-sm text-rose-500">Tolak</button></div></article>)}</div>
        {!canManage && <p className="border-t border-line bg-amber/10 px-5 py-3 text-[10px] font-bold text-amber">Moderator dapat memantau. Keputusan publikasi memerlukan Super Admin.</p>}
      </section>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-wider text-brand">Event Database</p><h2 className="mt-1 font-display text-lg font-extrabold">{event?.title ?? "Belum ada event"}</h2></div><CalendarDays className="h-6 w-6 text-brand" /></div>
          {event && <><div className="mt-5 grid grid-cols-3 gap-2">{[["Peserta", event._count.registrations], ["Kapasitas", event.capacity], ["Reward", `${event.bonusXp} XP`]].map(([label, value]) => <div key={label} className="rounded-xl bg-secondary/50 p-3"><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-1 text-xs font-extrabold">{value}</p></div>)}</div><button onClick={() => toggleEvent(event)} className={`btn mt-5 w-full ${event.isActive ? "btn-outline" : "btn-primary"}`}>{event.isActive ? "Jeda Pendaftaran" : "Aktifkan Event"}</button></>}
        </section>
        <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-wider text-violet-500">Reward Database</p><h2 className="mt-1 font-display text-lg font-extrabold">{reward?.title ?? "Belum ada reward"}</h2></div><Gift className="h-6 w-6 text-violet-500" /></div>
          {reward && <><div className="mt-5 grid grid-cols-3 gap-2">{[["Stok", reward.stock], ["Harga", `${reward.hpCost} HP`], ["Ditukar", reward._count.redemptions]].map(([label, value]) => <div key={label} className="rounded-xl bg-secondary/50 p-3"><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-1 text-xs font-extrabold">{value}</p></div>)}</div><button onClick={() => toggleReward(reward)} className={`btn mt-5 w-full ${reward.isActive ? "btn-outline" : "btn-primary"}`}>{reward.isActive ? "Nonaktifkan Reward" : "Aktifkan Reward"}</button></>}
        </section>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyOperations() {
  const [eventActive, setEventActive] = useState(true);
  const [rewardActive, setRewardActive] = useState(true);
  return <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-line bg-card p-5 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-wider text-brand">Event</p><h2 className="mt-1 font-display text-lg font-extrabold">AMIKOM Morning Run 5K</h2></div><CalendarDays className="h-6 w-6 text-brand" /></div><div className="mt-5 grid grid-cols-3 gap-2">{[["Peserta", "412"], ["Kapasitas", "600"], ["Reward", "450 XP"]].map(([label, value]) => <div key={label} className="rounded-xl bg-secondary/50 p-3"><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-1 text-xs font-extrabold">{value}</p></div>)}</div><button onClick={() => setEventActive((value) => !value)} className={`btn mt-5 w-full ${eventActive ? "btn-outline" : "btn-primary"}`}>{eventActive ? "Jeda Pendaftaran" : "Aktifkan Event"}</button></section><section className="rounded-2xl border border-line bg-card p-5 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-wider text-violet-500">Reward</p><h2 className="mt-1 font-display text-lg font-extrabold">Voucher Gym Partner</h2></div><Gift className="h-6 w-6 text-violet-500" /></div><div className="mt-5 grid grid-cols-3 gap-2">{[["Stok", "24"], ["Harga", "1.200 HP"], ["Ditukar", "86"]].map(([label, value]) => <div key={label} className="rounded-xl bg-secondary/50 p-3"><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-1 text-xs font-extrabold">{value}</p></div>)}</div><button onClick={() => setRewardActive((value) => !value)} className={`btn mt-5 w-full ${rewardActive ? "btn-outline" : "btn-primary"}`}>{rewardActive ? "Nonaktifkan Reward" : "Aktifkan Reward"}</button></section></div>;
}

function AdminList({ canManage }: { readonly canManage: boolean }) {
  type AdminRow = {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "MODERATOR";
    isSuspended: boolean;
  };
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [message, setMessage] = useState("Memuat administrator dari database...");
  async function changeRole(admin: AdminRow) {
    const role = admin.role === "ADMIN" ? "MODERATOR" : "ADMIN";
    const response = await fetch(`/api/admin/users/${admin.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
    if (!response.ok || !result?.success) { setMessage(result?.error ?? "Role gagal diubah."); return; }
    setAdmins((current) => current.map((item) => item.id === admin.id ? { ...item, role } : item));
  }

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/users?role=ADMIN", { cache: "no-store" }),
      fetch("/api/admin/users?role=MODERATOR", { cache: "no-store" }),
    ])
      .then(async (responses) => {
        const results = await Promise.all(
          responses.map((response) => response.json().catch(() => null)),
        ) as Array<{ success?: boolean; users?: AdminRow[]; error?: string } | null>;
        if (responses.some((response) => !response.ok) || results.some((result) => !result?.success)) {
          throw new Error(results.find((result) => result?.error)?.error ?? "Daftar admin gagal dimuat.");
        }
        setAdmins(results.flatMap((result) => result?.users ?? []));
        setMessage("");
      })
      .catch((error: unknown) =>
        setMessage(error instanceof Error ? error.message : "Daftar admin gagal dimuat."),
      );
  }, []);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-card shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
          <div><h2 className="font-display text-lg font-extrabold">Daftar Admin</h2><p className="mt-1 text-xs text-muted-foreground">Role ADMIN dan MODERATOR dibaca dari database.</p></div>
          <span className="pill bg-brand-soft text-brand">{admins.length} akun</span>
        </div>
        {message && <p className="p-5 text-xs text-muted-foreground">{message}</p>}
        <div className="divide-y divide-line/60">
          {admins.map((admin) => (
            <div key={admin.id} className="flex flex-wrap items-center gap-3 p-5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-xs font-extrabold text-brand">{admin.name.split(" ").map((part) => part[0]).slice(0,2).join("")}</span>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold">{admin.name}</p><p className="truncate text-[10px] text-muted-foreground">{admin.email}</p></div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[9px] font-bold">{admin.role}</span>
              <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${admin.isSuspended ? "bg-amber/10 text-amber" : "bg-brand-soft text-brand"}`}>{admin.isSuspended ? "Nonaktif" : "Aktif"}</span>
              {canManage && <button type="button" onClick={() => void changeRole(admin)} className="btn btn-outline btn-sm">Jadikan {admin.role === "ADMIN" ? "Moderator" : "Super Admin"}</button>}
            </div>
          ))}
        </div>
      </section>
      {!canManage && <div className="rounded-2xl border border-amber/20 bg-amber/10 p-4 text-xs text-amber">Perubahan role hanya dapat dilakukan oleh Super Admin.</div>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyAdminList({ canManage }: { readonly canManage: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("Moderator");
  const [admins, setAdmins] = useState<{ name: string; email: string; role: AdminRole; status: string }[]>([
    { name: "Dimas Rofiq", email: "admin@nutriverse.id", role: "Super Admin", status: "Aktif" },
    { name: "Faishal", email: "moderator@nutriverse.id", role: "Moderator", status: "Aktif" },
    { name: "Ilham Ramadhan", email: "event@nutriverse.id", role: "Event Manager", status: "Aktif" },
    { name: "Fatan Mubarak", email: "analyst@nutriverse.id", role: "Analyst", status: "Diundang" },
  ]);
  function invite(event: React.FormEvent) { event.preventDefault(); if (!name.trim() || !email.includes("@")) return; setAdmins((current) => [...current, { name: name.trim(), email: email.trim(), role, status: "Diundang" }]); setName(""); setEmail(""); setShowForm(false); }
  return <div className="space-y-5"><section className="rounded-2xl border border-line bg-card shadow-soft"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5"><div><h2 className="font-display text-lg font-extrabold">Daftar Admin</h2><p className="mt-1 text-xs text-muted-foreground">Akses berdasarkan tugas, bukan satu akun bersama.</p></div><button onClick={() => setShowForm((value) => !value)} disabled={!canManage} className="btn btn-primary btn-sm"><UserCog className="h-4 w-4" /> Tambah Admin</button></div>{showForm && <form onSubmit={invite} className="grid gap-3 border-b border-line bg-secondary/25 p-5 sm:grid-cols-3"><input value={name} onChange={(event) => setName(event.target.value)} className="input" placeholder="Nama admin" required /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input" placeholder="email@nutriverse.id" required /><select value={role} onChange={(event) => setRole(event.target.value as AdminRole)} className="input"><option>Moderator</option><option>Event Manager</option><option>Reward Manager</option><option>Analyst</option></select><button className="btn btn-primary sm:col-span-3">Kirim Undangan Demo</button></form>}<div className="divide-y divide-line/60">{admins.map((admin) => <div key={admin.email} className="flex flex-wrap items-center gap-3 p-5"><span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-xs font-extrabold text-brand">{admin.name.split(" ").map((part) => part[0]).slice(0,2).join("")}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{admin.name}</p><p className="truncate text-[10px] text-muted-foreground">{admin.email}</p></div><span className="rounded-full bg-secondary px-2.5 py-1 text-[9px] font-bold">{admin.role}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${admin.status === "Aktif" ? "bg-brand-soft text-brand" : "bg-amber/10 text-amber"}`}>{admin.status}</span></div>)}</div></section><div className="rounded-2xl border border-amber/20 bg-amber/10 p-4 text-xs text-amber"><span className="font-bold">Kebijakan:</span> akun admin tidak dapat dibuat dari halaman register user. Hanya Super Admin yang dapat mengundang dan mengubah role.</div></div>;
}

function SystemSettings({ canManage }: { readonly canManage: boolean }) {
  const [settings, setSettings] = useState({
    dailyXpCapEnabled: true,
    gpsIntegrityEnabled: true,
    automaticMomentReviewEnabled: true,
  });
  const [message, setMessage] = useState("Memuat pengaturan sistem...");

  useEffect(() => {
    void fetch("/api/admin/settings", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; settings?: typeof settings; error?: string }
          | null;
        if (!response.ok || !result?.success || !result.settings) {
          throw new Error(result?.error ?? "Pengaturan gagal dimuat.");
        }
        setSettings(result.settings);
        setMessage("");
      })
      .catch((error: unknown) =>
        setMessage(error instanceof Error ? error.message : "Pengaturan gagal dimuat."),
      );
  }, []);

  async function toggle(key: keyof typeof settings) {
    if (!canManage) return;
    const next = !settings[key];
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next }),
    });
    if (!response.ok) {
      setMessage("Pengaturan gagal disimpan.");
      return;
    }
    setSettings((current) => ({ ...current, [key]: next }));
    setMessage("Perubahan tersimpan di database dan audit log.");
  }

  const rows = [
    { key: "dailyXpCapEnabled" as const, label: "Batas XP harian & diminishing return", note: "Mencegah latihan berlebihan dan grinding." },
    { key: "gpsIntegrityEnabled" as const, label: "Deteksi GPS palsu dan pola kendaraan", note: "Menahan XP sampai aktivitas selesai ditinjau." },
    { key: "automaticMomentReviewEnabled" as const, label: "Moderasi otomatis NutriVerse Moments", note: "Menandai risiko visual/caption sebelum tampil publik." },
  ];
  return (
    <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
      <h2 className="font-display text-lg font-extrabold">Pengaturan Global</h2>
      <p className="mt-1 text-xs text-muted-foreground">Nilai tersimpan di tabel system_settings dan setiap perubahan diaudit.</p>
      {message && <p className="mt-3 text-[10px] text-muted-foreground">{message}</p>}
      <div className="mt-5 space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-4 rounded-xl border border-line p-4">
            <div className="min-w-0 flex-1"><p className="text-sm font-bold">{row.label}</p><p className="mt-1 text-[10px] text-muted-foreground">{row.note}</p></div>
            <button disabled={!canManage} onClick={() => toggle(row.key)} className={`relative h-7 w-12 rounded-full transition ${settings[row.key] ? "bg-brand" : "bg-secondary"}`} aria-pressed={settings[row.key]}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${settings[row.key] ? "left-6" : "left-1"}`} /></button>
          </div>
        ))}
      </div>
      {!canManage && <p className="mt-4 rounded-xl bg-amber/10 p-3 text-[10px] font-bold text-amber">Role Anda hanya dapat melihat pengaturan. Perubahan memerlukan Super Admin.</p>}
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacySystemSettings({ canManage }: { readonly canManage: boolean }) {
  const [dailyCap, setDailyCap] = useState(true);
  const [fakeGps, setFakeGps] = useState(true);
  const [momentReview, setMomentReview] = useState(true);
  return <section className="rounded-2xl border border-line bg-card p-5 shadow-soft"><h2 className="font-display text-lg font-extrabold">Pengaturan Global</h2><p className="mt-1 text-xs text-muted-foreground">Perubahan produksi nantinya membutuhkan konfirmasi dan audit log.</p><div className="mt-5 space-y-3">{[{ label: "Batas XP harian & diminishing return", note: "Mencegah latihan berlebihan dan grinding.", value: dailyCap, set: setDailyCap }, { label: "Deteksi GPS palsu dan pola kendaraan", note: "Menahan XP sampai aktivitas selesai ditinjau.", value: fakeGps, set: setFakeGps }, { label: "Moderasi otomatis NutriVerse Moments", note: "Menandai risiko visual/caption sebelum tampil publik.", value: momentReview, set: setMomentReview }].map((setting) => <div key={setting.label} className="flex items-center gap-4 rounded-xl border border-line p-4"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{setting.label}</p><p className="mt-1 text-[10px] text-muted-foreground">{setting.note}</p></div><button disabled={!canManage} onClick={() => setting.set(!setting.value)} className={`relative h-7 w-12 rounded-full transition ${setting.value ? "bg-brand" : "bg-secondary"}`} aria-pressed={setting.value}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${setting.value ? "left-6" : "left-1"}`} /></button></div>)}</div>{!canManage && <p className="mt-4 rounded-xl bg-amber/10 p-3 text-[10px] font-bold text-amber">Role Anda hanya dapat melihat pengaturan. Perubahan memerlukan Super Admin.</p>}</section>;
}

function AdminSidebar({ view, session, onSelect, onLogout }: { readonly view: AdminView; readonly session: AdminSession; readonly onSelect: (view: AdminView) => void; readonly onLogout: () => void }) {
  return <div className="flex h-full flex-col bg-[#07120d] p-4 text-white"><div className="px-2 py-2"><BrandLogo className="[&>span]:text-white" /><span className="mt-3 inline-flex rounded-full bg-emerald-400/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-emerald-300">Admin Center</span></div><nav className="mt-6 flex-1 space-y-1">{NAV_ITEMS.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => onSelect(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${view === item.id ? "bg-emerald-400 text-[#04140d]" : "text-white/60 hover:bg-white/5 hover:text-white"}`}><Icon className="h-[18px] w-[18px]" /><span className="flex-1">{item.label}</span>{item.badge && <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[8px] text-white">{item.badge}</span>}</button>; })}<a href="/admin/cms" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/60 transition hover:bg-white/5 hover:text-white"><Newspaper className="h-[18px] w-[18px]" /><span>CMS Content</span></a></nav><div className="border-t border-white/10 pt-4"><div className="px-3"><p className="truncate text-xs font-bold">{session.name}</p><p className="mt-0.5 text-[9px] text-emerald-300">{session.role}</p></div><button onClick={onLogout} className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/60 hover:bg-rose-500/10 hover:text-rose-300"><LogOut className="h-4 w-4" /> Keluar Admin</button></div></div>;
}

export function AdminPortal({ serverSession: session }: { readonly serverSession: AdminSession }) {
  const [view, setView] = useState<AdminView>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = useMemo(() => NAV_ITEMS.find((item) => item.id === view)?.label ?? "Admin", [view]);
  const canManage = session.role === "Super Admin";
  async function logout() {
    if (!window.confirm("Yakin ingin keluar dari sesi administrator?")) return;
    const response = await fetch("/api/auth/sign-out", { method: "POST" }).catch(
      () => null,
    );
    if (response && !response.ok) {
      window.alert("Sesi administrator belum dapat diakhiri.");
      return;
    }
    clearAdminSession();
    window.location.assign("/");
  }
  const content = view === "overview" ? <Overview /> : view === "moderation" ? <Moderation /> : view === "users" ? <UsersView /> : view === "operations" ? <Operations canManage={canManage} /> : view === "templates" ? <ShareTemplateAdmin canPublish={canManage} /> : view === "admins" ? <AdminList canManage={canManage} /> : view === "events" ? <AdminEventPanel embedded /> : <SystemSettings canManage={canManage} />;
  const selectView = (nextView: AdminView) => { setView(nextView); setMobileOpen(false); };
  return <div className="min-h-screen bg-background text-foreground"><aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block"><AdminSidebar view={view} session={session} onSelect={selectView} onLogout={logout} /></aside>{mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/55" aria-label="Tutup menu admin" /><aside className="absolute inset-y-0 left-0 w-[84vw] max-w-72"><button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white" aria-label="Tutup menu"><X className="h-4 w-4" /></button><AdminSidebar view={view} session={session} onSelect={selectView} onLogout={logout} /></aside></div>}<div className="lg:pl-64"><header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-background/90 px-4 backdrop-blur-xl sm:px-6"><button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary lg:hidden" aria-label="Buka menu admin"><Menu className="h-5 w-5" /></button><div className="min-w-0 flex-1"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand">NutriVerse Control</p><h1 className="truncate font-display text-base font-extrabold">{pageTitle}</h1></div><button className="relative grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Notifikasi admin"><Bell className="h-4 w-4" /></button><span className="hidden rounded-full bg-brand-soft px-3 py-1.5 text-[9px] font-bold text-brand sm:inline">{session.role}</span></header><main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl font-extrabold">{pageTitle}</h2><p className="mt-1 text-xs text-muted-foreground">Data operasional dimuat melalui API administrator dan database.</p></div><span className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-[9px] font-bold text-brand"><ShieldCheck className="h-3.5 w-3.5" /> Sesi Supabase berbasis role</span></div>{content}</main></div></div>;
}




