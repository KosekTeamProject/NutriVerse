"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, CalendarCheck, Flame, Gift, Heart, Home, LayoutDashboard, LogIn, LogOut, Menu, Moon, ScanLine, Settings, Sparkles, Sun, Trophy, UserRound, UsersRound, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuthSession } from "@/hooks/useAuthSession";
import { clearAuthSession, readAuthSession, saveAuthSession } from "@/features/auth/session";
import { WellbeingReminder } from "@/components/app/WellbeingReminder";
import { GlobalSearch } from "@/components/app/GlobalSearch";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Footer } from "@/components/app/Footer";

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

const HEADER_NOTIFICATIONS = [
  { id: "daily-goals", title: "Goals harianmu siap", detail: "3 misi sehat sudah dipilih untuk hari ini.", time: "Baru saja", href: "/todays-journey" },
  { id: "streak", title: "Streak mencapai 7 hari", detail: "Pertahankan konsistensi dengan aktivitas ringan hari ini.", time: "1 jam lalu", href: "/aktivitas" },
  { id: "reward", title: "Saldo HP bisa ditukar", detail: "Kamu memiliki 3.280 HP di Toko Hadiah.", time: "Kemarin", href: "/reward" },
] as const;

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
        <Link href="/bantuan" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"><Sparkles className="h-[18px] w-[18px]" /> Pusat Bantuan</Link>
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { dark, toggleTheme } = useTheme();

  const isPublicPage = pathname === "/onboarding" || pathname.startsWith("/bantuan");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as {
          success?: boolean;
          user?: {
            name: string;
            email: string;
            avatarUrl?: string | null;
          };
        } | null;

        if (cancelled) return;
        const current = readAuthSession();
        if (response.ok && result?.success && result.user) {
          saveAuthSession({
            ...current,
            name: result.user.name,
            email: result.user.email,
            username: result.user.email.split("@")[0] || "nutriverse-user",
            companionName: current?.companionName || "Nora",
            avatarUrl: result.user.avatarUrl || current?.avatarUrl,
            provider: "google",
            createdAt: current?.createdAt || new Date().toISOString(),
            lastLoginTimestamp: Date.now(),
          });
        } else if (current?.provider === "google") {
          clearAuthSession();
        }
      })
      .catch(() => {
        // Keep the current UI state during transient development-server errors.
      })
      .finally(() => {
        if (!cancelled) setAuthChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (pathname === "/onboarding") return children;

  if (!authChecked && !session && !isPublicPage) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <p className="text-sm font-semibold text-muted-foreground">Memeriksa sesi...</p>
      </div>
    );
  }

  if (!session && !isPublicPage) {
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

  const initials = session?.name ? session.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() : "";
  const companionName = session?.companionName || "Nora";

  async function logout() {
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => null);
    clearAuthSession();
    setProfileOpen(false);
    setMobileOpen(false);
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-background">
      {session && <WellbeingReminder />}
      <aside className={`fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-sidebar lg:block ${!session ? "lg:hidden" : ""}`}><SidebarContent pathname={pathname} companionName={companionName} onLogout={logout} /></aside>

      {mobileOpen && session && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Tutup menu" />
          <aside className="absolute inset-y-0 left-0 w-[85vw] max-w-72 border-r border-line bg-sidebar pb-[env(safe-area-inset-bottom)]">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Tutup menu"><X className="h-5 w-5" /></button>
            <SidebarContent pathname={pathname} companionName={companionName} onNavigate={() => setMobileOpen(false)} onLogout={logout} />
          </aside>
        </div>
      )}

      <div className={`min-w-0 ${session ? "lg:pl-64" : ""}`}>
        <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-background/90 shadow-sm backdrop-blur-xl lg:inset-x-auto lg:left-[17rem] lg:right-4 lg:top-3 lg:rounded-2xl lg:border lg:border-line/80 lg:shadow-soft" style={!session ? { left: '1rem' } : undefined}>
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 overflow-visible px-3 py-2 sm:flex sm:h-16 sm:gap-3 sm:px-6 sm:py-0 lg:px-5">
            {session && (
              <button onClick={() => { setMobileOpen(true); setNotificationsOpen(false); setProfileOpen(false); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary lg:hidden" aria-label="Buka menu"><Menu className="h-5 w-5" /></button>
            )}
            <Link href={session ? "/dashboard" : "/"} className="flex min-w-0 items-center gap-1.5 overflow-hidden sm:hidden" aria-label="NutriVerse">
              <BrandLogo compact className="hidden !h-7 !w-7 shrink-0 min-[360px]:inline-flex" />
              <span className="truncate font-display text-base font-extrabold tracking-tight text-foreground">Nutri<span className="text-brand">Verse</span></span>
            </Link>
            <div className="col-span-3 row-start-2 min-w-0 sm:flex-1">
              <GlobalSearch companionName={companionName} />
            </div>
            <div className="col-start-3 row-start-1 ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              {session ? (
                <>
                  <span className="pill hidden bg-amber/15 text-amber xl:inline-flex" aria-label="Saldo 12450 XP Demo"><Flame className="h-3.5 w-3.5" /> 12.450 XP</span>
                  <span className="pill hidden bg-brand-soft text-brand xl:inline-flex" aria-label="Saldo 3280 HP Demo">3.280 HP</span>
                </>
              ) : (
                <div className="hidden lg:flex items-center gap-8 mr-6 text-sm font-medium text-muted-foreground">
                  <Link href="/#cara-kerja" className="transition hover:text-brand">Cara kerja</Link>
                  <Link href="/#tier" className="transition hover:text-brand">Tier &amp; liga</Link>
                  <Link href="/#reward" className="transition hover:text-brand">Reward</Link>
                  <Link href="/bantuan" className="transition hover:text-brand">Bantuan</Link>
                </div>
              )}
              <button onClick={toggleTheme} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary sm:h-9 sm:w-9" aria-label="Ganti tema">{dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</button>
              {session ? (
                <>
                  <div className="relative">
                <button
                  onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }}
                  className="relative grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:h-9 sm:w-9"
                  aria-label={`${HEADER_NOTIFICATIONS.length} notifikasi belum dibaca`}
                  aria-expanded={notificationsOpen}
                  aria-controls="header-notifications"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-background" />
                </button>
                {notificationsOpen && (
                  <section id="header-notifications" className="fixed inset-x-3 top-[7rem] z-50 overflow-hidden rounded-2xl border border-line bg-card shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80" aria-label="Daftar notifikasi">
                    <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
                      <div>
                        <p className="font-display text-sm font-bold text-foreground">Notifikasi</p>
                        <p className="text-[10px] text-muted-foreground">{HEADER_NOTIFICATIONS.length} pembaruan terbaru</p>
                      </div>
                      <span className="grid h-7 min-w-7 place-items-center rounded-full bg-destructive/10 px-2 text-[10px] font-bold text-destructive">{HEADER_NOTIFICATIONS.length}</span>
                    </div>
                    <div className="p-2">
                      {HEADER_NOTIFICATIONS.map((item) => (
                        <Link key={item.id} href={item.href} onClick={() => setNotificationsOpen(false)} className="flex gap-3 rounded-xl px-3 py-3 transition hover:bg-secondary">
                          <span className="relative mt-1 h-2 w-2 shrink-0 rounded-full bg-brand"><span className="absolute inset-0 animate-ping rounded-full bg-brand/40" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-foreground">{item.title}</span>
                            <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">{item.detail}</span>
                            <span className="mt-1 block text-[9px] font-semibold text-brand">{item.time}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
              <div className="relative">
                <button onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }} className="relative grid h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-brand to-lime text-xs font-bold text-white ring-2 ring-card transition hover:opacity-90 sm:h-9 sm:w-9 sm:text-sm" aria-label={`Menu profil ${session.name}`} aria-expanded={profileOpen}>{session.avatarUrl ? <NextImage src={session.avatarUrl} alt="" fill unoptimized className="object-cover" /> : initials}</button>
                {profileOpen && (
                  <div className="fixed right-3 top-[7rem] w-64 overflow-hidden rounded-2xl border border-line bg-card p-2 shadow-2xl sm:absolute sm:right-0 sm:top-full sm:mt-2">
                    <div className="border-b border-line/50 px-3 py-3"><p className="truncate text-sm font-bold text-foreground">{session.name}</p><p className="truncate text-xs text-muted-foreground">{session.email}</p><span className="mt-2 inline-flex rounded-full bg-brand-soft px-2 py-1 text-[9px] font-bold text-brand">AKUN AKTIF</span></div>
                    <Link href="/profil" onClick={() => setProfileOpen(false)} className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-secondary"><UserRound className="h-4 w-4" /> Lihat profil</Link>
                    <Link href="/pengaturan" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-secondary"><Settings className="h-4 w-4" /> Pengaturan akun</Link>
                    <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /> Keluar</button>
                  </div>
                )}
              </div>
                </>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  <Link href="/" className="btn btn-primary btn-sm font-bold shadow-soft"><UserRound className="h-4 w-4" /> Masuk</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`min-w-0 px-4 pb-12 pt-[7.5rem] sm:px-6 sm:pb-12 sm:pt-24 lg:px-8 lg:pb-12 lg:pt-24 ${!session ? "max-w-7xl mx-auto" : ""}`}>{children}</main>
        <Footer />
      </div>

      {session && (
        <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-2xl border border-line bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden" aria-label="Navigasi utama mobile">
          {MOBILE_NAV.map((item) => { const Icon = item.icon; const active = isActive(pathname, item.href); return <Link key={item.href} href={item.href} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold transition ${active ? "bg-brand-soft text-brand" : "text-muted-foreground"}`}><Icon className="h-[18px] w-[18px]" /><span className="truncate">{item.label}</span></Link>; })}
        </nav>
      )}
    </div>
  );
}
