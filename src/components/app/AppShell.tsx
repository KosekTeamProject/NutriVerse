"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import {
  LayoutDashboard, ScanLine, Activity, Trophy, Gift, Settings,
  Menu, X, Sun, Moon, Bell, Search, Flame, Leaf, UsersRound, Heart,
  CalendarCheck, Sparkles,
} from "lucide-react";
import { WellbeingReminder } from "@/components/app/WellbeingReminder";

const NAV_GROUPS = [
  {
    label: "Utama",
    items: [
      { href: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
      { href: "/todays-journey", label: "Hari Ini", icon: CalendarCheck },
      { href: "/health-pulse", label: "Health Pulse", icon: Heart },
      { href: "/companion", label: "Nora", icon: Sparkles },
    ],
  },
  {
    label: "Aktivitas",
    items: [
      { href: "/scan", label: "Pindai Makanan", icon: ScanLine },
      { href: "/aktivitas", label: "Aktivitas GPS", icon: Activity },
    ],
  },
  {
    label: "Komunitas",
    items: [
      { href: "/challenge", label: "Tantangan", icon: Trophy },
      { href: "/komunitas", label: "Komunitas & Peringkat", icon: UsersRound },
      { href: "/reward", label: "Hadiah", icon: Gift },
    ],
  },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <Link href="/" className="flex items-center gap-2.5 px-2" onClick={onNavigate}>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-lime text-white shadow-lg shadow-brand/30">
          <Leaf className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <span className="font-display text-lg font-extrabold tracking-tight">
          Nutri<span className="text-brand">Verse</span>
        </span>
      </Link>

      <nav className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-0.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground/70">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <Link
        href="/pengaturan"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
      >
        <Settings className="h-[18px] w-[18px]" /> Pengaturan
      </Link>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <WellbeingReminder />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-sidebar lg:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[85vw] max-w-64 border-r border-line bg-sidebar pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-line bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative hidden max-w-xs flex-1 sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="input pl-9" placeholder="Cari..." />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="pill hidden bg-amber/15 text-amber sm:inline-flex" title="Saldo XP Simulasi Demo" aria-label="Saldo 12450 XP Demo"><Flame className="h-3.5 w-3.5" /> 12.450 XP <span className="text-[9px] opacity-75 font-normal ml-0.5">Demo</span></span>
              <span className="pill hidden bg-brand-soft text-brand sm:inline-flex" title="Saldo HP Simulasi Demo" aria-label="Saldo 3280 HP Demo">3.280 HP <span className="text-[9px] opacity-75 font-normal ml-0.5">Demo</span></span>
              <button onClick={toggleTheme} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Ganti tema">
                {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>
              <button className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Notifikasi">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
              </button>
              <Link href="/profil" className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-lime text-sm font-bold text-white transition hover:opacity-90">FM</Link>
            </div>
          </div>
        </header>

        <main className="min-w-0 px-4 py-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
