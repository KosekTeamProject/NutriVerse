"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Play,
  Check,
  Trophy,
  Flame,
  ScanLine,
  Activity,
  HeartPulse,
  Moon,
  Sun,
  UserRound,
  Menu,
  X,
  ShieldCheck,
  MapPin,
  Sparkles,
  UsersRound,
  Gift,
  LockKeyhole,
  Smartphone,
  ChevronDown,
} from "lucide-react";
import { RankCrest } from "@/components/brand/RankCrest";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthEntryModal } from "@/components/auth/AuthEntryModal";
import { ThemeCursor } from "@/components/public/ThemeCursor";
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
  const publicLogoSrc = "/brand/nutriverse-public-logo.png";

  return (
    <Link href="/" className="flex min-w-0 items-center transition duration-200 hover:opacity-90 active:scale-95" aria-label="NutriVerse">
      <span className="public-logo-full"><BrandLogo src={publicLogoSrc} /></span>
      <span className="public-logo-compact min-w-0 items-center gap-2">
        <BrandLogo compact className="h-9 w-9" src={publicLogoSrc} />
        <span className="hidden truncate font-display text-base font-extrabold tracking-[-0.055em] text-foreground min-[350px]:inline">
          Nutri<span className="text-brand">Verse</span>
        </span>
      </span>
    </Link>
  );
}

function CountUp({ 
  value, 
  duration: _duration = 1500,
  reducedMotion: _reducedMotion,
}: { 
  readonly value: number; 
  readonly duration?: number; 
  readonly reducedMotion: boolean; 
}) {
  return <>{value.toLocaleString("id-ID")}</>;
}

