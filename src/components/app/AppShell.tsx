"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, CalendarCheck, CheckCheck, Flame, Gift, Heart, Home, Images, LayoutDashboard, LogIn, LogOut, Menu, Moon, ScanLine, Settings, Sparkles, Sun, Trophy, UserRound, UsersRound, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuthSession } from "@/hooks/useAuthSession";
import { clearAuthSession, readAuthSession, saveAuthSession } from "@/features/auth/session";
import { WellbeingReminder } from "@/components/app/WellbeingReminder";
import { UserProfileSearch } from "@/components/app/UserProfileSearch";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Footer } from "@/components/app/Footer";
import { useProgressData } from "@/providers/ProgressDataProvider";

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
    { href: "/momen", label: "Momen", icon: Images },
  ] },
  { label: "Komunitas", items: [
    { href: "/challenge", label: "Tantangan", icon: Trophy },
    { href: "/komunitas", label: "Komunitas & Event", icon: UsersRound },
    { href: "/reward", label: "Hadiah", icon: Gift },
  ] },
];

const MOBILE_NAV = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/aktivitas", label: "Aktivitas", icon: Activity },
  { href: "/scan", label: "Makanan", icon: ScanLine },
  { href: "/komunitas", label: "Komunitas", icon: UsersRound },
  { href: "/profil", label: "Profil", icon: UserRound },
];

type HeaderNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  requiresAction: boolean;
  processingAt: string | null;
  resolvedAt: string | null;
  expiresAt: string | null;
  actionUrl: string | null;
  createdAt: string;
};

function notificationPriority(notification: HeaderNotification) {
  const expired = notification.expiresAt && new Date(notification.expiresAt).getTime() <= Date.now();
  if (notification.requiresAction && !notification.processingAt && !notification.resolvedAt && !expired) return 0;
  if (notification.processingAt && !notification.resolvedAt && !expired) return 1;
  if (!notification.isRead) return 2;
  return 3;
}

function headerNotificationStatus(notification: HeaderNotification) {
  const expired = notification.expiresAt && new Date(notification.expiresAt).getTime() <= Date.now();
  if (notification.resolvedAt) return null;
  if (expired) return { label: "Kedaluwarsa", className: "text-muted-foreground" };
  if (notification.processingAt) return { label: "Sedang diproses", className: "text-sky" };
  if (notification.requiresAction) return { label: "Perlu tindakan", className: "text-amber" };
  return null;
}

function notificationHref(notification: HeaderNotification) {
  if (notification.actionUrl?.startsWith("/") && !notification.actionUrl.startsWith("//")) {
    return notification.actionUrl;
  }
  const { type } = notification;
  if (type === "CHALLENGE") return "/challenge";
  if (type === "REWARD") return "/reward";
  if (type === "EVENT") return "/komunitas";
  if (type === "SOCIAL") return "/profil";
  if (type === "ACTIVITY" || type === "CHEAT_ALERT") return "/aktivitas";
  return "/todays-journey";
}

