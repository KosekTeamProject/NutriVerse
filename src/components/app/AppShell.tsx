"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, CalendarCheck, Flame, Gift, Heart, Home, LayoutDashboard, LogIn, LogOut, Menu, Moon, ScanLine, Settings, Sparkles, Sun, Trophy, UserRound, UsersRound, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuthSession } from "@/hooks/useAuthSession";
import { clearAuthSession } from "@/features/auth/session";
import { WellbeingReminder } from "@/components/app/WellbeingReminder";
import { GlobalSearch } from "@/components/app/GlobalSearch";
import { BrandLogo } from "@/components/brand/BrandLogo";

const NAV_GROUPS = [
  { label: "Utama", items: [
    { href: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
    { href: "/todays-journey", label: "Hari Ini", icon: CalendarCheck },
    { href: "/health-pulse", label: "Health Pulse", icon: Heart },
    { href: "/companion", label: "AI Companion", icon: Sparkles, companion: true },
  ] },
  { label: "Aktivitas", items: [
    { href: "/scan", label: "Pindai Makanan", icon: ScanLine },
    { href: "/aktivitas", label: "Aktivitas GPS", icon: Activity },
  ] },
  { label: "Komunitas", items: [
    { href: "/challenge", label: "Tantangan", icon: Trophy },
    { href: "/komunitas", label: "Komunitas & Peringkat", icon: UsersRound },
    { href: "/reward", label: "Hadiah", icon: Gift },
  ] },
];

const MOBILE_NAV = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/scan", label: "Makanan", icon: ScanLine },
  { href: "/aktivitas", label: "Aktivitas", icon: Activity },
  { href: "/komunitas", label: "Komunitas", icon: UsersRound },
  { href: "/profil", label: "Profil", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({ pathname, companionName, onNavigate, onLogout }: { readonly pathname: string; readonly companionName: string; readonly onNavigate?: () => void; readonly onLogout: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <Link href="/" className="flex items-center px-2 transition hover:opacity-90" onClick={onNavigate}><BrandLogo /></Link>

      <nav className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-0.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground/70">{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const label = item.companion ? companionName : item.label;
              return <Link key={item.href} href={item.href} onClick={onNavigate} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive(pathname, item.href) ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><Icon className="h-[18px] w-[18px]" />{label}</Link>;
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-line/50 pt-3">
        <Link href="/pengaturan" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"><Settings className="h-[18px] w-[18px]" /> Pengaturan</Link>
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"><LogOut className="h-[18px] w-[18px]" /> Keluar</button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { dark, toggleTheme } = useTheme();

  if (pathname === "/onboarding") return children;

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-4 text-foreground">
        <section className="card card-pad w-full max-w-md text-center sm:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><LogIn className="h-7 w-7" /></span>
          <h1 className="mt-5 font-display text-2xl font-extrabold">Masuk untuk membuka ruang personal</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Data Health Pulse, aktivitas, jurnal, dan peringkat hanya muncul setelah pengguna masuk.</p>
          <Link href="/" className="btn btn-primary mt-6 w-full">Kembali ke halaman utama</Link>
        </section>
      </div>
    );
  }

  const initials = session.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  function logout() {
    clearAuthSession();
    setProfileOpen(false);
    setMobileOpen(false);
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <WellbeingReminder />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-sidebar lg:block"><SidebarContent pathname={pathname} companionName={session.companionName} onLogout={logout} /></aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Tutup menu" />
          <aside className="absolute inset-y-0 left-0 w-[85vw] max-w-72 border-r border-line bg-sidebar pb-[env(safe-area-inset-bottom)]">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Tutup menu"><X className="h-5 w-5" /></button>
            <SidebarContent pathname={pathname} companionName={session.companionName} onNavigate={() => setMobileOpen(false)} onLogout={logout} />
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:pl-64">
        <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-background/90 shadow-sm backdrop-blur-xl lg:sticky lg:inset-x-auto lg:shadow-none">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary lg:hidden" aria-label="Buka menu"><Menu className="h-5 w-5" /></button>
            <GlobalSearch companionName={session.companionName} />
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <span className="pill hidden bg-amber/15 text-amber md:inline-flex" aria-label="Saldo 12450 XP Demo"><Flame className="h-3.5 w-3.5" /> 12.450 XP</span>
              <span className="pill hidden bg-brand-soft text-brand md:inline-flex" aria-label="Saldo 3280 HP Demo">3.280 HP</span>
              <button onClick={toggleTheme} className="hidden h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary sm:grid" aria-label="Ganti tema">{dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</button>
              <button className="relative hidden h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary min-[430px]:grid" aria-label="Notifikasi"><Bell className="h-[18px] w-[18px]" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" /></button>
              <div className="relative">
                <button onClick={() => setProfileOpen((value) => !value)} className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-sm font-bold text-white ring-2 ring-card transition hover:opacity-90" aria-label={`Menu profil ${session.name}`} aria-expanded={profileOpen}>{initials}</button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-card p-2 shadow-2xl">
                    <div className="border-b border-line/50 px-3 py-3"><p className="truncate text-sm font-bold text-foreground">{session.name}</p><p className="truncate text-xs text-muted-foreground">{session.email}</p><span className="mt-2 inline-flex rounded-full bg-brand-soft px-2 py-1 text-[9px] font-bold text-brand">AKUN AKTIF</span></div>
                    <Link href="/profil" onClick={() => setProfileOpen(false)} className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-secondary"><UserRound className="h-4 w-4" /> Lihat profil</Link>
                    <Link href="/pengaturan" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-secondary"><Settings className="h-4 w-4" /> Pengaturan akun</Link>
                    <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /> Keluar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-24 sm:px-6 sm:pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:pt-24 lg:px-8 lg:py-8">{children}</main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-2xl border border-line bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden" aria-label="Navigasi utama mobile">
        {MOBILE_NAV.map((item) => { const Icon = item.icon; const active = isActive(pathname, item.href); return <Link key={item.href} href={item.href} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold transition ${active ? "bg-brand-soft text-brand" : "text-muted-foreground"}`}><Icon className="h-[18px] w-[18px]" /><span className="truncate">{item.label}</span></Link>; })}
      </nav>
    </div>
  );
}
