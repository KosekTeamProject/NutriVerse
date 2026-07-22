"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BellRing, Bike, Cake, Check, Eye, EyeOff, Footprints, LockKeyhole, Mail, Ruler, ShieldCheck, Sparkles, Target, User, Weight } from "lucide-react";
import { saveAuthSession, type HealthBaseline } from "@/features/auth/session";
import { useCompanionName } from "@/hooks/useCompanionName";
import { BrandLogo } from "@/components/brand/BrandLogo";

const GENDERS = ["Laki-laki", "Perempuan"] as const;
const GOALS = [
  { value: "Menurunkan berat", title: "Turun berat secara sehat", description: "Bangun konsistensi gerak dan pola makan tanpa hukuman." },
  { value: "Menjaga berat", title: "Menjaga kondisi", description: "Pertahankan ritme sehat yang sudah berjalan." },
  { value: "Menambah massa", title: "Membangun kekuatan", description: "Seimbangkan aktivitas, nutrisi, dan pemulihan." },
  { value: "Lebih bugar", title: "Lebih aktif dan bugar", description: "Mulai dari gerakan sederhana yang bisa diulang." },
] as const;
const ACTIVITY_LEVELS = [
  { label: "Jarang bergerak", value: "sedentary", multiplier: 1.2 },
  { label: "Aktivitas ringan", value: "light", multiplier: 1.375 },
  { label: "Cukup aktif", value: "moderate", multiplier: 1.55 },
  { label: "Sangat aktif", value: "active", multiplier: 1.725 },
];
const PREFERRED_ACTIVITIES = [
  { label: "Jalan", icon: Footprints },
  { label: "Lari", icon: Target },
  { label: "Bersepeda", icon: Bike },
] as const;
const STEP_LABELS = ["Akun", "Tujuan", "Baseline", "Pendamping"];

