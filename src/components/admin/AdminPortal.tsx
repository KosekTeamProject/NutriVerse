"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Bell, CalendarDays, Check, ChevronRight, CircleDollarSign, FileWarning, Gift, LayoutDashboard, LockKeyhole, LogOut, Menu, Settings, ShieldCheck, Sparkles, Trophy, UserCog, Users, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { authenticateDemoAdmin, clearAdminSession, saveAdminSession, type AdminRole, type AdminSession } from "@/features/admin/session";
import { useAdminSession } from "@/hooks/useAdminSession";

type AdminView = "overview" | "moderation" | "users" | "operations" | "admins" | "settings";
type ReportStatus = "Menunggu" | "Dipertahankan" | "Diturunkan";

const NAV_ITEMS = [
  { id: "overview" as const, label: "Ringkasan", icon: LayoutDashboard },
  { id: "moderation" as const, label: "Moderasi", icon: FileWarning, badge: 12 },
  { id: "users" as const, label: "Pengguna", icon: Users },
  { id: "operations" as const, label: "Operasional", icon: Trophy },
  { id: "admins" as const, label: "Daftar Admin", icon: UserCog },
  { id: "settings" as const, label: "Pengaturan Sistem", icon: Settings },
];

const USER_ROWS = [
  { name: "Fathan Mubarak", tier: "Radiant", active: "2 menit lalu", trust: "98%", status: "Aktif" },
  { name: "Dinda Puspita", tier: "Vital", active: "12 menit lalu", trust: "96%", status: "Aktif" },
  { name: "Yoga Adyatma", tier: "Bloom", active: "1 jam lalu", trust: "94%", status: "Aktif" },
  { name: "Aulia Rahmah", tier: "Seedling", active: "Kemarin", trust: "71%", status: "Ditinjau" },
];