function HealthRing({ value, reducedMotion }: { readonly value: number; readonly reducedMotion: boolean }) {
  const r = 34;
  const c = 2 * Math.PI * r;

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
          style={{ strokeDashoffset: c * (1 - value / 100) }}
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
  delay: _delay = 0,
  reducedMotion 
}: { 
  readonly label: string; 
  readonly pct: number; 
  readonly color: string; 
  readonly delay?: number; 
  readonly reducedMotion: boolean; 
}) {
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
          style={{ width: `${pct}%`, background: color }}
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
      className="relative mx-auto w-full max-w-md px-1 transition-all duration-300 sm:px-0"
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
      <div aria-hidden className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/20 via-brand/10 to-sky/10 blur-2xl opacity-80 sm:-inset-4" />
      <span className="absolute left-0 top-0 z-20 -translate-y-1/2 rounded-full border border-brand/20 bg-card px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-brand shadow-soft sm:-left-2 sm:-top-4 sm:translate-y-0 sm:text-[10px]">
        Contoh tampilan
      </span>
      <div className="absolute right-0 top-0 z-10 flex -translate-y-1/2 items-center gap-2 rounded-2xl border border-line bg-card px-2.5 py-1.5 shadow-lift sm:-right-3 sm:-top-5 sm:translate-y-0 sm:px-3 sm:py-2">
        <RankCrest id="hero" tier="radiant" from="#7dd3fc" to="#0ea5e9" size={30} />
        <div className="leading-tight">
          <p className="text-[10px] font-medium text-muted-foreground">Tier</p>
          <p className="font-display text-sm font-bold text-foreground">Radiant</p>
        </div>
      </div>
      <div className={`card border-line/60 bg-card/95 p-4 pt-6 backdrop-blur-md sm:p-6 ${hovering || reducedMotion ? "" : "animate-float"}`}>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand to-lime font-display font-bold text-white shadow-sm">FM</div>
          <div className="flex-1">
            <p className="font-display font-bold leading-tight text-foreground">Traveler NutriVerse</p>
            <p className="text-xs text-muted-foreground">Level konsistensi tinggi</p>
          </div>
          <span className="pill bg-amber/15 text-amber font-bold"><Flame className="h-3.5 w-3.5" /> 12</span>
        </div>
        <div className="mt-5 flex items-center gap-3 sm:gap-5">
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
                  height: `${h}%`,
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
              style={{ width: "68%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({ n, icon, title, desc, accent }: { readonly n: string; readonly icon: React.ReactNode; readonly title: string; readonly desc: string; readonly accent: "brand" | "sky" | "amber" }) {
  const map: Record<string, string> = {
    brand: "text-brand bg-brand-soft",
    sky: "text-sky bg-sky/10",
    amber: "text-amber bg-amber/15",
  };
  return (
    <div className="card card-pad card-hover group relative h-full overflow-hidden border-line bg-card">
      <span className="absolute right-4 top-2 font-display text-6xl font-extrabold text-line/60 select-none transition duration-500 group-hover:scale-105 group-hover:text-brand/10">{n}</span>
      <div className={`relative grid h-12 w-12 place-items-center rounded-2xl transition duration-500 group-hover:scale-110 ${map[accent]}`}>{icon}</div>
      <h3 className="relative mt-4 font-display text-lg font-bold text-foreground transition group-hover:text-brand">{title}</h3>
      <p className="relative mt-2 text-sm text-muted-foreground leading-normal">{desc}</p>
    </div>
  );
}

type RevealMotion = "rise" | "slide-left" | "slide-right" | "scale" | "tier-step";

function ScrollReveal({
  children,
  delay = 0,
  className = "",
  motion = "rise",
}: {
  readonly children: React.ReactNode;
  readonly delay?: number;
  readonly className?: string;
  readonly motion?: RevealMotion;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const rect = node.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight * 0.9 && rect.bottom > window.innerHeight * 0.08;
    setVisible(alreadyVisible);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.08, rootMargin: "-8% 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hidden = visible === false;
  const hiddenTransforms: Record<RevealMotion, string> = {
    rise: "translate3d(0, 42px, 0) scale(0.972)",
    "slide-left": "translate3d(-46px, 16px, 0) scale(0.978)",
    "slide-right": "translate3d(46px, 16px, 0) scale(0.978)",
    scale: "translate3d(0, 26px, 0) scale(0.92)",
    "tier-step": "translate3d(-42px, 12px, 0) scale(0.92)",
  };

  return (
    <div
      ref={ref}
      className={`motion-reveal transition-[opacity,transform] duration-[1250ms] ease-[cubic-bezier(0.33,1,0.68,1)] ${className}`}
      data-reveal-state={hidden ? "hidden" : "visible"}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? hiddenTransforms[motion] : "translate3d(0, 0, 0) scale(1)",
        transformOrigin: "center 78%",
        transitionDelay: visible ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}

function useCinematicScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    let currentY = window.scrollY;
    let targetY = currentY;
    let frame = 0;
    let lastFrameTime = performance.now();
    let lastTouchY = 0;
    let lastTouchTime = 0;
    let touchVelocity = 0;

    const maxScrollY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const clampScrollY = (value: number) => Math.min(Math.max(value, 0), maxScrollY());

    const canScrollNatively = (target: EventTarget | null, delta: number) => {
      let element = target instanceof Element ? target : null;

      while (element && element !== document.body) {
        if (element.hasAttribute("data-native-scroll")) return true;

        const style = window.getComputedStyle(element);
        const scrollable = /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
        if (scrollable) {
          const canMoveUp = delta < 0 && element.scrollTop > 0;
          const canMoveDown = delta > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1;
          if (canMoveUp || canMoveDown) return true;
        }

        element = element.parentElement;
      }

      return false;
    };

    const animateScroll = (time: number) => {
      const elapsed = Math.min(Math.max(time - lastFrameTime, 0), 64);
      lastFrameTime = time;
      const response = coarsePointer ? 300 : 260;
      const smoothing = 1 - Math.exp(-elapsed / response);

      currentY += (targetY - currentY) * smoothing;
      if (Math.abs(targetY - currentY) < 0.35) currentY = targetY;

      window.scrollTo(0, currentY);

      if (currentY !== targetY) {
        frame = requestAnimationFrame(animateScroll);
      } else {
        frame = 0;
      }
    };

    const startScroll = () => {
      if (frame) return;
      lastFrameTime = performance.now();
      frame = requestAnimationFrame(animateScroll);
    };

    const moveTarget = (delta: number) => {
      const maxLead = Math.max(coarsePointer ? 480 : 620, window.innerHeight * (coarsePointer ? 0.9 : 1.15));
      targetY = clampScrollY(targetY + delta);
      targetY = Math.min(Math.max(targetY, currentY - maxLead), currentY + maxLead);
      startScroll();
    };

    const setTarget = (nextTarget: number) => {
      targetY = clampScrollY(nextTarget);
      startScroll();
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || canScrollNatively(event.target, event.deltaY)) return;

      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? window.innerHeight
          : 1;
      const rawDelta = event.deltaY * unit;
      const controlledDelta = Math.min(Math.max(rawDelta * 0.88, -240), 240);

      event.preventDefault();
      moveTarget(controlledDelta);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      lastTouchY = touch.clientY;
      lastTouchTime = performance.now();
      touchVelocity = 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      const now = performance.now();
      const delta = lastTouchY - touch.clientY;

      if (canScrollNatively(event.target, delta)) {
        lastTouchY = touch.clientY;
        lastTouchTime = now;
        return;
      }

      event.preventDefault();
      const elapsed = Math.max(now - lastTouchTime, 8);
      touchVelocity = delta / elapsed;
      lastTouchY = touch.clientY;
      lastTouchTime = now;
      moveTarget(delta * 1.18);
    };

    const onTouchEnd = () => {
      const momentum = Math.min(Math.max(touchVelocity * 150, -280), 280);
      if (Math.abs(momentum) > 6) moveTarget(momentum);
      touchVelocity = 0;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select, button, [contenteditable='true']")) return;

      const keyMoves: Record<string, number> = {
        ArrowDown: 88,
        ArrowUp: -88,
        PageDown: window.innerHeight * 0.82,
        PageUp: window.innerHeight * -0.82,
        " ": event.shiftKey ? window.innerHeight * -0.82 : window.innerHeight * 0.82,
      };

      if (event.key === "Home") {
        event.preventDefault();
        setTarget(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setTarget(maxScrollY());
      } else if (event.key in keyMoves) {
        event.preventDefault();
        moveTarget(keyMoves[event.key]);
      }
    };

    const onAnchorClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href^="#"]');
      const href = anchor?.getAttribute("href");
      if (!href || href === "#") return;

      const destination = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!destination) return;

      event.preventDefault();
      const destinationY = destination.getBoundingClientRect().top + window.scrollY - 108;
      window.history.pushState(null, "", href);
      setTarget(destinationY);
    };

    const syncExternalScroll = () => {
      if (frame) return;
      currentY = window.scrollY;
      targetY = currentY;
    };

    root.classList.add("cinematic-scroll-active");
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", syncExternalScroll, { passive: true });
    document.addEventListener("click", onAnchorClick);

    return () => {
      cancelAnimationFrame(frame);
      root.classList.remove("cinematic-scroll-active");
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", syncExternalScroll);
      document.removeEventListener("click", onAnchorClick);
    };
  }, [enabled]);
}