function Choice({ options, value, onChange }: { readonly options: readonly string[]; readonly value: string; readonly onChange: (value: string) => void }) {
  return <div className="flex flex-wrap gap-2">{options.map((option) => <button type="button" key={option} onClick={() => onChange(option)} className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${value === option ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{option}</button>)}</div>;
}

export default function OnboardingPage() {
  const { setDisplayName } = useCompanionName();
  const [step, setStep] = useState(1);
  const [finished, setFinished] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [provider, setProvider] = useState<"password" | "google">("password");
  const [account, setAccount] = useState({ name: "", email: "", password: "" });
  const [health, setHealth] = useState({ height: "", weight: "", age: "", gender: "", goal: "", activity: "" });
  const [preferredActivities, setPreferredActivities] = useState<string[]>([]);
  const [companionName, setCompanionName] = useState("Nora");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderInterval, setReminderInterval] = useState(60);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const baseline = useMemo<HealthBaseline | null>(() => {
    const heightCm = Number(health.height);
    const weightKg = Number(health.weight);
    const age = Number(health.age);
    if (!heightCm || !weightKg || !age || !health.gender || !health.activity || !health.goal) return null;
    const gender = health.gender as HealthBaseline["gender"];
    const bmr = gender === "Laki-laki" ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5 : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    const multiplier = ACTIVITY_LEVELS.find((level) => level.value === health.activity)?.multiplier ?? 1.2;
    return { heightCm, weightKg, age, gender, goal: health.goal, activityLevel: health.activity, bmi: Number((weightKg / ((heightCm / 100) ** 2)).toFixed(1)), estimatedDailyCalories: Math.round(bmr * multiplier) };
  }, [health]);

  const accountValid = account.name.trim().length >= 2 && account.email.includes("@") && account.password.length >= 8;
  const goalValid = Boolean(health.goal && preferredActivities.length);
  const baselineValid = Boolean(baseline);
  const companionValid = companionName.trim().length >= 2 && privacyAccepted;

  function togglePreferredActivity(activity: string) {
    setPreferredActivities((current) => current.includes(activity) ? current.filter((item) => item !== activity) : [...current, activity]);
  }

  function completeRegistration() {
    if (!baseline || !companionValid) return;
    const cleanCompanion = companionName.trim();
    setDisplayName(cleanCompanion);
    saveAuthSession({
      name: account.name.trim(),
      email: account.email.trim(),
      username: account.email.split("@")[0],
      companionName: cleanCompanion,
      provider,
      baseline,
      preferences: { preferredActivities, reminderEnabled, reminderIntervalMinutes: reminderInterval, privacyAccepted },
      createdAt: new Date().toISOString(),
    });
    setFinished(true);
  }

  function continueWithGoogle() {
    setProvider("google");
    setAccount({ name: "Fathan Mubarak", email: "fathan.mubarak@gmail.com", password: "google-oauth-demo" });
    setStep(2);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-line bg-background/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link href="/" className="transition hover:opacity-90"><BrandLogo /></Link>
          {!finished && <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Langkah {step} dari 4</p><p className="text-xs font-bold text-brand">{STEP_LABELS[step - 1]}</p></div>}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {finished ? (
          <section className="card card-pad text-center sm:p-10">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand"><Check className="h-8 w-8" /></span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-brand">Profil siap</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold">Selamat datang, {account.name.split(" ")[0]}!</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Titik awalmu tersimpan. {companionName.trim()} akan membantu menjaga ritme tanpa mendorong latihan berlebihan.</p>
            <div className="mx-auto mt-6 grid max-w-lg gap-3 text-left sm:grid-cols-3">
              <div className="rounded-2xl bg-secondary p-4"><p className="text-[10px] font-bold text-muted-foreground">BMI AWAL</p><p className="mt-1 font-display text-2xl font-extrabold">{baseline?.bmi}</p></div>
              <div className="rounded-2xl bg-secondary p-4"><p className="text-[10px] font-bold text-muted-foreground">AKTIVITAS PILIHAN</p><p className="mt-1 text-sm font-extrabold">{preferredActivities.join(", ")}</p></div>
              <div className="rounded-2xl bg-secondary p-4"><p className="text-[10px] font-bold text-muted-foreground">PENGINGAT</p><p className="mt-1 text-sm font-extrabold">{reminderEnabled ? `${reminderInterval} menit` : "Nonaktif"}</p></div>
            </div>
            <Link href="/dashboard" className="btn btn-primary mt-7 w-full sm:w-auto">Masuk ke ruang personal <ArrowRight className="h-4 w-4" /></Link>
            <p className="mt-4 text-[10px] text-muted-foreground">Estimasi bukan diagnosis medis. Data baseline dan lokasi privat secara bawaan.</p>
          </section>
        ) : (
          <section className="card overflow-hidden border-line">
            <div className="h-1.5 bg-secondary"><div className="h-full bg-gradient-to-r from-brand to-lime transition-all" style={{ width: `${(step / 4) * 100}%` }} /></div>
            <div className="hidden grid-cols-4 border-b border-line/60 bg-secondary/20 px-8 py-3 sm:grid">{STEP_LABELS.map((label, index) => <div key={label} className={`text-center text-[10px] font-bold ${index + 1 <= step ? "text-brand" : "text-muted-foreground"}`}>{index + 1}. {label}</div>)}</div>
            <div className="p-5 sm:p-8">
              {step === 1 && (
                <div className="space-y-5">
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Buat akun</p><h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Mulai perjalananmu</h1><p className="mt-1 text-sm text-muted-foreground">Identitas ini menyatukan Health Pulse, aktivitas GPS, liga, dan reward.</p></div>
                  <button type="button" onClick={continueWithGoogle} className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm font-bold shadow-sm transition hover:border-brand/35 hover:bg-secondary"><span className="grid h-6 w-6 place-items-center rounded-full bg-white font-sans text-sm font-black text-[#4285F4] shadow-sm">G</span> Daftar dengan Google</button>
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><span className="h-px flex-1 bg-line" /> atau email <span className="h-px flex-1 bg-line" /></div>
                  <div><label htmlFor="register-name" className="label flex items-center gap-2"><User className="h-4 w-4 text-brand" /> Nama lengkap</label><input id="register-name" value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} className="input mt-1.5" autoComplete="name" placeholder="Contoh: Dimas Rofiq" /></div>
                  <div><label htmlFor="register-email" className="label flex items-center gap-2"><Mail className="h-4 w-4 text-brand" /> Email</label><input id="register-email" type="email" value={account.email} onChange={(event) => setAccount({ ...account, email: event.target.value })} className="input mt-1.5" autoComplete="email" placeholder="nama@email.com" /></div>
                  <div><label htmlFor="register-password" className="label flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-brand" /> Kata sandi</label><div className="relative mt-1.5"><input id="register-password" type={showPassword ? "text" : "password"} value={account.password} onChange={(event) => setAccount({ ...account, password: event.target.value })} className="input pr-11" autoComplete="new-password" placeholder="Minimal 8 karakter" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Tampilkan atau sembunyikan kata sandi">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Tujuan & aktivitas</p><h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Apa yang ingin kamu bangun?</h1><p className="mt-1 text-sm text-muted-foreground">Tidak ada target ekstrem. Pilihan ini hanya mengatur prioritas rekomendasi.</p></div>
                  <div className="grid gap-2 sm:grid-cols-2">{GOALS.map((goal) => <button type="button" key={goal.value} onClick={() => setHealth({ ...health, goal: goal.value })} className={`rounded-2xl border p-4 text-left transition ${health.goal === goal.value ? "border-brand bg-brand-soft/55" : "border-line hover:bg-secondary"}`}><p className="text-sm font-bold text-foreground">{goal.title}</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{goal.description}</p></button>)}</div>
                  <div><p className="label">Aktivitas yang kamu sukai</p><p className="mt-1 text-[10px] text-muted-foreground">Pilih satu atau lebih. XP hanya berasal dari aktivitas GPS yang lolos validasi.</p><div className="mt-3 grid grid-cols-3 gap-2">{PREFERRED_ACTIVITIES.map((activity) => { const Icon = activity.icon; const selected = preferredActivities.includes(activity.label); return <button type="button" key={activity.label} onClick={() => togglePreferredActivity(activity.label)} className={`rounded-2xl border p-3 text-center text-xs font-bold transition ${selected ? "border-brand bg-brand text-white" : "border-line bg-card text-muted-foreground"}`}><Icon className="mx-auto mb-2 h-5 w-5" />{activity.label}</button>; })}</div></div>
                  <div className="rounded-2xl border border-brand/20 bg-brand-soft/35 p-4 text-xs leading-relaxed text-muted-foreground"><span className="font-bold text-foreground">Aturan CHPS:</span> pindai makanan hanya memberi informasi gizi. Foto makanan tidak menambah XP.</div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Baseline kesehatan</p><h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Kenali titik awalmu</h1><p className="mt-1 text-sm text-muted-foreground">Dipakai untuk estimasi awal dan dapat diubah nanti dari profil.</p></div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div><label htmlFor="baseline-height" className="label flex items-center gap-1.5"><Ruler className="h-4 w-4 text-brand" /> Tinggi (cm)</label><input id="baseline-height" value={health.height} onChange={(event) => setHealth({ ...health, height: event.target.value })} inputMode="numeric" className="input mt-1.5" placeholder="170" /></div>
                    <div><label htmlFor="baseline-weight" className="label flex items-center gap-1.5"><Weight className="h-4 w-4 text-brand" /> Berat (kg)</label><input id="baseline-weight" value={health.weight} onChange={(event) => setHealth({ ...health, weight: event.target.value })} inputMode="decimal" className="input mt-1.5" placeholder="65" /></div>
                    <div><label htmlFor="baseline-age" className="label flex items-center gap-1.5"><Cake className="h-4 w-4 text-brand" /> Usia</label><input id="baseline-age" value={health.age} onChange={(event) => setHealth({ ...health, age: event.target.value })} inputMode="numeric" className="input mt-1.5" placeholder="21" /></div>
                  </div>
                  <div><p className="label">Jenis kelamin biologis untuk estimasi energi</p><div className="mt-2"><Choice options={GENDERS} value={health.gender} onChange={(gender) => setHealth({ ...health, gender })} /></div></div>
                  <div><p className="label">Tingkat aktivitas harian saat ini</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{ACTIVITY_LEVELS.map((level) => <button type="button" key={level.value} onClick={() => setHealth({ ...health, activity: level.value })} className={`rounded-2xl border p-3 text-left text-xs font-bold transition ${health.activity === level.value ? "border-brand bg-brand-soft text-brand" : "border-line text-muted-foreground hover:bg-secondary"}`}>{level.label}</button>)}</div></div>
                  <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-4 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" /><p>Baseline bersifat privat dan tidak muncul di komunitas atau leaderboard. Estimasi bukan diagnosis medis.</p></div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Pendamping & pengingat</p><h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Atur teman sehatmu</h1><p className="mt-1 text-sm text-muted-foreground">Nama dan ritme pengingat dapat diganti kapan saja.</p></div>
                  <div className="rounded-3xl border border-brand/20 bg-gradient-to-br from-brand-soft/70 to-card p-5 sm:p-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white"><Sparkles className="h-6 w-6" /></span><label htmlFor="companion-name" className="label mt-5">Nama AI Companion</label><input id="companion-name" value={companionName} onChange={(event) => setCompanionName(event.target.value)} maxLength={24} className="input mt-1.5 text-lg font-bold" placeholder="Contoh: Nara" /><p className="mt-3 text-xs leading-relaxed text-muted-foreground">“Halo {account.name.split(" ")[0] || "teman"}, aku <span className="font-bold text-brand">{companionName.trim() || "AI Companion"}</span>. Kita mulai dari satu langkah kecil hari ini.”</p></div>
                  <div className="rounded-2xl border border-line p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><BellRing className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold">Pengingat jeda bergerak</p><p className="text-[10px] text-muted-foreground">Pengingat ramah, tanpa penalti streak atau XP.</p></div><button type="button" onClick={() => setReminderEnabled((value) => !value)} className={`relative h-7 w-12 rounded-full transition ${reminderEnabled ? "bg-brand" : "bg-secondary"}`} aria-pressed={reminderEnabled} aria-label="Aktifkan pengingat jeda"><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${reminderEnabled ? "left-6" : "left-1"}`} /></button></div>{reminderEnabled && <div className="mt-4 flex flex-wrap gap-2">{[60, 90, 120].map((minutes) => <button type="button" key={minutes} onClick={() => setReminderInterval(minutes)} className={`rounded-full px-3 py-2 text-[10px] font-bold ${reminderInterval === minutes ? "bg-brand text-white" : "bg-secondary text-muted-foreground"}`}>Setiap {minutes} menit</button>)}</div>}</div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-secondary/30 p-4"><input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" /><span className="text-xs leading-relaxed text-muted-foreground"><span className="font-bold text-foreground">Saya memahami privasi & aturan progres.</span><br />Tracking lokasi hanya aktif saat aktivitas dimulai. Rute presisi tidak dipublikasikan dan XP hanya diberikan setelah validasi.</span></label>
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button type="button" onClick={() => step === 1 ? history.back() : setStep((current) => current - 1)} className="btn btn-ghost"><ArrowLeft className="h-4 w-4" /> {step === 1 ? "Kembali" : "Sebelumnya"}</button>
                {step < 4 ? <button type="button" disabled={step === 1 ? !accountValid : step === 2 ? !goalValid : !baselineValid} onClick={() => { if (step === 1) setProvider("password"); setStep((current) => current + 1); }} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">Lanjutkan <ArrowRight className="h-4 w-4" /></button> : <button type="button" disabled={!companionValid} onClick={completeRegistration} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">Buat akun & mulai <ArrowRight className="h-4 w-4" /></button>}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