function notificationTime(value: string) {
  const timestamp = new Date(value).getTime();
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (elapsedMinutes < 1) return "Baru saja";
  if (elapsedMinutes < 60) return `${elapsedMinutes} menit lalu`;
  if (elapsedMinutes < 1_440) return `${Math.floor(elapsedMinutes / 60)} jam lalu`;
  return `${Math.floor(elapsedMinutes / 1_440)} hari lalu`;
}

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
  const { overview } = useProgressData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [economy, setEconomy] = useState({ totalXp: 0, currentHp: 0 });
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
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
            username?: string | null;
            avatarUrl?: string | null;
            companionName?: string;
            companionAvatarId?: string;
            provider?: "password" | "google";
            onboardingCompleted?: boolean;
            economy?: { totalXp: number; currentHp: number } | null;
          };
        } | null;

        if (cancelled) return;
        const current = readAuthSession();
        if (response.ok && result?.success && result.user) {
          saveAuthSession({
            ...current,
            name: result.user.name,
            email: result.user.email,
            username:
              result.user.username ||
              result.user.email.split("@")[0] ||
              "nutriverse-user",
            companionName: result.user.companionName || current?.companionName || "Nora",
            companionAvatarId: result.user.companionAvatarId || current?.companionAvatarId,
            avatarUrl: result.user.avatarUrl || current?.avatarUrl,
            provider: result.user.provider ?? "password",
            onboardingCompleted:
              result.user.onboardingCompleted ??
              current?.onboardingCompleted ??
              Boolean(current?.baseline),
            createdAt: current?.createdAt || new Date().toISOString(),
            lastLoginTimestamp: Date.now(),
          });
          setEconomy({
            totalXp: result.user.economy?.totalXp ?? 0,
            currentHp: result.user.economy?.currentHp ?? 0,
          });
        } else if (response.status === 401) {
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

  useEffect(() => {
    if (!authChecked || !session) return;
    let cancelled = false;
    
    const fetchNotifs = async () => {
      try {
        const response = await fetch("/api/notifications?scope=active&limit=8", { cache: "no-store" });
        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; notifications?: HeaderNotification[]; unreadCount?: number }
          | null;
        if (!cancelled && response.ok && result?.success) {
          setNotifications([...(result.notifications ?? [])].sort((left, right) => {
            const priorityDifference = notificationPriority(left) - notificationPriority(right);
            if (priorityDifference !== 0) return priorityDifference;
            return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
          }));
          setUnreadNotificationCount(result.unreadCount ?? 0);
        }
      } catch {
        // Notifikasi tidak menggagalkan shell saat koneksi terputus.
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30_000);
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [authChecked, session]);

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
  const displayedEconomy = overview?.economy ?? economy;

  async function logout() {
    if (!window.confirm("Yakin ingin keluar dari akun NutriVerse?")) return;
    const response = await fetch("/api/auth/sign-out", { method: "POST" }).catch(
      () => null,
    );
    if (response && !response.ok) {
      window.alert("Sesi belum dapat diakhiri. Silakan coba lagi.");
      return;
    }
    clearAuthSession();
    setProfileOpen(false);
    setMobileOpen(false);
    router.replace("/");
  }

  function openNotification(notification: HeaderNotification) {
    setNotificationsOpen(false);
    if (notification.isRead) return;
    setNotifications((items) =>
      items.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
    );
    setUnreadNotificationCount((count) => Math.max(0, count - 1));
    void fetch(`/api/notifications/${notification.id}/read`, {
      method: "PATCH",
    });
  }

  async function markAllNotificationsRead() {
    const response = await fetch("/api/notifications", { method: "PATCH" }).catch(() => null);
    if (!response?.ok) return;
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
    setUnreadNotificationCount(0);
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
            {pathname === "/momen" && (
              <div className="col-span-3 row-start-2 min-w-0 sm:flex-1">
                <UserProfileSearch />
              </div>
            )}
            <div className="col-start-3 row-start-1 ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              {session ? (
                <>
                  <span className="pill hidden bg-amber/15 text-amber xl:inline-flex" aria-label={`Saldo ${displayedEconomy.totalXp} XP`}><Flame className="h-3.5 w-3.5" /> {displayedEconomy.totalXp.toLocaleString("id-ID")} XP</span>
                  <span className="pill hidden bg-brand-soft text-brand xl:inline-flex" aria-label={`Saldo ${displayedEconomy.currentHp} HP`}>{displayedEconomy.currentHp.toLocaleString("id-ID")} HP</span>
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
                  aria-label={`${unreadNotificationCount} notifikasi belum dibaca`}
                  aria-expanded={notificationsOpen}
                  aria-controls="header-notifications"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadNotificationCount > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-background" />}
                </button>
                {notificationsOpen && (
                  <section id="header-notifications" className="fixed inset-x-3 top-[7rem] z-50 overflow-hidden rounded-2xl border border-line bg-card shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80" aria-label="Daftar notifikasi">
                    <div className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-3">
                      <div>
                        <p className="font-display text-sm font-bold text-foreground">Notifikasi</p>
                        <p className="text-[10px] text-muted-foreground">Pembaruan terbaru untukmu</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {unreadNotificationCount > 0 && (
                          <button onClick={() => void markAllNotificationsRead()} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-brand" aria-label="Tandai semua notifikasi sudah dibaca">
                            <CheckCheck className="h-4 w-4" />
                          </button>
                        )}
                        <span className="grid h-7 min-w-7 place-items-center rounded-full bg-destructive/10 px-2 text-[10px] font-bold text-destructive">{unreadNotificationCount}</span>
                      </div>
                    </div>
                    <div className="max-h-[min(28rem,calc(100vh-12rem))] overflow-y-auto p-2">
                      {notifications.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted-foreground">Belum ada notifikasi.</p>}
                      {notifications.map((item) => {
                        const status = headerNotificationStatus(item);
                        return (
                        <Link key={item.id} href={notificationHref(item)} onClick={() => openNotification(item)} className="flex gap-3 rounded-xl px-3 py-3 transition hover:bg-secondary">
                          <span className={`relative mt-1 h-2 w-2 shrink-0 rounded-full ${item.isRead ? "bg-muted-foreground/35" : "bg-brand"}`}>{!item.isRead && <span className="absolute inset-0 animate-ping rounded-full bg-brand/40" />}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-foreground">{item.title}</span>
                            <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">{item.message}</span>
                            <span className="mt-1 flex flex-wrap items-center gap-2 text-[9px] font-semibold text-brand">
                              <span>{notificationTime(item.createdAt)}</span>
                              {status && <span className={status.className}>• {status.label}</span>}
                            </span>
                          </span>
                        </Link>
                        );
                      })}
                    </div>
                    <div className="border-t border-line/60 p-2">
                      <Link href="/notifikasi" onClick={() => setNotificationsOpen(false)} className="flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-bold text-brand transition hover:bg-brand-soft">
                        Lihat semua dan riwayat
                      </Link>
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


        <main className={`min-w-0 px-4 pb-12 ${pathname === "/momen" ? "pt-[7.5rem]" : "pt-20"} sm:px-6 sm:pb-12 sm:pt-24 lg:px-8 lg:pb-12 lg:pt-24 ${!session ? "max-w-7xl mx-auto" : ""}`}>{children}</main>
        <Footer />
      </div>

      {session && (
        <nav className="fixed inset-x-4 bottom-4 z-30 grid grid-cols-5 rounded-3xl border border-line/80 bg-background/90 p-2 shadow-2xl backdrop-blur-xl lg:hidden" aria-label="Navigasi utama mobile">
          {MOBILE_NAV.map((item) => { 
            const Icon = item.icon; 
            const active = isActive(pathname, item.href); 
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[10px] font-extrabold transition-all duration-300 ease-out active:scale-95 ${active ? "bg-brand-soft text-brand shadow-sm" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-300 ${active ? "scale-110" : ""}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            ); 
          })}
        </nav>
      )}
    </div>
  );
}
