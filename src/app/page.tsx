import Link from "next/link";
import { Leaf, ArrowRight, Play, Check, Trophy, Flame, ScanLine, Activity } from "lucide-react";
import { RankCrest } from "@/components/brand/RankCrest";

const TIERS = [
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
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-lime text-white shadow-lg shadow-brand/30">
        <Leaf className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight">
        Nutri<span className="text-brand">Verse</span>
      </span>
    </Link>
  );
}

function HealthRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center">
      <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
        <defs>
          <linearGradient id="heroRing" x1="0" y1="0" x2="92" y2="92">
            <stop stopColor="var(--brand-bright)" />
            <stop offset="1" stopColor="var(--lime)" />
          </linearGradient>
        </defs>
        <circle cx="46" cy="46" r={r} fill="none" stroke="var(--secondary)" strokeWidth="8" />
        <circle cx="46" cy="46" r={r} fill="none" stroke="url(#heroRing)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div className="absolute text-center">
        <p className="stat-num text-2xl leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground">Health</p>
      </div>
    </div>
  );
}

function MacroBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="stat-num text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function PreviewCard() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/25 to-sky/15 blur-2xl" />
      <div className="absolute -right-3 -top-5 z-10 flex items-center gap-2 rounded-2xl border border-line bg-card px-3 py-2 shadow-lift">
        <RankCrest id="hero" from="#7dd3fc" to="#0ea5e9" size={30} />
        <div className="leading-tight">
          <p className="text-[10px] font-medium text-muted-foreground">Tier</p>
          <p className="font-display text-sm font-bold">Radiant</p>
        </div>
      </div>
      <div className="card card-pad">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand to-lime font-display font-bold text-white">RA</div>
          <div className="flex-1">
            <p className="font-display font-bold leading-tight">Rafi Adiputra</p>
            <p className="text-xs text-muted-foreground">Level konsistensi tinggi</p>
          </div>
          <span className="pill bg-amber/15 text-amber"><Flame className="h-3.5 w-3.5" /> 12</span>
        </div>
        <div className="mt-5 flex items-center gap-5">
          <HealthRing value={86} />
          <div className="flex-1 space-y-2.5">
            <MacroBar label="Protein" pct={72} color="var(--brand)" />
            <MacroBar label="Karbohidrat" pct={54} color="var(--lime)" />
            <MacroBar label="Lemak" pct={38} color="var(--amber)" />
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-secondary p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">XP dari aktivitas minggu ini</p>
            <p className="stat-num text-sm text-brand">+1.240</p>
          </div>
          <div className="mt-3 flex h-16 items-end gap-1.5">
            {[40, 65, 52, 80, 48, 92, 70].map((h, i) => (
              <div key={i} className="flex-1 rounded-md bg-gradient-to-t from-brand to-brand-bright" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">Radiant</span>
            <span className="text-muted-foreground">1.550 XP menuju Peak</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-gradient-to-r from-sky to-brand" style={{ width: "68%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({ n, icon, title, desc, accent }: { n: string; icon: React.ReactNode; title: string; desc: string; accent: "brand" | "sky" | "amber" }) {
  const map: Record<string, string> = {
    brand: "text-brand bg-brand-soft",
    sky: "text-sky bg-sky/10",
    amber: "text-amber bg-amber/15",
  };
  return (
    <div className="card card-pad card-hover relative overflow-hidden">
      <span className="absolute right-4 top-2 font-display text-6xl font-extrabold text-line/60">{n}</span>
      <div className={`relative grid h-12 w-12 place-items-center rounded-2xl ${map[accent]}`}>{icon}</div>
      <h3 className="relative mt-4 font-display text-lg font-bold">{title}</h3>
      <p className="relative mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="font-display text-sm font-bold">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l}><a href="#" className="text-sm text-muted-foreground transition hover:text-brand">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-background/80 backdrop-blur-xl">
        <nav className="container-app flex h-16 items-center justify-between">
          <Logo />
          <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#cara-kerja" className="transition hover:text-foreground">Cara kerja</a>
            <a href="#tier" className="transition hover:text-foreground">Tier & liga</a>
            <a href="#" className="transition hover:text-foreground">Reward</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="btn btn-ghost btn-sm hidden sm:inline-flex">Masuk</Link>
            <Link href="/dashboard" className="btn btn-primary btn-sm">Mulai gratis <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
          <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-sky/10 blur-3xl" />
          <div className="absolute inset-0 grid-dots opacity-60" />
        </div>
        <div className="container-app grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="eyebrow"><Trophy className="h-3.5 w-3.5" /> Kompetisi kesehatan kampus</span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Ubah kebiasaan sehat jadi <span className="bg-gradient-to-r from-brand via-brand-bright to-lime bg-clip-text text-transparent">peringkat</span> yang dibanggakan.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Lari, bersepeda, dan pola makanmu berubah jadi XP, tier, dan reward nyata. NutriVerse membuat hidup sehat terasa seperti menaikkan rank di game favoritmu.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn btn-primary btn-lg">Mulai gratis <ArrowRight className="h-[18px] w-[18px]" /></Link>
              <a href="#cara-kerja" className="btn btn-outline btn-lg"><Play className="h-[18px] w-[18px]" /> Lihat cara kerja</a>
            </div>
            <ul className="mt-8 flex flex-col gap-2.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" /> 9 tier liga, Sprout hingga Legend</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" /> XP hanya dari aktivitas nyata</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" /> Tanpa install, buka di browser</li>
            </ul>
          </div>
          <div className="animate-scale-in"><PreviewCard /></div>
        </div>
      </section>

      <section id="cara-kerja" className="container-app py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Cara kerja</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Sehat yang terasa seperti naik rank</h2>
          <p className="mt-4 text-muted-foreground">Tiga langkah sederhana, satu lingkaran motivasi yang terus berputar.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <StepCard n="01" accent="brand" icon={<ScanLine className="h-6 w-6" />} title="Scan makananmu" desc="Kamera mengenali kalori dan gizi, lalu menyarankan berapa menit lari untuk membakarnya. Murni informasi — tidak menambah XP." />
          <StepCard n="02" accent="sky" icon={<Activity className="h-6 w-6" />} title="Gerak, lacak lewat GPS" desc="Tekan mulai, GPS melacak jarak dan waktu lari atau bersepeda. Hanya aktivitas nyata yang menghasilkan XP, tervalidasi anti-cheat." />
          <StepCard n="03" accent="amber" icon={<Trophy className="h-6 w-6" />} title="Naik tier & tukar reward" desc="XP menaikkan ligamu di leaderboard. Kumpulkan Health Points, lalu tukar jadi reward nyata dari mitra." />
        </div>
      </section>

      <section id="tier" className="relative overflow-hidden py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grid-dots opacity-40" />
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Sistem progresi CHPS</span>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Sembilan tier. Satu tujuan: jadi <span className="bg-gradient-to-r from-amber to-destructive bg-clip-text text-transparent">Legend</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">Setiap season sebagian XP direset. Konsistensi — bukan grinding sesaat — yang membawamu naik.</p>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-3 md:grid-cols-9">
            {TIERS.map((t) => (
              <div key={t.slug} className="card card-hover flex flex-col items-center gap-2 p-3 text-center">
                <RankCrest id={t.slug} from={t.from} to={t.to} size={44} />
                <p className="font-display text-sm font-bold leading-none">{t.name}</p>
                <p className="stat-num text-[11px] text-muted-foreground">{t.xp} XP</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-app py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand to-lime px-8 py-14 text-center text-white shadow-lift sm:px-16">
          <div aria-hidden className="absolute inset-0 grid-dots opacity-20" />
          <div className="relative mx-auto max-w-xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Siap memulai pendakianmu?</h2>
            <p className="mt-3 text-white/90">Gratis untuk mahasiswa. Buat akun, catat aktivitas pertamamu, dan rebut posisi di leaderboard kampus.</p>
            <div className="mt-7 flex justify-center">
              <Link href="/dashboard" className="btn btn-lg bg-white text-brand hover:bg-white/90">Buat akun gratis <ArrowRight className="h-[18px] w-[18px]" /></Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="container-app grid gap-10 py-14 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">Platform kesehatan gamified oleh tim KOSEK untuk AMICTA 2026.</p>
          </div>
          <FooterCol title="Produk" links={["Cara kerja", "Tier & liga", "Reward", "Komunitas"]} />
          <FooterCol title="Tim" links={["Tentang KOSEK", "AMIKOM Yogyakarta", "Kontak"]} />
          <FooterCol title="Sumber" links={["Dokumentasi", "Panduan tim", "Privasi"]} />
        </div>
        <div className="border-t border-line">
          <div className="container-app flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
            <p>&copy; 2026 NutriVerse &middot; Tim KOSEK</p>
            <p>Dibuat untuk AMICTA 2026 &middot; Universitas AMIKOM Yogyakarta</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
