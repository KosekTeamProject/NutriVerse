"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Play, Check, Trophy, Flame, ScanLine, Activity, HeartPulse, Moon, Sun, UserRound } from "lucide-react";
import { RankCrest } from "@/components/brand/RankCrest";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthEntryModal } from "@/components/auth/AuthEntryModal";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTheme } from "@/hooks/useTheme";
import { TIER_EMBLEM_NAMES, type TierSlug } from "@/lib/tiers";

const TIERS: ReadonlyArray<{ name: string; slug: TierSlug; from: string; to: string; xp: string }> = [
  { name: "Sprout", slug: "sprout", from: "#bbf7d0", to: "#4ade80", xp: "0" },
  { name: "Seedling", slug: "seedling", from: "#86efac", to: "#22c55e", xp: "1.2K" },
  { name: "Bloom", slug: "bloom", from: "#6ee7b7", to: "#10b981", xp: "3K" },
  { name: "Vital", slug: "vital", from: "#5eead4", to: "#14b8a6", xp: "6K" },
  { name: "Radiant", slug: "radiant", from: "#7dd3fc", to: "#0ea5e9", xp: "10K" },
  { name: "Peak", slug: "peak", from: "#a5b4fc", to: "#6366f1", xp: "16K" },
  { name: "Elite", slug: "elite", from: "#c4b5fd", to: "#8b5cf6", xp: "24K" },
  { name: "Apex", slug: "apex", from: "#fcd34d", to: "#f59e0b", xp: "34K" },
  { name: "Legend", slug: "legend", from: "#fda4af", to: "#e11d48", xp: "50K" },
];

function Logo() {
  return (
    <Link href="/" className="flex min-w-0 items-center transition duration-200 hover:opacity-90 active:scale-95" aria-label="NutriVerse">
      <BrandLogo className="hidden min-[360px]:inline-flex" />
      <span className="truncate font-display text-lg font-extrabold tracking-[-0.055em] text-foreground min-[360px]:hidden">Nutri<span className="text-brand">Verse</span></span>
    </Link>
  );
}

function CountUp({ 
  value, 
  duration = 1500, 
  reducedMotion 
}: { 
  readonly value: number; 
  readonly duration?: number; 
  readonly reducedMotion: boolean; 
}) {
  const [count, setCount] = useState(reducedMotion ? value : 0);

  useEffect(() => {
    if (reducedMotion) return;
    let start = 0;
    const end = value;
    if (start === end) return;

    const incrementTime = Math.max(Math.floor(duration / end), 16);
    const step = Math.ceil(end / (duration / incrementTime));

    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration, reducedMotion]);

  return <>{count.toLocaleString("id-ID")}</>;
}

function HealthRing({ value, reducedMotion }: { readonly value: number; readonly reducedMotion: boolean }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 800);
    return () => clearTimeout(t);
  }, []);

  const val = active ? value : 0;

  return (
    <div className="relative grid place-items-center shrink-0">
      <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
        <defs>
          <linearGradient id="heroRing" x1="0" y1="0" x2="92" y2="92">
            <stop stopColor="var(--brand-bright)" />
            <stop offset="1" stopColor="var(--lime)" />
          </linearGradient>
        </defs>
        <circle cx="46" cy="46" r={r} fill="none" stroke="var(--secondary)" strokeWidth="8" />
        <circle 
          cx="46" 
          cy="46" 
          r={r} 
          fill="none" 
          stroke="url(#heroRing)" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeDasharray={c} 
          className="transition-all duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ strokeDashoffset: reducedMotion ? c * (1 - value / 100) : c * (1 - val / 100) }} 
        />
      </svg>
      <div className="absolute text-center select-none">
        <p className="stat-num text-2xl leading-none text-foreground">
          <CountUp value={value} duration={1500} reducedMotion={reducedMotion} />
        </p>
        <p className="text-[10px] text-muted-foreground">Health</p>
      </div>
    </div>
  );
}