type PublicLink = Readonly<{ label: string; href: string }>;

function FooterCol({ title, links }: { readonly title: string; readonly links: ReadonlyArray<PublicLink> }) {
  return (
    <div className="space-y-4">
      <p className="font-display text-sm font-bold text-foreground">{title}</p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-sm text-muted-foreground transition hover:text-brand">{l.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PUBLIC_FEATURES = [
  {
    icon: Activity,
    title: "Aktivitas yang dapat dipercaya",
    description: "Rekam jalan, lari, dan bersepeda. Status validasi ditampilkan dengan jelas sebelum aktivitas masuk ke progres kompetitif.",
    tone: "brand",
  },
  {
    icon: HeartPulse,
    title: "Progres yang mudah dipahami",
    description: "Health Pulse, target, tantangan, streak, XP, dan HP disatukan dalam perjalanan yang tidak membuat pengguna kewalahan.",
    tone: "sky",
  },
  {
    icon: ScanLine,
    title: "Catatan nutrisi lebih praktis",
    description: "Cari atau pindai makanan untuk memperoleh estimasi informasi nutrisi. Hasil tetap dapat diperiksa sebelum disimpan.",
    tone: "amber",
  },
  {
    icon: UsersRound,
    title: "Dukungan tanpa menghakimi",
    description: "Tantangan, komunitas, dan Nora membantu menjaga motivasi dengan langkah kecil yang realistis dan suportif.",
    tone: "brand",
  },
] as const;

const PUBLIC_FAQS = [
  {
    question: "Apa itu NutriVerse?",
    answer: "NutriVerse adalah Progressive Web App kesehatan berbasis gamifikasi yang membantu generasi muda membangun kebiasaan aktif, mencatat nutrisi, mengikuti tantangan, dan memahami progres secara lebih menarik.",
  },
  {
    question: "Apa perbedaan XP dan Health Points (HP)?",
    answer: "XP mencatat perkembangan jangka panjang, level, dan posisi kompetitif. HP adalah poin yang dapat digunakan untuk reward yang tersedia. Menukar HP tidak mengurangi XP atau level pengguna.",
  },
  {
    question: "Kapan NutriVerse mengakses lokasi saya?",
    answer: "Lokasi digunakan setelah pengguna memberikan izin dan memulai sesi aktivitas. Pelacakan dihentikan ketika aktivitas selesai atau dibatalkan. Koordinat mentah tidak ditampilkan pada leaderboard atau komunitas publik.",
  },
  {
    question: "Mengapa aktivitas perlu divalidasi?",
    answer: "Validasi membantu menjaga progres, tantangan, dan leaderboard tetap adil. Sistem memeriksa kewajaran waktu, jarak, urutan titik, pace, dan pola perpindahan sebelum memberikan progres kompetitif.",
  },
  {
    question: "Apakah NutriVerse memberikan diagnosis kesehatan?",
    answer: "Tidak. NutriVerse dan Nora hanya menyediakan informasi umum serta dukungan kebiasaan. Keduanya tidak menggantikan dokter, ahli gizi, atau tenaga kesehatan profesional.",
  },
  {
    question: "Apakah hasil pemindaian makanan selalu akurat?",
    answer: "Tidak selalu. Hasil pemindaian dan data nutrisi merupakan estimasi informasional. Pengguna perlu memeriksa nama makanan, porsi, dan informasi yang ditampilkan sebelum menyimpannya.",
  },
  {
    question: "Apakah reward selalu tersedia?",
    answer: "Reward digital dapat tersedia sesuai program. Voucher, merchandise, atau reward dari mitra hanya dapat digunakan ketika integrasi dan ketersediaannya telah dikonfirmasi.",
  },
  {
    question: "Apakah NutriVerse harus dipasang dari toko aplikasi?",
    answer: "Tidak. NutriVerse dapat dibuka melalui browser pada ponsel maupun desktop. Pada perangkat yang mendukung, aplikasi juga dapat ditambahkan ke layar utama sebagai PWA.",
  },
] as const;

function PublicFeatureCard({ feature }: { readonly feature: (typeof PUBLIC_FEATURES)[number] }) {
  const Icon = feature.icon;
  const toneClasses = {
    brand: "bg-brand-soft text-brand",
    sky: "bg-sky/10 text-sky",
    amber: "bg-amber/15 text-amber",
  } as const;

  return (
    <article className="group h-full rounded-[1.5rem] border border-line bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-soft sm:p-6">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${toneClasses[feature.tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-display text-lg font-extrabold text-foreground">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
    </article>
  );
}

function FaqItem({ item }: { readonly item: (typeof PUBLIC_FAQS)[number] }) {
  return (
    <details className="group rounded-2xl border border-line bg-card shadow-sm open:border-brand/25 open:shadow-soft">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-left font-display text-sm font-extrabold text-foreground marker:content-none sm:px-6 sm:text-base">
        <span>{item.question}</span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground transition group-open:rotate-180 group-open:bg-brand-soft group-open:text-brand">
          <ChevronDown className="h-4 w-4" />
        </span>
      </summary>
      <div className="px-5 pb-5 pr-14 text-sm leading-relaxed text-muted-foreground sm:px-6 sm:pb-6 sm:pr-20">
        {item.answer}
      </div>
    </details>
  );
}

const AUTH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  session_required: "Sesi Anda telah berakhir. Silakan masuk kembali untuk membuka halaman personal.",
  supabase_not_configured: "Supabase belum dikonfigurasi pada perangkat ini. Salin .env.example menjadi .env.local, lalu isi URL dan publishable key proyek Supabase sebelum menggunakan fitur akun.",
  missing_oauth_code: "Google tidak mengirimkan kode autentikasi. Silakan coba masuk kembali.",
  oauth_code_exchange_failed: "Sesi Google tidak dapat diproses. Silakan coba kembali.",
  profile_sync_failed: "Akun Google berhasil dikenali, tetapi profil NutriVerse belum dapat disinkronkan.",
  google_oauth_start_failed: "Proses masuk dengan Google belum dapat dimulai. Periksa konfigurasi lalu coba kembali.",
  admin_required: "Akun Anda tidak memiliki role administrator.",
};

function AuthStatusNotice({ onLogin }: { readonly onLogin: () => void }) {
  const searchParams = useSearchParams();
  const code = searchParams.get("auth_error");
  const message = code ? AUTH_ERROR_MESSAGES[code] : null;

  if (!message) return null;

  return (
    <div className="fixed inset-x-3 top-3 z-[90] mx-auto flex max-w-2xl items-start gap-3 rounded-2xl border border-amber/35 bg-card p-4 shadow-2xl sm:top-5">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">Autentikasi perlu diperbarui</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{message}</p>
      </div>
      <button type="button" onClick={onLogin} className="btn btn-primary btn-sm shrink-0">
        Masuk
      </button>
    </div>
  );
}

export default function Home() {
  const session = useAuthSession();
  const { dark, toggleTheme } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<"choice" | "login">("choice");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerElevated, setHeaderElevated] = useState(false);
  const heroMotionRef = useRef<HTMLDivElement>(null);

  useCinematicScroll(!authOpen && !mobileMenuOpen && !reducedMotion);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    media.addEventListener("change", listener);
    return () => {
      media.removeEventListener("change", listener);
    };
  }, []);

  useEffect(() => {
    const updateHeader = () => setHeaderElevated(window.scrollY > 18);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    const hero = heroMotionRef.current;
    if (!hero) return;

    if (reducedMotion) {
      hero.style.setProperty("--hero-scroll-scale", "1");
      hero.style.setProperty("--hero-scroll-opacity", "1");
      hero.style.setProperty("--hero-scroll-shift", "0px");
      hero.style.setProperty("--hero-media-shift", "0px");
      return;
    }

    let frame = 0;
    let lastFrameTime = performance.now();

    const readProgress = () => {
      const travel = Math.max(hero.offsetHeight * 0.88, 560);
      return Math.min(Math.max(window.scrollY / travel, 0), 1);
    };

    let currentProgress = readProgress();
    let targetProgress = currentProgress;

    const renderHeroMotion = (progress: number) => {
      const compact = window.innerWidth < 768;

      hero.style.setProperty("--hero-scroll-scale", String(1 - progress * (compact ? 0.022 : 0.038)));
      hero.style.setProperty("--hero-scroll-opacity", String(1 - progress * (compact ? 0.24 : 0.42)));
      hero.style.setProperty("--hero-scroll-shift", `${progress * -12}px`);
      hero.style.setProperty("--hero-media-shift", `${progress * (compact ? 8 : 18)}px`);
    };

    const animateHeroMotion = (time: number) => {
      const elapsed = Math.min(Math.max(time - lastFrameTime, 0), 64);
      lastFrameTime = time;
      const smoothing = 1 - Math.exp(-elapsed / 190);

      currentProgress += (targetProgress - currentProgress) * smoothing;

      if (Math.abs(targetProgress - currentProgress) < 0.0004) {
        currentProgress = targetProgress;
      }

      renderHeroMotion(currentProgress);

      if (currentProgress !== targetProgress) {
        frame = requestAnimationFrame(animateHeroMotion);
      } else {
        frame = 0;
      }
    };

    const scheduleHeroMotion = () => {
      targetProgress = readProgress();
      if (frame) return;
      lastFrameTime = performance.now();
      frame = requestAnimationFrame(animateHeroMotion);
    };

    renderHeroMotion(currentProgress);
    window.addEventListener("scroll", scheduleHeroMotion, { passive: true });
    window.addEventListener("resize", scheduleHeroMotion);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleHeroMotion);
      window.removeEventListener("resize", scheduleHeroMotion);
    };
  }, [reducedMotion]);

  function openAuth(view: "choice" | "login") {
    setAuthView(view);
    setAuthOpen(true);
    setMobileMenuOpen(false);
  }

  return (
    <div className="public-landing min-h-screen bg-background text-foreground transition-colors duration-300">
      <ThemeCursor />
      <AuthEntryModal
        key={`${authView}-${authOpen}`}
        open={authOpen}
        initialView={authView}
        brandLogoSrc="/brand/nutriverse-public-logo.png"
        onClose={() => setAuthOpen(false)}
      />
      <Suspense fallback={null}>
        <AuthStatusNotice onLogin={() => openAuth("choice")} />
      </Suspense>
      {/* Background radial gradient animations */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand/10 blur-[80px] animate-[float_12s_ease-in-out_infinite]" />
        <div className="absolute right-0 top-40 h-[450px] w-[450px] rounded-full bg-sky/5 blur-[100px] animate-[float_16s_ease-in-out_infinite]" style={{ animationDelay: "1s" }} />
      </div>

      <header
        className={`public-floating-header fixed inset-x-0 top-2 z-50 mx-auto w-[calc(100%-1rem)] max-w-[80rem] overflow-hidden rounded-[1.75rem] border transition-all duration-300 animate-slide-down-nav sm:top-3 sm:w-[calc(100%-1.5rem)] sm:rounded-[2rem] ${headerElevated ? "is-elevated" : ""}`}
      >
        <nav className="container-app relative flex h-[4.75rem] min-w-0 items-center justify-between gap-1.5 sm:gap-3">
          <Logo />
          <div className="public-nav-shell hidden items-center gap-0.5 rounded-full border p-1 text-sm font-semibold text-muted-foreground lg:flex lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
            <a href="#cara-kerja" className="public-nav-link">Cara kerja</a>
            <a href="#fitur" className="public-nav-link">Fitur</a>
            <a href="#chps" className="public-nav-link">CHPS</a>
            <a href="#keamanan" className="public-nav-link">Privasi</a>
            <a href="#faq" className="public-nav-link">FAQ</a>
            <Link href="/bantuan" className="public-nav-link">Bantuan</Link>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button onClick={toggleTheme} className="hidden h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-foreground min-[430px]:grid" aria-label="Ganti tema">
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
                <button onClick={() => openAuth("choice")} className="btn btn-primary btn-sm px-3 font-bold shadow-soft transition hover:scale-105 active:scale-98">Mulai<span className="hidden min-[390px]:inline"> gratis</span> <ArrowRight className="h-4 w-4" /></button>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-card/90 text-foreground shadow-sm transition hover:border-brand/30 hover:text-brand lg:hidden"
              aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="public-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
        {mobileMenuOpen && (
          <div id="public-mobile-menu" className="max-h-[calc(100vh-6.5rem)] overflow-y-auto border-t border-line/60 bg-background/86 backdrop-blur-2xl lg:hidden">
            <div className="container-app grid gap-1.5 py-3 text-sm font-semibold text-foreground">
              {[
                ["Cara kerja", "#cara-kerja"],
                ["Fitur", "#fitur"],
                ["CHPS", "#chps"],
                ["Privasi & keamanan", "#keamanan"],
                ["FAQ", "#faq"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl border border-transparent px-4 py-3 transition hover:border-brand/10 hover:bg-brand-soft/65 hover:text-brand"
                >
                  {label}
                </a>
              ))}
              <Link href="/bantuan" onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-transparent px-4 py-3 transition hover:border-brand/10 hover:bg-brand-soft/65 hover:text-brand">
                Pusat bantuan
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-left transition hover:border-brand/10 hover:bg-brand-soft/65 hover:text-brand min-[430px]:hidden"
              >
                <span>{dark ? "Gunakan tema terang" : "Gunakan tema gelap"}</span>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              {!session && (
                <button type="button" onClick={() => openAuth("login")} className="mt-2 btn btn-outline w-full sm:hidden">
                  Masuk ke akun
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <div aria-hidden="true" className="h-24 sm:h-[6.5rem]" />

      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 grid-dots opacity-25" />
          <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-brand/10 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-sky/7 blur-3xl" />
        </div>
        <div ref={heroMotionRef} className="public-hero-scroll container-app grid items-center gap-12 pb-14 pt-10 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="public-hero-copy">
            <span className="eyebrow max-w-full select-none text-[10px] tracking-[0.1em] sm:text-xs"><Sparkles className="h-3.5 w-3.5" /> Perjalanan sehat lebih menarik</span>
            <h1 className="mt-5 max-w-2xl font-display text-[2.45rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-foreground min-[430px]:text-[2.75rem] sm:text-5xl lg:text-6xl">
              Bangun kebiasaan sehat dengan <span className="bg-gradient-to-r from-brand via-brand-bright to-[#0d9488] bg-clip-text text-transparent">progres</span> yang terasa nyata.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              NutriVerse mengubah aktivitas, nutrisi, dan konsistensi menjadi perjalanan yang mudah dipahami—dengan progres, tantangan, komunitas, dan reward yang transparan.
            </p>
            <div className="mt-7 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 sm:flex sm:flex-wrap">
              {session ? (
                <Link href="/dashboard" className="btn btn-primary btn-lg font-bold shadow-soft">Lanjutkan progres <ArrowRight className="h-[18px] w-[18px]" /></Link>
              ) : (
                <button onClick={() => openAuth("choice")} className="btn btn-primary btn-lg w-full font-bold shadow-soft transition hover:scale-[1.02] active:scale-98 min-[390px]:w-auto">Mulai gratis <ArrowRight className="h-[18px] w-[18px]" /></button>
              )}
              <a href="#cara-kerja" className="btn btn-outline btn-lg w-full bg-card/45 font-bold backdrop-blur-sm transition hover:bg-secondary min-[390px]:w-auto"><Play className="h-[18px] w-[18px]" /> Lihat cara kerja</a>
            </div>
            <ul className="mt-7 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3 sm:text-sm">
              <li className="flex items-center gap-2 rounded-xl border border-line/70 bg-card/55 px-3 py-2.5 backdrop-blur-sm"><Check className="h-4 w-4 shrink-0 text-brand" /> 9 tier progres</li>
              <li className="flex items-center gap-2 rounded-xl border border-line/70 bg-card/55 px-3 py-2.5 backdrop-blur-sm"><ShieldCheck className="h-4 w-4 shrink-0 text-brand" /> Validasi server</li>
              <li className="flex items-center gap-2 rounded-xl border border-line/70 bg-card/55 px-3 py-2.5 backdrop-blur-sm"><Smartphone className="h-4 w-4 shrink-0 text-brand" /> Browser & PWA</li>
            </ul>
          </div>
          <div className="public-hero-visual">
            <div className="public-hero-media-layer">
              <PreviewCard reducedMotion={reducedMotion} />
            </div>
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

      <ScrollReveal motion="slide-left">
        <section id="cara-kerja" className="container-app py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Cara kerja</span>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">Sehat yang terasa seperti naik rank</h2>
            <p className="mt-4 text-muted-foreground leading-normal">Tiga langkah sederhana, satu lingkaran motivasi yang terus berputar.</p>
          </div>
          <div className="mt-9 grid gap-4 sm:mt-12 md:grid-cols-3 md:gap-5">
            <ScrollReveal delay={0} className="h-full"><StepCard n="01" accent="brand" icon={<Activity className="h-6 w-6" />} title="Mulai dari langkah kecil" desc="Pilih jalan, lari, atau bersepeda. NutriVerse meminta izin lokasi hanya ketika kamu memulai sesi aktivitas." /></ScrollReveal>
            <ScrollReveal delay={100} className="h-full"><StepCard n="02" accent="sky" icon={<ShieldCheck className="h-6 w-6" />} title="Aktivitas diperiksa" desc="Data waktu, jarak, pace, dan pola perpindahan diperiksa di server agar progres kompetitif tetap lebih adil." /></ScrollReveal>
            <ScrollReveal delay={200} className="h-full"><StepCard n="03" accent="amber" icon={<Trophy className="h-6 w-6" />} title="Lihat progresmu bertumbuh" desc="Aktivitas yang lolos validasi dapat menggerakkan XP, HP, challenge, badge, tier, dan pencapaianmu." /></ScrollReveal>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal motion="slide-right">
        <section id="fitur" className="scroll-mt-24 border-y border-line/60 bg-card/35 py-16 sm:py-20">
          <div className="container-app">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <span className="eyebrow"><Smartphone className="h-3.5 w-3.5" /> Satu aplikasi, satu perjalanan</span>
                <h2 className="mt-4 max-w-xl font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Fitur yang saling terhubung, bukan sekadar kumpulan angka.
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:justify-self-end">
                Dari aktivitas sampai nutrisi, NutriVerse menyusun setiap interaksi sebagai bagian dari perjalanan sehat yang jelas. Pengguna selalu dapat memahami apa yang terjadi, mengapa progres berubah, dan langkah kecil apa yang bisa dilakukan berikutnya.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {PUBLIC_FEATURES.map((feature, index) => (
                <ScrollReveal key={feature.title} delay={index * 90} className="h-full">
                  <PublicFeatureCard feature={feature} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal motion="scale">
        <section id="chps" className="container-app scroll-mt-24 py-16 sm:py-20">
          <div className="overflow-hidden rounded-[1.75rem] border border-line bg-gradient-to-br from-card via-card to-brand-soft/35 shadow-soft sm:rounded-[2rem]">
            <div className="grid gap-8 p-5 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:p-12">
              <div>
                <span className="eyebrow">Competitive Health Progression System</span>
                <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  CHPS membuat progres terasa adil dan mudah dipahami.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  CHPS memisahkan pencapaian jangka panjang dari poin yang dapat digunakan. Karena itu, kamu tetap mempertahankan level ketika memakai Health Points untuk reward yang tersedia.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="pill bg-brand-soft text-brand">C · Competitive</span>
                  <span className="pill bg-brand-soft text-brand">H · Health</span>
                  <span className="pill bg-brand-soft text-brand">P · Progression</span>
                  <span className="pill bg-brand-soft text-brand">S · System</span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-line bg-background/75 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky/10 text-sky"><Trophy className="h-5 w-5" /></span>
                    <span className="text-2xl font-extrabold text-sky">XP</span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-extrabold">Jejak pencapaian</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Mendukung level, tier, badge, dan posisi leaderboard. XP tidak digunakan untuk transaksi reward.</p>
                </div>
                <div className="rounded-3xl border border-line bg-background/75 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber/15 text-amber"><Gift className="h-5 w-5" /></span>
                    <span className="text-2xl font-extrabold text-amber">HP</span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-extrabold">Poin yang dapat digunakan</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Health Points dapat dipakai untuk reward yang tersedia tanpa mengurangi XP, tier, atau pencapaianmu.</p>
                </div>
                <div className="rounded-3xl border border-brand/20 bg-brand-soft/45 p-5 sm:col-span-2 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand text-white"><ShieldCheck className="h-6 w-6" /></span>
                    <div>
                      <h3 className="font-display text-base font-extrabold text-foreground">Progres kompetitif hanya setelah validasi</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Aktivitas mencurigakan tetap dapat tersimpan di riwayat personal, tetapi tidak otomatis memperoleh progres kompetitif.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal motion="slide-left">
        <section id="keamanan" className="relative scroll-mt-24 overflow-hidden border-y border-brand/10 bg-gradient-to-br from-brand-soft/65 via-background to-sky/5 py-16 text-foreground sm:py-20">
          <div aria-hidden className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-sky/8 blur-3xl" />
          <div className="container-app grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <span className="eyebrow">
                <LockKeyhole className="h-3.5 w-3.5" /> Kepercayaan sejak interaksi pertama
              </span>
              <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Data kesehatan perlu dijelaskan, bukan disembunyikan di balik istilah teknis.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                NutriVerse menampilkan tujuan penggunaan lokasi, status validasi aktivitas, serta batas informasi kesehatan dengan bahasa yang dapat dipahami pengguna.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [MapPin, "GPS sesuai izin", "Lokasi digunakan saat sesi aktivitas aktif dan dihentikan ketika sesi selesai atau dibatalkan."],
                [ShieldCheck, "Status yang transparan", "Pengguna dapat melihat apakah aktivitas terverifikasi, masih diproses, perlu ditinjau, atau tidak lolos."],
                [LockKeyhole, "Privasi berdasarkan kebutuhan", "Koordinat mentah dan data kesehatan privat tidak ditampilkan pada komunitas atau leaderboard publik."],
                [HeartPulse, "Batas nonmedis", "Nora, Health Pulse, dan informasi nutrisi tidak digunakan untuk diagnosis atau menggantikan tenaga kesehatan."],
              ].map(([Icon, title, description], index) => (
                <ScrollReveal key={String(title)} delay={index * 90} className="h-full">
                  <article className="h-full rounded-3xl border border-brand/10 bg-card/75 p-5 shadow-soft backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-brand/25 sm:p-6">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon className="h-5 w-5" /></span>
                    <h3 className="mt-4 font-display text-base font-extrabold text-foreground">{String(title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{String(description)}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal motion="rise" className="tier-section-reveal">
        <section id="tier" className="relative overflow-hidden py-16 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grid-dots opacity-40" />
          <div className="container-app">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Sistem progresi CHPS</span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                Sembilan tier. Satu tujuan: jadi <span className="bg-gradient-to-r from-[#fb7185] via-[#f43f5e] to-[#e11d48] bg-clip-text text-transparent">Legend</span>.
              </h2>
              <p className="mt-4 text-muted-foreground leading-normal">Setiap season sebagian XP direset. Konsistensi — bukan grinding sesaat — yang membawamu naik.</p>
            </div>
            <div className="tier-progression-grid mt-9 grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:mt-12 md:grid-cols-9">
              {TIERS.map((t, index) => (
                <ScrollReveal key={t.slug} motion="tier-step" delay={index * 130} className="tier-reveal h-full">
                  <div className="tier-card card card-hover flex min-h-36 h-full flex-col items-center justify-center gap-1.5 border-line bg-card p-3 text-center duration-200 hover:scale-105 sm:min-h-40">
                    <span className="tier-crest">
                      <RankCrest id={t.slug} tier={t.slug} from={t.from} to={t.to} size={52} />
                    </span>
                    <p className="font-display text-sm font-bold leading-none text-foreground">{t.name}</p>
                    <p className="rounded-full bg-secondary/75 px-2 py-0.5 text-[10px] font-bold leading-none text-muted-foreground">{TIER_EMBLEM_NAMES[t.slug]}</p>
                    <p className="stat-num text-[11px] text-muted-foreground">{t.xp} XP</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal motion="slide-right">
        <section id="faq" className="container-app scroll-mt-24 py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <span className="eyebrow">Pertanyaan populer</span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Kenali NutriVerse sebelum memulai.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Jawaban singkat tentang progres, GPS, nutrisi, reward, dan batas penggunaan aplikasi.
              </p>
              <Link href="/bantuan" className="btn btn-outline mt-6 font-bold">
                Buka pusat bantuan <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {PUBLIC_FAQS.map((item, index) => (
                <ScrollReveal key={item.question} delay={Math.min(index * 55, 220)}>
                  <FaqItem item={item} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal motion="scale">
        <section id="tentang" className="relative overflow-hidden border-y border-line/60 bg-card/35 py-16 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-brand/7 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-amber/7 blur-3xl" />

          <div className="container-app relative">
            <div className="max-w-4xl">
              <span className="eyebrow">Dikembangkan oleh Tim KOSEK</span>
            </div>

            <div className="mt-5 grid gap-4 overflow-hidden rounded-[1.75rem] border border-line/80 bg-gradient-to-br from-background/95 via-background/85 to-brand-soft/25 p-4 shadow-soft backdrop-blur-sm sm:mt-6 sm:p-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-5 lg:rounded-[2rem]">
              <div className="group flex min-w-0 items-center gap-4 rounded-2xl border border-brand/10 bg-card/55 p-3 sm:p-4 lg:min-h-28">
                <span className="grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-[1.35rem] border border-brand/15 bg-white p-2 shadow-sm transition duration-500 group-hover:-translate-y-0.5 group-hover:shadow-soft sm:h-20 sm:w-20">
                  <Image
                    src="/brand/nutriverse-mark-ofc-v2.png"
                    alt="Logo NutriVerse"
                    width={1536}
                    height={1536}
                    className="h-full w-full object-contain"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand">Produk inovasi digital</p>
                  <p className="mt-1 truncate font-display text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">NutriVerse</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">Kesehatan Orang Sekarang</p>
                </div>
              </div>

              <div className="flex items-center gap-3 lg:flex-col lg:gap-2" aria-hidden="true">
                <span className="h-px flex-1 bg-line lg:h-8 lg:w-px lg:flex-none" />
                <span className="shrink-0 rounded-full border border-line bg-card px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Dari</span>
                <span className="h-px flex-1 bg-line lg:h-8 lg:w-px lg:flex-none" />
              </div>

              <div className="group flex min-w-0 items-center gap-4 rounded-2xl border border-[#6b007b]/10 bg-card/55 p-3 sm:p-4 lg:min-h-28">
                <span className="grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-[1.35rem] border border-[#6b007b]/10 bg-white p-2.5 shadow-sm transition duration-500 group-hover:-translate-y-0.5 group-hover:shadow-soft sm:h-20 sm:w-20">
                  <Image
                    src="/brand/amikom-yogyakarta.png"
                    alt="Logo Universitas AMIKOM Yogyakarta"
                    width={200}
                    height={200}
                    className="h-full w-full object-contain"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7a0a83] dark:text-[#d995e0]">Institusi pendidikan</p>
                  <p className="mt-1 font-display text-base font-extrabold leading-tight text-foreground sm:text-lg">Universitas AMIKOM Yogyakarta</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">Ruang tumbuh inovasi mahasiswa</p>
                </div>
              </div>
            </div>

            <div className="mt-9 grid gap-7 sm:mt-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-4xl">
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Kesehatan Orang Sekarang, dari Universitas AMIKOM Yogyakarta.
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  NutriVerse dikembangkan sebagai inovasi mahasiswa yang menggabungkan pengalaman pengguna, sistem informasi kesehatan, gamifikasi, validasi aktivitas, dan pendampingan nonmedis dalam satu produk digital.
                </p>
              </div>
              <div className="grid gap-3 min-[430px]:grid-cols-2 lg:flex lg:justify-end">
                <Link href="/bantuan" className="btn btn-outline w-full font-bold lg:w-auto">Dokumentasi pengguna</Link>
                <a href="#cara-kerja" className="btn btn-ghost w-full border border-line font-bold lg:w-auto">Lihat alur produk</a>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal motion="rise">
        <section id="mulai" className="container-app scroll-mt-24 py-16 sm:py-20">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#047857] via-brand to-[#0d9488] px-5 py-12 text-center text-white shadow-lift sm:rounded-[2rem] sm:px-16 sm:py-14">
            <div aria-hidden className="absolute inset-0 grid-dots opacity-20" />
            <div className="relative mx-auto max-w-xl space-y-4">
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Siap memulai pendakianmu?</h2>
              <p className="text-white/90 leading-relaxed text-sm sm:text-base">Mulai dari satu aktivitas sederhana, pahami progresmu, dan bangun kebiasaan sehat tanpa tekanan.</p>
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
        <div className="container-app grid grid-cols-2 gap-x-5 gap-y-10 py-12 sm:gap-x-8 sm:py-14 md:grid-cols-4">
          <div className="col-span-2 space-y-4 md:col-span-1">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground leading-normal">Platform perjalanan sehat berbasis gamifikasi, dikembangkan oleh Tim KOSEK.</p>
            <span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand">Progressive Web App</span>
          </div>
          <FooterCol title="Produk" links={[
            { label: "Cara kerja", href: "#cara-kerja" },
            { label: "Fitur utama", href: "#fitur" },
            { label: "CHPS & tier", href: "#chps" },
            { label: "FAQ", href: "#faq" },
          ]} />
          <FooterCol title="Kepercayaan" links={[
            { label: "Privasi & GPS", href: "#keamanan" },
            { label: "Validasi aktivitas", href: "#chps" },
            { label: "Batas nonmedis", href: "#faq" },
            { label: "Pusat bantuan", href: "/bantuan" },
          ]} />
          <FooterCol title="Tentang" links={[
            { label: "Tim KOSEK", href: "#tentang" },
            { label: "Universitas AMIKOM", href: "#tentang" },
            { label: "Mulai NutriVerse", href: "#mulai" },
          ]} />
        </div>
        <div className="border-t border-line/45">
          <div className="container-app flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
            <p>&copy; 2026 NutriVerse &middot; Tim KOSEK</p>
            <p>Universitas AMIKOM Yogyakarta &middot; Informasi kesehatan nonmedis</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