function LoginScreen() {
  const [email, setEmail] = useState("admin@nutriverse.id");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  function login(event: React.FormEvent) {
    event.preventDefault();
    const session = authenticateDemoAdmin(email, password);
    if (!session) { setError("Email atau kata sandi admin tidak cocok."); return; }
    saveAdminSession(session);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#07120d] p-4 text-white">
      <div aria-hidden className="fixed inset-0 opacity-30 [background-image:radial-gradient(circle_at_25%_20%,#10b981_0,transparent_30%),radial-gradient(circle_at_80%_80%,#65a30d_0,transparent_28%)]" />
      <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#101b15]/95 p-6 shadow-2xl backdrop-blur sm:p-8">
        <BrandLogo className="[&>span]:text-white" />
        <span className="mt-7 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-300">Portal Internal</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold">Masuk ke Admin Center</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">Akses terpisah untuk pengelolaan, moderasi, dan operasional NutriVerse.</p>
        <form onSubmit={login} className="mt-7 space-y-4">
          <div><label htmlFor="admin-email" className="mb-1.5 block text-xs font-bold text-white/70">Email admin</label><input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" autoComplete="username" required /></div>
          <div><label htmlFor="admin-password" className="mb-1.5 block text-xs font-bold text-white/70">Kata sandi</label><input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-emerald-400" autoComplete="current-password" required /></div>
          {error && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-300">{error}</p>}
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-[#04140d] transition hover:bg-emerald-400"><LockKeyhole className="h-4 w-4" /> Masuk sebagai Admin</button>
        </form>
        <div className="mt-5 rounded-2xl bg-white/5 p-4 text-[10px] leading-relaxed text-white/55"><p className="font-bold text-white/80">Akun presentasi</p><p className="mt-1">Super Admin: admin@nutriverse.id / admin123</p><p>Moderator: moderator@nutriverse.id / mod12345</p></div>
        <p className="mt-4 text-center text-[9px] text-white/40">Demo frontend. Produksi wajib memakai autentikasi server, MFA, RBAC, dan audit log permanen.</p>
      </section>
    </main>
  );
}

function Overview() {
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

function Moderation() {
  const [reports, setReports] = useState([
    { id: "RPT-1042", target: "Moment • Yoga Adyatma", reason: "Foto orang lain tanpa izin", risk: "Tinggi", status: "Menunggu" as ReportStatus },
    { id: "RPT-1041", target: "Caption • Aulia Rahmah", reason: "Bahasa tidak suportif", risk: "Sedang", status: "Menunggu" as ReportStatus },
    { id: "RPT-1038", target: "Aktivitas • Pengguna #891", reason: "Kecepatan menyerupai kendaraan", risk: "Tinggi", status: "Menunggu" as ReportStatus },
  ]);
  function update(id: string, status: ReportStatus) { setReports((current) => current.map((item) => item.id === id ? { ...item, status } : item)); }
  return <section className="rounded-2xl border border-line bg-card shadow-soft"><div className="border-b border-line p-5"><h2 className="font-display text-lg font-extrabold">Antrean Moderasi</h2><p className="mt-1 text-xs text-muted-foreground">Foto, caption, laporan pengguna, dan sinyal anti-cheat.</p></div><div className="divide-y divide-line/60">{reports.map((report) => <article key={report.id} className="p-5"><div className="flex flex-wrap items-start gap-3"><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${report.risk === "Tinggi" ? "bg-rose-500/10 text-rose-500" : "bg-amber/10 text-amber"}`}>{report.risk}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{report.target}</p><p className="mt-1 text-xs text-muted-foreground">{report.id} • {report.reason}</p></div><span className="text-[10px] font-bold text-muted-foreground">{report.status}</span></div>{report.status === "Menunggu" && <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => update(report.id, "Dipertahankan")} className="btn btn-outline btn-sm"><Check className="h-3.5 w-3.5" /> Pertahankan</button><button onClick={() => update(report.id, "Diturunkan")} className="btn bg-rose-600 text-white btn-sm"><X className="h-3.5 w-3.5" /> Turunkan Konten</button></div>}</article>)}</div></section>;
}

function UsersView() {
  return <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5"><div><h2 className="font-display text-lg font-extrabold">Pengguna NutriVerse</h2><p className="mt-1 text-xs text-muted-foreground">Status akun, tier, dan tingkat kepercayaan aktivitas.</p></div><button className="btn btn-outline btn-sm">Ekspor Ringkasan</button></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead className="bg-secondary/50 text-[9px] uppercase tracking-wider text-muted-foreground"><tr>{["Pengguna", "Tier", "Terakhir aktif", "Trust", "Status", "Aksi"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-line/60">{USER_ROWS.map((user) => <tr key={user.name} className="text-xs"><td className="px-5 py-4 font-bold">{user.name}</td><td className="px-5 py-4">{user.tier}</td><td className="px-5 py-4 text-muted-foreground">{user.active}</td><td className="px-5 py-4 font-bold text-brand">{user.trust}</td><td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${user.status === "Aktif" ? "bg-brand-soft text-brand" : "bg-amber/10 text-amber"}`}>{user.status}</span></td><td className="px-5 py-4"><button className="font-bold text-brand">Tinjau</button></td></tr>)}</tbody></table></div></section>;
}

function Operations() {
  const [eventActive, setEventActive] = useState(true);
  const [rewardActive, setRewardActive] = useState(true);
  return <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-line bg-card p-5 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-wider text-brand">Event</p><h2 className="mt-1 font-display text-lg font-extrabold">AMIKOM Morning Run 5K</h2></div><CalendarDays className="h-6 w-6 text-brand" /></div><div className="mt-5 grid grid-cols-3 gap-2">{[["Peserta", "412"], ["Kapasitas", "600"], ["Reward", "450 XP"]].map(([label, value]) => <div key={label} className="rounded-xl bg-secondary/50 p-3"><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-1 text-xs font-extrabold">{value}</p></div>)}</div><button onClick={() => setEventActive((value) => !value)} className={`btn mt-5 w-full ${eventActive ? "btn-outline" : "btn-primary"}`}>{eventActive ? "Jeda Pendaftaran" : "Aktifkan Event"}</button></section><section className="rounded-2xl border border-line bg-card p-5 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-wider text-violet-500">Reward</p><h2 className="mt-1 font-display text-lg font-extrabold">Voucher Gym Partner</h2></div><Gift className="h-6 w-6 text-violet-500" /></div><div className="mt-5 grid grid-cols-3 gap-2">{[["Stok", "24"], ["Harga", "1.200 HP"], ["Ditukar", "86"]].map(([label, value]) => <div key={label} className="rounded-xl bg-secondary/50 p-3"><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-1 text-xs font-extrabold">{value}</p></div>)}</div><button onClick={() => setRewardActive((value) => !value)} className={`btn mt-5 w-full ${rewardActive ? "btn-outline" : "btn-primary"}`}>{rewardActive ? "Nonaktifkan Reward" : "Aktifkan Reward"}</button></section></div>;
}

function AdminList({ canManage }: { readonly canManage: boolean }) {
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
  const [dailyCap, setDailyCap] = useState(true);
  const [fakeGps, setFakeGps] = useState(true);
  const [momentReview, setMomentReview] = useState(true);
  return <section className="rounded-2xl border border-line bg-card p-5 shadow-soft"><h2 className="font-display text-lg font-extrabold">Pengaturan Global</h2><p className="mt-1 text-xs text-muted-foreground">Perubahan produksi nantinya membutuhkan konfirmasi dan audit log.</p><div className="mt-5 space-y-3">{[{ label: "Batas XP harian & diminishing return", note: "Mencegah latihan berlebihan dan grinding.", value: dailyCap, set: setDailyCap }, { label: "Deteksi GPS palsu dan pola kendaraan", note: "Menahan XP sampai aktivitas selesai ditinjau.", value: fakeGps, set: setFakeGps }, { label: "Moderasi otomatis NutriVerse Moments", note: "Menandai risiko visual/caption sebelum tampil publik.", value: momentReview, set: setMomentReview }].map((setting) => <div key={setting.label} className="flex items-center gap-4 rounded-xl border border-line p-4"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{setting.label}</p><p className="mt-1 text-[10px] text-muted-foreground">{setting.note}</p></div><button disabled={!canManage} onClick={() => setting.set(!setting.value)} className={`relative h-7 w-12 rounded-full transition ${setting.value ? "bg-brand" : "bg-secondary"}`} aria-pressed={setting.value}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${setting.value ? "left-6" : "left-1"}`} /></button></div>)}</div>{!canManage && <p className="mt-4 rounded-xl bg-amber/10 p-3 text-[10px] font-bold text-amber">Role Anda hanya dapat melihat pengaturan. Perubahan memerlukan Super Admin.</p>}</section>;
}

function AdminSidebar({ view, session, onSelect, onLogout }: { readonly view: AdminView; readonly session: AdminSession; readonly onSelect: (view: AdminView) => void; readonly onLogout: () => void }) {
  return <div className="flex h-full flex-col bg-[#07120d] p-4 text-white"><div className="px-2 py-2"><BrandLogo className="[&>span]:text-white" /><span className="mt-3 inline-flex rounded-full bg-emerald-400/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-emerald-300">Admin Center</span></div><nav className="mt-6 flex-1 space-y-1">{NAV_ITEMS.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => onSelect(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${view === item.id ? "bg-emerald-400 text-[#04140d]" : "text-white/60 hover:bg-white/5 hover:text-white"}`}><Icon className="h-[18px] w-[18px]" /><span className="flex-1">{item.label}</span>{item.badge && <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[8px] text-white">{item.badge}</span>}</button>; })}</nav><div className="border-t border-white/10 pt-4"><div className="px-3"><p className="truncate text-xs font-bold">{session.name}</p><p className="mt-0.5 text-[9px] text-emerald-300">{session.role}</p></div><button onClick={onLogout} className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/60 hover:bg-rose-500/10 hover:text-rose-300"><LogOut className="h-4 w-4" /> Keluar Admin</button></div></div>;
}

export function AdminPortal() {
  const session = useAdminSession();
  const [view, setView] = useState<AdminView>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = useMemo(() => NAV_ITEMS.find((item) => item.id === view)?.label ?? "Admin", [view]);
  if (!session) return <LoginScreen />;
  const canManage = session.role === "Super Admin";
  function logout() { clearAdminSession(); }
  const content = view === "overview" ? <Overview /> : view === "moderation" ? <Moderation /> : view === "users" ? <UsersView /> : view === "operations" ? <Operations /> : view === "admins" ? <AdminList canManage={canManage} /> : <SystemSettings canManage={canManage} />;
  const selectView = (nextView: AdminView) => { setView(nextView); setMobileOpen(false); };
  return <div className="min-h-screen bg-background text-foreground"><aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block"><AdminSidebar view={view} session={session} onSelect={selectView} onLogout={logout} /></aside>{mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/55" aria-label="Tutup menu admin" /><aside className="absolute inset-y-0 left-0 w-[84vw] max-w-72"><button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white" aria-label="Tutup menu"><X className="h-4 w-4" /></button><AdminSidebar view={view} session={session} onSelect={selectView} onLogout={logout} /></aside></div>}<div className="lg:pl-64"><header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-background/90 px-4 backdrop-blur-xl sm:px-6"><button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary lg:hidden" aria-label="Buka menu admin"><Menu className="h-5 w-5" /></button><div className="min-w-0 flex-1"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand">NutriVerse Control</p><h1 className="truncate font-display text-base font-extrabold">{pageTitle}</h1></div><button className="relative grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Notifikasi admin"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" /></button><span className="hidden rounded-full bg-brand-soft px-3 py-1.5 text-[9px] font-bold text-brand sm:inline">{session.role}</span></header><main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl font-extrabold">{pageTitle}</h2><p className="mt-1 text-xs text-muted-foreground">Data demo operasional NutriVerse • terakhir diperbarui baru saja</p></div><span className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-[9px] font-bold text-brand"><ShieldCheck className="h-3.5 w-3.5" /> Sesi admin terpisah</span></div>{content}<div className="mt-6 flex items-start gap-2 rounded-xl border border-line bg-secondary/40 p-4 text-[10px] text-muted-foreground"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><p>Seluruh aksi dashboard ini masih simulasi frontend untuk presentasi. Produksi memerlukan database, API server, middleware role, MFA, dan audit log yang tidak dapat diubah dari browser.</p><ChevronRight className="ml-auto h-4 w-4 shrink-0" /></div></main></div></div>;
}