function MacroBar({ 
  label, 
  pct, 
  color, 
  delay = 0, 
  reducedMotion 
}: { 
  readonly label: string; 
  readonly pct: number; 
  readonly color: string; 
  readonly delay?: number; 
  readonly reducedMotion: boolean; 
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  const width = active ? `${pct}%` : "0%";

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] select-none">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="stat-num text-muted-foreground flex items-center gap-0.5">
          <CountUp value={pct} duration={1200} reducedMotion={reducedMotion} />%
        </span>
      </div>
          <div className="chart-progress mt-1 h-1.5 overflow-hidden rounded-full">
        <div 
          className="h-full rounded-full transition-all duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)]" 
          style={{ width: reducedMotion ? `${pct}%` : width, background: color }} 
        />
      </div>
    </div>
  );
}

function PreviewCard({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const [hovering, setHovering] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / (rect.height / 2)) * 4;
    const rotateY = (x / (rect.width / 2)) * 4;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovering(false);
  };

  return (
    <div 
      className="relative mx-auto w-full max-w-md transition-all duration-300"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: hovering && !reducedMotion
          ? `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px)`
          : `perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0)`,
        boxShadow: hovering ? "var(--shadow-premium)" : "var(--shadow-soft)",
        transition: hovering ? "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease" : "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease"
      }}
    >
      <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/25 to-sky/15 blur-2xl opacity-80" />
      <div className="absolute -right-3 -top-5 z-10 flex items-center gap-2 rounded-2xl border border-line bg-card px-3 py-2 shadow-lift">
        <RankCrest id="hero" tier="radiant" from="#7dd3fc" to="#0ea5e9" size={30} />
        <div className="leading-tight">
          <p className="text-[10px] font-medium text-muted-foreground">Tier</p>
          <p className="font-display text-sm font-bold text-foreground">Radiant</p>
        </div>
      </div>
      <div className={`card card-pad bg-card/95 backdrop-blur-md border-line/60 ${hovering || reducedMotion ? "" : "animate-float"}`}>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand to-lime font-display font-bold text-white shadow-sm">FM</div>
          <div className="flex-1">
            <p className="font-display font-bold leading-tight text-foreground">Fathan Mubarak</p>
            <p className="text-xs text-muted-foreground">Level konsistensi tinggi</p>
          </div>
          <span className="pill bg-amber/15 text-amber font-bold"><Flame className="h-3.5 w-3.5" /> 12</span>
        </div>
        <div className="mt-5 flex items-center gap-5">
          <HealthRing value={86} reducedMotion={reducedMotion} />
          <div className="flex-1 space-y-2.5">
            <MacroBar label="Protein" pct={72} color="var(--brand)" delay={1.2} reducedMotion={reducedMotion} />
            <MacroBar label="Karbohidrat" pct={54} color="var(--lime)" delay={1.4} reducedMotion={reducedMotion} />
            <MacroBar label="Lemak" pct={38} color="var(--amber)" delay={1.6} reducedMotion={reducedMotion} />
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-secondary p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">XP dari aktivitas minggu ini</p>
            <p className="stat-num text-sm text-brand font-extrabold flex items-center gap-0.5">
              +<CountUp value={1240} duration={2000} reducedMotion={reducedMotion} />
            </p>
          </div>
          <div className="mt-3 flex h-16 items-end gap-1.5">
            {[40, 65, 52, 80, 48, 92, 70].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 rounded-md bg-gradient-to-t from-brand to-brand-bright transition-all duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)]" 
                style={{ 
                  height: hovering || activeTransition(reducedMotion) ? `${h}%` : "15%",
                  transitionDelay: reducedMotion ? "0ms" : `${i * 60}ms`
                }} 
              />
            ))}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Radiant</span>
            <span className="text-muted-foreground">
              <CountUp value={1550} duration={1800} reducedMotion={reducedMotion} /> XP menuju Peak
            </span>
          </div>
            <div className="chart-progress mt-1.5 h-2 overflow-hidden rounded-full">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-sky to-brand transition-all duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)]" 
              style={{ width: hovering || activeTransition(reducedMotion) ? "68%" : "0%" }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function activeTransition(reducedMotion: boolean): boolean {
  if (typeof window === "undefined" || reducedMotion) return true;
  return true;
}

function StepCard({ n, icon, title, desc, accent }: { readonly n: string; readonly icon: React.ReactNode; readonly title: string; readonly desc: string; readonly accent: "brand" | "sky" | "amber" }) {
  const map: Record<string, string> = {
    brand: "text-brand bg-brand-soft",
    sky: "text-sky bg-sky/10",
    amber: "text-amber bg-amber/15",
  };
  return (
    <div className="card card-pad card-hover relative overflow-hidden group border-line bg-card">
      <span className="absolute right-4 top-2 font-display text-6xl font-extrabold text-line/60 select-none transition duration-500 group-hover:scale-105 group-hover:text-brand/10">{n}</span>
      <div className={`relative grid h-12 w-12 place-items-center rounded-2xl transition duration-500 group-hover:scale-110 ${map[accent]}`}>{icon}</div>
      <h3 className="relative mt-4 font-display text-lg font-bold text-foreground transition group-hover:text-brand">{title}</h3>
      <p className="relative mt-2 text-sm text-muted-foreground leading-normal">{desc}</p>
    </div>
  );
}

function ScrollReveal({ children }: { readonly children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.99)",
        filter: visible ? "blur(0)" : "blur(2px)"
      }}
    >
      {children}
    </div>
  );
}

function FooterCol({ title, links }: { readonly title: string; readonly links: string[] }) {
  return (
    <div className="space-y-4">
      <p className="font-display text-sm font-bold text-foreground">{title}</p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l}><a href="#" className="text-sm text-muted-foreground transition hover:text-brand">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  const session = useAuthSession();
  const { dark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<"choice" | "login">("choice");

  useEffect(() => {
    let active = true;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    const raf = requestAnimationFrame(() => {
      if (active) {
        setMounted(true);
        setReducedMotion(media.matches);
      }
    });

    const listener = (e: MediaQueryListEvent) => {
      if (active) {
        setReducedMotion(e.matches);
      }
    };
    media.addEventListener("change", listener);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
      media.removeEventListener("change", listener);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!session && !window.localStorage.getItem("nutriverse.welcome-seen")) {
        window.localStorage.setItem("nutriverse.welcome-seen", "true");
        setAuthView("choice");
        setAuthOpen(true);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [session]);

  function openAuth(view: "choice" | "login") {
    setAuthView(view);
    setAuthOpen(true);
  }

  const titleWords = [
    "Ubah", "kebiasaan", "sehat", "jadi", "peringkat", "yang", "dibanggakan."
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <AuthEntryModal key={`${authView}-${authOpen}`} open={authOpen} initialView={authView} onClose={() => setAuthOpen(false)} />
      {/* Background radial gradient animations */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand/10 blur-[80px] animate-[float_12s_ease-in-out_infinite]" />
        <div className="absolute right-0 top-40 h-[450px] w-[450px] rounded-full bg-sky/5 blur-[100px] animate-[float_16s_ease-in-out_infinite]" style={{ animationDelay: "1s" }} />
      </div>

      <header className="sticky top-0 z-50 border-b border-line/70 bg-background/80 backdrop-blur-xl transition duration-500 animate-slide-down-nav">
        <nav className="container-app flex h-16 min-w-0 items-center gap-2 sm:gap-3">
          <Logo />
          <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#cara-kerja" className="transition hover:text-brand">Cara kerja</a>
            <a href="#tier" className="transition hover:text-brand">Tier & liga</a>
            <a href="#" className="transition hover:text-brand">Reward</a>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button onClick={toggleTheme} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:h-9 sm:w-9" aria-label="Ganti tema">
              {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            {session ? (
              <>
                <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">Halo, {session.name.split(" ")[0]}</span>
                <Link href="/dashboard" className="btn btn-primary btn-sm font-bold shadow-soft"><UserRound className="h-4 w-4" /> Dasbor</Link>
              </>
            ) : (
              <>
                <button onClick={() => openAuth("login")} className="btn btn-ghost btn-sm hidden font-bold transition hover:bg-line/40 sm:inline-flex">Masuk</button>
                <button onClick={() => openAuth("choice")} className="btn btn-primary btn-sm px-2.5 font-bold shadow-soft transition hover:scale-105 active:scale-98 sm:px-3"><span className="hidden min-[360px]:inline">Mulai </span>gratis <ArrowRight className="h-4 w-4" /></button>
              </>
            )}
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 grid-dots opacity-40" />
        </div>
        <div className="container-app grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <span className="eyebrow select-none"><Trophy className="h-3.5 w-3.5" /> Kompetisi kesehatan kampus</span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl text-foreground flex flex-wrap">
              {titleWords.map((w, idx) => {
                const isHighlight = w.toLowerCase().includes("peringkat");
                return (
                  <span 
                    key={idx} 
                    className={`inline-block transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isHighlight 
                        ? "bg-gradient-to-r from-brand via-brand-bright to-lime bg-clip-text text-transparent animate-breathe font-extrabold" 
                        : "text-foreground"
                    }`}
                    style={{ 
                      transitionDelay: reducedMotion ? "0ms" : `${idx * 80}ms`,
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? "translateY(0)" : "translateY(12px)",
                      filter: mounted ? "blur(0)" : "blur(1px)"
                    }}
                  >
                    {w}&nbsp;
                  </span>
                );
              })}
            </h1>
            <p 
              className={`mt-5 max-w-xl text-lg text-muted-foreground leading-relaxed transition-all duration-1000 ease-out`}
              style={{
                transitionDelay: reducedMotion ? "0ms" : "600ms",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(8px)"
              }}
            >
              Lari, bersepeda, dan pola makanmu berubah jadi XP, tier, dan reward nyata. NutriVerse membuat hidup sehat terasa seperti menaikkan rank di game favoritmu.
            </p>
            <div 
              className="mt-8 flex flex-wrap gap-3 transition-all duration-1000 ease-out"
              style={{
                transitionDelay: reducedMotion ? "0ms" : "750ms",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(8px)"
              }}
            >
              {session ? (
                <Link href="/dashboard" className="btn btn-primary btn-lg font-bold shadow-soft">Lanjutkan progres <ArrowRight className="h-[18px] w-[18px]" /></Link>
              ) : (
                <button onClick={() => openAuth("choice")} className="btn btn-primary btn-lg font-bold shadow-soft transition hover:scale-105 active:scale-98">Mulai gratis <ArrowRight className="h-[18px] w-[18px]" /></button>
              )}
              <a href="#cara-kerja" className="btn btn-outline btn-lg font-bold transition hover:bg-secondary"><Play className="h-[18px] w-[18px]" /> Lihat cara kerja</a>
            </div>
            <ul 
              className="mt-8 flex flex-col gap-2.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6 transition-all duration-1000 ease-out"
              style={{
                transitionDelay: reducedMotion ? "0ms" : "900ms",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(8px)"
              }}
            >
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" /> 9 tier liga, Sprout hingga Legend</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" /> XP hanya dari aktivitas nyata</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" /> Tanpa install, buka di browser</li>
            </ul>
          </div>
          <div 
            className="transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              transitionDelay: reducedMotion ? "0ms" : "400ms",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "scale(1)" : "scale(0.96)"
            }}
          >
            <PreviewCard reducedMotion={reducedMotion} />
          </div>
        </div>
      </section>

      {session && (
        <section className="container-app pb-4">
          <div className="grid gap-5 overflow-hidden rounded-[2rem] border border-brand/20 bg-gradient-to-br from-brand/10 via-card to-sky/10 p-5 shadow-soft sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="eyebrow"><HeartPulse className="h-3.5 w-3.5" /> Ringkasan personal</span>
              <h2 className="mt-3 font-display text-2xl font-extrabold">Selamat datang kembali, {session.name.split(" ")[0]}.</h2>
              <p className="mt-1 text-sm text-muted-foreground">Health Pulse dan progresmu tetap hadir di landing page tanpa memutus identitas visual NutriVerse.</p>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-md">
                <div className="rounded-2xl bg-card p-3"><p className="text-[10px] font-bold text-muted-foreground">HEALTH PULSE</p><p className="mt-1 font-display text-xl font-extrabold">78</p></div>
                <div className="rounded-2xl bg-card p-3"><p className="text-[10px] font-bold text-muted-foreground">HARI AKTIF</p><p className="mt-1 font-display text-xl font-extrabold">4/7</p></div>
                <div className="rounded-2xl bg-card p-3"><p className="text-[10px] font-bold text-muted-foreground">STREAK</p><p className="mt-1 font-display text-xl font-extrabold">7</p></div>
              </div>
            </div>
            <Link href="/dashboard" className="btn btn-primary w-full lg:w-auto">Buka ruang personal <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      )}

      <ScrollReveal>
        <section id="cara-kerja" className="container-app py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Cara kerja</span>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">Sehat yang terasa seperti naik rank</h2>
            <p className="mt-4 text-muted-foreground leading-normal">Tiga langkah sederhana, satu lingkaran motivasi yang terus berputar.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <StepCard n="01" accent="brand" icon={<ScanLine className="h-6 w-6" />} title="Scan makananmu" desc="Kamera mengenali kalori dan gizi, lalu menyarankan berapa menit lari untuk membakarnya. Murni informasi — tidak menambah XP." />
            <StepCard n="02" accent="sky" icon={<Activity className="h-6 w-6" />} title="Gerak, lacak lewat GPS" desc="Tekan mulai, GPS melacak jarak dan waktu lari atau bersepeda. Hanya aktivitas nyata yang menghasilkan XP, tervalidasi anti-cheat." />
            <StepCard n="03" accent="amber" icon={<Trophy className="h-6 w-6" />} title="Naik tier & tukar reward" desc="XP menaikkan ligamu di leaderboard. Kumpulkan Health Points, lalu tukar jadi reward nyata dari mitra." />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section id="tier" className="relative overflow-hidden py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grid-dots opacity-40" />
          <div className="container-app">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Sistem progresi CHPS</span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                Sembilan tier. Satu tujuan: jadi <span className="bg-gradient-to-r from-amber to-destructive bg-clip-text text-transparent">Legend</span>.
              </h2>
              <p className="mt-4 text-muted-foreground leading-normal">Setiap season sebagian XP direset. Konsistensi — bukan grinding sesaat — yang membawamu naik.</p>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-3 md:grid-cols-9">
              {TIERS.map((t) => (
                <div key={t.slug} className="card card-hover flex min-h-40 flex-col items-center justify-center gap-1.5 p-3 text-center border-line bg-card hover:scale-105 duration-200">
                  <RankCrest id={t.slug} tier={t.slug} from={t.from} to={t.to} size={52} />
                  <p className="font-display text-sm font-bold leading-none text-foreground">{t.name}</p>
                  <p className="rounded-full bg-secondary/75 px-2 py-0.5 text-[10px] font-bold leading-none text-muted-foreground">{TIER_EMBLEM_NAMES[t.slug]}</p>
                  <p className="stat-num text-[11px] text-muted-foreground">{t.xp} XP</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="container-app py-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand to-lime px-8 py-14 text-center text-white shadow-lift sm:px-16">
            <div aria-hidden className="absolute inset-0 grid-dots opacity-20" />
            <div className="relative mx-auto max-w-xl space-y-4">
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Siap memulai pendakianmu?</h2>
              <p className="text-white/90 leading-relaxed text-sm">Gratis untuk mahasiswa. Buat akun, catat aktivitas pertamamu, dan rebut posisi di leaderboard kampus.</p>
              <div className="pt-4 flex justify-center">
                {session ? (
                  <Link href="/dashboard" className="btn btn-lg bg-white text-brand hover:bg-white/90 font-bold shadow-soft">Lihat progres saya <ArrowRight className="h-[18px] w-[18px]" /></Link>
                ) : (
                  <Link href="/onboarding" className="btn btn-lg bg-white text-brand hover:bg-white/90 font-bold shadow-soft transition hover:scale-105 active:scale-98">Buat akun gratis <ArrowRight className="h-[18px] w-[18px]" /></Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <footer className="border-t border-line bg-card/45 backdrop-blur-md">
        <div className="container-app grid gap-10 py-14 md:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground leading-normal">Platform kesehatan gamified oleh tim KOSEK untuk AMICTA 2026.</p>
          </div>
          <FooterCol title="Produk" links={["Cara kerja", "Tier & liga", "Reward", "Komunitas"]} />
          <FooterCol title="Tim" links={["Tentang KOSEK", "AMIKOM Yogyakarta", "Kontak"]} />
          <FooterCol title="Sumber" links={["Dokumentasi", "Panduan tim", "Privasi"]} />
        </div>
        <div className="border-t border-line/45">
          <div className="container-app flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
            <p>&copy; 2026 NutriVerse &middot; Tim KOSEK</p>
            <p>Dibuat untuk AMICTA 2026 &middot; Universitas AMIKOM Yogyakarta</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
