"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight, 
  Bike, 
  Check, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Footprints, 
  Heart, 
  LockKeyhole, 
  Mail, 
  Moon, 
  Ruler, 
  Sparkles, 
  Target, 
  User, 
  Weight, 
  Compass, 
  Activity, 
  ShieldAlert, 
  Clock, 
  Sun, 
  Sunset,
  Utensils,
  ScanLine,
  HeartPulse
} from "lucide-react";
import { saveAuthSession, type HealthBaseline } from "@/features/auth/session";
import { useCompanionName } from "@/hooks/useCompanionName";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { NoraDialogueBubble, NoraAvatar } from "@/features/companion/components/NoraDialogueBubble";
import { Bot, Ghost, Cat, Bird, Trees } from "lucide-react";

const COMPANION_AVATARS = [
  { id: "sparkles", icon: Sparkles, label: "Sparkles" },
  { id: "bot", icon: Bot, label: "Robot" },
  { id: "ghost", icon: Ghost, label: "Ghost" },
  { id: "cat", icon: Cat, label: "Cat" },
  { id: "bird", icon: Bird, label: "Bird" },
  { id: "trees", icon: Trees, label: "Nature" },
];

// 6 Core Goals (Step 2)
const GOALS_STEP2 = [
  { id: "weight-loss", title: "Menurunkan Berat Badan", desc: "Bangun defisit energi sehat dengan konsistensi gerak & nutrisi.", icon: Weight },
  { id: "muscle-gain", title: "Menambah Massa Otot", desc: "Seimbangkan aktivitas fisik, nutrisi protein, dan waktu tidur.", icon: Activity },
  { id: "healthy-lifestyle", title: "Pola Hidup Sehat", desc: "Tingkatkan stamina, pencernaan, dan kualitas hidup harian.", icon: Heart },
  { id: "more-active", title: "Lebih Aktif Bergerak", desc: "Mulai dari langkah kaki harian yang mudah diulang setiap hari.", icon: Footprints },
  { id: "maintain-weight", title: "Menjaga Berat Badan", desc: "Pertahankan energi dan komposisi tubuh yang ideal.", icon: Target },
  { id: "balanced-life", title: "Hidup Lebih Seimbang", desc: "Harmonikan fisik, mental, hidrasi, dan pemulihan istirahat.", icon: Compass },
] as const;

// Activity Levels (Step 3)
const ACTIVITY_LEVELS = [
  { label: "Jarang Bergerak", sub: "Banyak duduk / minim gerak", value: "sedentary", multiplier: 1.2 },
  { label: "Aktivitas Ringan", sub: "Jalan santai / aktivitas rumah", value: "light", multiplier: 1.375 },
  { label: "Cukup Aktif", sub: "Olahraga 3-4x seminggu", value: "moderate", multiplier: 1.55 },
  { label: "Sangat Aktif", sub: "Olahraga rutin & fisik aktif", value: "active", multiplier: 1.725 },
];

const SLEEP_OPTIONS = ["< 6 Jam", "6 - 7 Jam", "7 - 8 Jam (Ideal)", "> 8 Jam"];
const STEP_GOAL_OPTIONS = [4000, 6000, 8000, 10000];
const ALLERGY_OPTIONS = ["Tidak Ada", "Kacang", "Susu / Dairy", "Seafood", "Gluten / Gandum", "Telur"];
const FAVORITE_FOODS = ["Salad & Sayuran", "Ayam & Daging Panggang", "Smoothie & Buah", "Oatmeal & Biji-bijian", "Sup & Makanan Berkuah", "Ikan & Seafood"];

const FAVORITE_ACTIVITIES = [
  { label: "Jalan Santai", icon: Footprints },
  { label: "Lari / Jogging", icon: Target },
  { label: "Bersepeda", icon: Bike },
  { label: "Workout / Gym", icon: Activity },
  { label: "Yoga & Stretching", icon: Heart },
];

const WORKOUT_TIMES = [
  { label: "Pagi Hari (06:00 - 09:00)", icon: Sun },
  { label: "Siang Hari (11:00 - 14:00)", icon: Clock },
  { label: "Sore Hari (15:00 - 18:00)", icon: Sunset },
  { label: "Malam Hari (19:00 - 21:00)", icon: Moon },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setDisplayName } = useCompanionName();
  
  // Registration vs Onboarding Step State
  // 0 = Account Registration Form
  // 1 = Welcome Screen (Nora)
  // 2 = Kenali Tujuanmu
  // 3 = Target Awal
  // 4 = Preferensi
  // 5 = Guided Discovery (Pillar 1: Health Pulse)
  // 6 = Guided Discovery (Pillar 2: Activity)
  // 7 = Guided Discovery (Pillar 3: Food Scanner)
  // 8 = Ready Screen
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [showPassword, setShowPassword] = useState(false);
  const [provider, setProvider] = useState<"password" | "google">("password");
  const [oauthError, setOauthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Chat typing states for navigation delay
  const [noraTyping, setNoraTyping] = useState(false);

  // Account Data
  const [account, setAccount] = useState({ name: "", email: "", password: "" });
  const [companionData, setCompanionData] = useState({ name: "Nora", avatarId: "sparkles" });

  // Onboarding Goal & Baseline Data
  const [selectedGoal, setSelectedGoal] = useState<string>("Menurunkan Berat Badan");
  const [healthData, setHealthData] = useState({
    weight: "65",
    targetWeight: "60",
    height: "170",
    age: "23",
    gender: "Laki-laki" as "Laki-laki" | "Perempuan",
    activity: "moderate",
    sleepHours: "7 - 8 Jam (Ideal)",
    stepGoal: 8000
  });

  // Preferences Data
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(["Tidak Ada"]);
  const [selectedFoods, setSelectedFoods] = useState<string[]>(["Salad & Sayuran", "Ayam & Daging Panggang"]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>(["Jalan Santai", "Bersepeda"]);
  const [selectedWorkoutTime, setSelectedWorkoutTime] = useState<string>("Pagi Hari (06:00 - 09:00)");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth") !== "complete") return;

    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          success?: boolean;
          user?: { name?: string; email?: string };
          error?: string;
        };
        if (!response.ok || !result.success || !result.user?.email) {
          throw new Error(result.error ?? "Session Google tidak dapat dibaca.");
        }
        if (cancelled) return;

        setProvider("google");
        setAccount({
          name: result.user.name?.trim() || result.user.email.split("@")[0],
          email: result.user.email,
          password: "google-oauth-session",
        });
        window.history.replaceState(null, "", "/onboarding");
        setNoraTyping(true);
        setOnboardingStep(1);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setOauthError(
            error instanceof Error
              ? error.message
              : "Login Google belum dapat diselesaikan.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Account form validation
  const accountValid = account.name.trim().length >= 2 && account.email.includes("@") && account.password.length >= 8;

  // Calculate baseline BMI & Calories
  const baseline = useMemo<HealthBaseline | null>(() => {
    const heightCm = Number(healthData.height);
    const weightKg = Number(healthData.weight);
    const age = Number(healthData.age);
    if (!heightCm || !weightKg || !age) return null;
    
    const bmr = healthData.gender === "Laki-laki" 
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5 
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    
    const multiplier = ACTIVITY_LEVELS.find((level) => level.value === healthData.activity)?.multiplier ?? 1.375;
    
    return { 
      heightCm, 
      weightKg, 
      targetWeightKg: Number(healthData.targetWeight) || weightKg,
      age, 
      gender: healthData.gender, 
      goal: selectedGoal, 
      activityLevel: healthData.activity, 
      sleepHours: healthData.sleepHours,
      stepGoal: healthData.stepGoal,
      bmi: Number((weightKg / ((heightCm / 100) ** 2)).toFixed(1)), 
      estimatedDailyCalories: Math.round(bmr * multiplier) 
    };
  }, [healthData, selectedGoal]);

  function handleGoogleLogin() {
    window.location.assign("/api/auth/google?next=/onboarding?oauth=complete");
  }

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountValid || submitting) return;
    setSubmitting(true);
    setOauthError("");
    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(account),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        requiresEmailConfirmation?: boolean;
      };
      if (!response.ok || !result.success) throw new Error(result.error || "Pendaftaran gagal.");
      if (result.requiresEmailConfirmation) {
        throw new Error("Akun dibuat. Konfirmasi email terlebih dahulu, lalu masuk untuk melanjutkan onboarding.");
      }
      setProvider("password");
      nextStep(1);
    } catch (registrationError) {
      setOauthError(
        registrationError instanceof Error ? registrationError.message : "Pendaftaran gagal.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function toggleAllergy(allergy: string) {
    if (allergy === "Tidak Ada") {
      setSelectedAllergies(["Tidak Ada"]);
      return;
    }
    const filtered = selectedAllergies.filter(a => a !== "Tidak Ada");
    if (filtered.includes(allergy)) {
      const next = filtered.filter(a => a !== allergy);
      setSelectedAllergies(next.length === 0 ? ["Tidak Ada"] : next);
    } else {
      setSelectedAllergies([...filtered, allergy]);
    }
  }

  function toggleFood(food: string) {
    if (selectedFoods.includes(food)) {
      setSelectedFoods(selectedFoods.filter(f => f !== food));
    } else {
      setSelectedFoods([...selectedFoods, food]);
    }
  }

  function toggleActivity(act: string) {
    if (selectedActivities.includes(act)) {
      setSelectedActivities(selectedActivities.filter(a => a !== act));
    } else {
      setSelectedActivities([...selectedActivities, act]);
    }
  }

  function nextStep(targetStep: number) {
    setNoraTyping(true);
    setOnboardingStep(targetStep);
  }

  async function finishOnboardingAndEnterDashboard() {
    const finalBaseline: HealthBaseline = baseline || {
      heightCm: 170,
      weightKg: 65,
      targetWeightKg: 60,
      age: 23,
      gender: "Laki-laki",
      goal: selectedGoal,
      activityLevel: healthData.activity,
      sleepHours: healthData.sleepHours,
      stepGoal: healthData.stepGoal,
      bmi: 22.5,
      estimatedDailyCalories: 2100
    };

    setSubmitting(true);
    setOauthError("");
    try {
      const response = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: account.name.trim(),
          username: account.email.split("@")[0],
          age: finalBaseline.age,
          gender: finalBaseline.gender,
          heightCm: finalBaseline.heightCm,
          weightKg: finalBaseline.weightKg,
          targetWeightKg: finalBaseline.targetWeightKg,
          healthGoals: finalBaseline.goal,
          activityLevel: finalBaseline.activityLevel,
          dailyStepTarget: finalBaseline.stepGoal,
          dailyCalorieTarget: finalBaseline.estimatedDailyCalories,
          dailySleepTargetHours: Number.parseFloat(finalBaseline.sleepHours ?? "8"),
          preferredActivities: selectedActivities,
          dietaryPreferences: isVegetarian ? ["VEGETARIAN"] : [],
          allergies: selectedAllergies.filter((item) => item !== "Tidak Ada"),
          favoriteFoods: selectedFoods,
          favoriteWorkoutTime: selectedWorkoutTime,
          companionName: companionData.name || "Nora",
          companionAvatarId: companionData.avatarId,
        }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Profil belum dapat disimpan.");
      }

      setDisplayName(companionData.name || "Nora");
    saveAuthSession({
      name: account.name.trim() || "Fathan Mubarak",
      email: account.email.trim() || "fathan.mubarak@gmail.com",
      username: (account.email.split("@")[0]) || "fathan.mubarak",
      companionName: companionData.name || "Nora",
      companionAvatarId: companionData.avatarId,
      provider,
      baseline: finalBaseline,
      preferences: {
        preferredActivities: selectedActivities,
        reminderEnabled: true,
        reminderIntervalMinutes: 60,
        privacyAccepted: true,
        isVegetarian,
        allergies: selectedAllergies,
        favoriteFoods: selectedFoods,
        favoriteWorkoutTime: selectedWorkoutTime
      },
      createdAt: new Date().toISOString(),
      lastLoginTimestamp: Date.now()
    });

    router.replace("/dashboard");
      router.refresh();
    } catch (saveError) {
      setOauthError(saveError instanceof Error ? saveError.message : "Profil belum dapat disimpan.");
    } finally {
      setSubmitting(false);
    }
  }

  // Dynamic Ambient Background based on Step
  const bgStyles = useMemo(() => {
    if (onboardingStep <= 1) return { color1: "bg-brand/10", color2: "bg-lime/10" };
    if (onboardingStep === 2) return { color1: "bg-brand/15", color2: "bg-brand-soft/20" };
    if (onboardingStep === 3) return { color1: "bg-sky/15", color2: "bg-brand/10" };
    if (onboardingStep === 4) return { color1: "bg-amber/15", color2: "bg-lime/15" };
    if (onboardingStep === 5) return { color1: "bg-brand/20", color2: "bg-lime/20" }; // Ready for tour
    return { color1: "bg-brand/10", color2: "bg-lime/10" };
  }, [onboardingStep]);

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden">
      {/* Dynamic Ambient Blur Background */}
      <div className="pointer-events-none fixed inset-0 z-0 transition-colors duration-1000 ease-in-out">
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full ${bgStyles.color1} blur-[140px] transition-all duration-[1.5s] ease-in-out`} />
        <div className={`absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full ${bgStyles.color2} blur-[120px] transition-all duration-[1.5s] ease-in-out`} />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-line/60 bg-background/80 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link href="/" className="transition hover:opacity-90">
            <BrandLogo />
          </Link>
          
          {/* Progress Indicator for Journey */}
          {onboardingStep > 1 && onboardingStep < 5 && (
            <div className="flex items-center gap-1.5 opacity-50">
               {[2,3,4].map(step => (
                 <div key={step} className={`h-1.5 rounded-full transition-all duration-500 ${step === onboardingStep ? "w-6 bg-brand" : step < onboardingStep ? "w-2 bg-brand/50" : "w-2 bg-line"}`} />
               ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12 flex flex-col justify-center">
        
        {/* ========================================================
            ACCOUNT REGISTRATION FORM (STEP 0)
           ======================================================== */}
        {onboardingStep === 0 && (
          <section className="animate-fade-up card overflow-hidden border-line p-6 sm:p-10 shadow-lift">
            <div className="space-y-6">
              <div>
                <span className="eyebrow bg-brand-soft/40 border-brand/20 text-brand">Selamat Datang</span>
                <h1 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl text-foreground">
                  Mulai Perjalanan Sehatmu
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Buat akun untuk menyatukan skor Health Pulse, aktivitas GPS, serta panduan AI Companion Nora.
                </p>
              </div>

              {/* Google Register Button */}
              {oauthError && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {oauthError}
                </p>
              )}
              <button 
                type="button" 
                onClick={handleGoogleLogin} 
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 text-sm font-bold text-foreground shadow-sm transition hover:scale-[1.01] hover:border-brand/40 hover:bg-secondary active:scale-[0.99]"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white font-sans text-sm font-black text-[#4285F4] shadow-sm">G</span> 
                Daftar Langsung dengan Google
              </button>

              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span className="h-px flex-1 bg-line" /> atau buat akun email <span className="h-px flex-1 bg-line" />
              </div>

              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reg-name" className="label flex items-center gap-2">
                    <User className="h-4 w-4 text-brand" /> Nama Lengkap
                  </label>
                  <input 
                    id="reg-name" 
                    value={account.name} 
                    onChange={(e) => setAccount({ ...account, name: e.target.value })} 
                    className="input mt-1.5" 
                    placeholder="Contoh: Fathan Mubarak" 
                    required 
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" className="label flex items-center gap-2">
                    <Mail className="h-4 w-4 text-brand" /> Alamat Email
                  </label>
                  <input 
                    id="reg-email" 
                    type="email" 
                    value={account.email} 
                    onChange={(e) => setAccount({ ...account, email: e.target.value })} 
                    className="input mt-1.5" 
                    placeholder="fathan@example.com" 
                    required 
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" className="label flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-brand" /> Kata Sandi
                  </label>
                  <div className="relative mt-1.5">
                    <input 
                      id="reg-password" 
                      type={showPassword ? "text" : "password"} 
                      value={account.password} 
                      onChange={(e) => setAccount({ ...account, password: e.target.value })} 
                      className="input pr-11" 
                      placeholder="Minimal 8 karakter" 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={!accountValid}
                  className="btn btn-primary mt-6 w-full text-base font-bold disabled:opacity-50"
                >
                  Buat Akun &amp; Mulai Perjalanan <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </section>
        )}

        {/* ========================================================
            STEP 1: WELCOME SCREEN & CUSTOMIZE COMPANION
           ======================================================== */}
        {onboardingStep === 1 && (
          <section className="flex flex-col items-center text-center max-w-lg mx-auto w-full">
            <NoraAvatar size="lg" overrideAvatarId={companionData.avatarId} />
            <NoraDialogueBubble 
              text={`Halo ${account.name.split(" ")[0] || "Teman"} 👋\nAku AI Companion barumu.\nSiapa nama panggilanku yang kamu inginkan?`} 
              isTyping={true}
              onTypingComplete={() => setNoraTyping(false)}
              overrideName={companionData.name}
              subtext="Aku akan mengingat ritmemu, menyemangati tanpa paksaan, dan mendampingi tiap langkah kebaikanmu."
            />
            {!noraTyping && (
              <div className="mt-8 w-full space-y-6 animate-fade-up">
                <div className="text-left space-y-2">
                  <label htmlFor="companion-name" className="label text-brand font-bold">Nama Panggilan AI</label>
                  <input 
                    id="companion-name"
                    value={companionData.name}
                    onChange={(e) => setCompanionData({...companionData, name: e.target.value})}
                    className="input text-center text-lg font-bold"
                    placeholder="Contoh: Nora, Jarvis, Baymax..."
                  />
                </div>
                
                <div className="text-left space-y-2">
                  <label className="label text-brand font-bold">Pilih Avatar</label>
                  <div className="flex flex-wrap justify-center gap-3">
                    {COMPANION_AVATARS.map((avatar) => {
                      const Icon = avatar.icon;
                      const isSelected = companionData.avatarId === avatar.id;
                      return (
                        <button 
                          key={avatar.id}
                          onClick={() => setCompanionData({...companionData, avatarId: avatar.id})}
                          className={`h-12 w-12 rounded-2xl grid place-items-center transition-all ${
                            isSelected ? "bg-brand text-white shadow-md ring-2 ring-brand/30 scale-110" : "bg-card border border-line text-muted-foreground hover:bg-secondary"
                          }`}
                          title={avatar.label}
                        >
                          <Icon className="h-6 w-6" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => nextStep(2)}
                  className="btn btn-primary btn-lg w-full shadow-lift"
                  disabled={!companionData.name.trim()}
                >
                  Simpan &amp; Lanjutkan <ArrowRight className="h-5 w-5 ml-1" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* ========================================================
            STEP 2: KENALI TUJUANMU (CONVERSATIONAL FORM)
           ======================================================== */}
        {onboardingStep === 2 && (
          <section className="space-y-8 max-w-2xl mx-auto w-full">
            <NoraAvatar size="sm" floating={false} pulsing={false} />
            <NoraDialogueBubble 
              text="Setiap langkah besar dimulai dari satu niat kecil.\nApa yang ingin kamu capai bersama NutriVerse saat ini?" 
              isTyping={true}
              onTypingComplete={() => setNoraTyping(false)}
            />

            {!noraTyping && (
              <div className="grid gap-3.5 sm:grid-cols-2 animate-fade-up" style={{ animationDelay: '200ms' }}>
                {GOALS_STEP2.map((g) => {
                  const Icon = g.icon;
                  const isSelected = selectedGoal === g.title;
                  return (
                    <button
                      type="button"
                      key={g.id}
                      onClick={() => setSelectedGoal(g.title)}
                      className={`group relative flex items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-300 ${
                        isSelected 
                          ? "border-brand bg-brand-soft/40 shadow-lift scale-[1.02] ring-2 ring-brand/30" 
                          : "border-line bg-card hover:scale-[1.01] hover:border-brand/30 hover:bg-secondary/40"
                      }`}
                    >
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-colors ${
                        isSelected ? "bg-brand text-white shadow-md" : "bg-secondary text-brand group-hover:bg-brand-soft"
                      }`}>
                        <Icon className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display text-base font-bold text-foreground">{g.title}</h3>
                          {isSelected && (
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-white animate-scale-in">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{g.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!noraTyping && (
              <div className="flex justify-end pt-4 animate-fade-up" style={{ animationDelay: '400ms' }}>
                <button 
                  type="button" 
                  onClick={() => nextStep(3)} 
                  className="btn btn-primary btn-lg shadow-soft"
                >
                  Lanjutkan <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* ========================================================
            STEP 3: TARGET AWAL
           ======================================================== */}
        {onboardingStep === 3 && (
          <section className="space-y-8 max-w-2xl mx-auto w-full">
            <NoraAvatar size="sm" floating={false} pulsing={false} />
            <NoraDialogueBubble 
              text="Pilihan yang bagus!\nNah, agar aku bisa merekomendasikan target yang pas, ceritakan sedikit tentang fisik dan kebiasaanmu ya." 
              isTyping={true}
              onTypingComplete={() => setNoraTyping(false)}
            />

            {!noraTyping && (
              <div className="card card-pad space-y-6 border-line shadow-soft animate-fade-up" style={{ animationDelay: '200ms' }}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="ob-height" className="label flex items-center gap-1.5"><Ruler className="h-4 w-4 text-brand" /> Tinggi (cm)</label>
                    <input id="ob-height" type="number" value={healthData.height} onChange={(e) => setHealthData({ ...healthData, height: e.target.value })} className="input mt-1.5 text-base font-bold text-center" placeholder="170" />
                  </div>
                  <div>
                    <label htmlFor="ob-weight" className="label flex items-center gap-1.5"><Weight className="h-4 w-4 text-brand" /> Berat (kg)</label>
                    <input id="ob-weight" type="number" value={healthData.weight} onChange={(e) => setHealthData({ ...healthData, weight: e.target.value })} className="input mt-1.5 text-base font-bold text-center" placeholder="65" />
                  </div>
                  <div>
                    <label htmlFor="ob-target-weight" className="label flex items-center gap-1.5"><Target className="h-4 w-4 text-brand" /> Target (kg)</label>
                    <input id="ob-target-weight" type="number" value={healthData.targetWeight} onChange={(e) => setHealthData({ ...healthData, targetWeight: e.target.value })} className="input mt-1.5 text-base font-bold text-center" placeholder="60" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="label">Jenis Kelamin</p>
                    <div className="mt-2 flex gap-2">
                      {(["Laki-laki", "Perempuan"] as const).map((g) => (
                        <button type="button" key={g} onClick={() => setHealthData({ ...healthData, gender: g })} className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${healthData.gender === g ? "bg-brand text-white shadow-sm" : "bg-secondary text-muted-foreground hover:bg-line"}`}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="ob-age" className="label">Usia</label>
                    <input id="ob-age" type="number" value={healthData.age} onChange={(e) => setHealthData({ ...healthData, age: e.target.value })} className="input mt-2" placeholder="23" />
                  </div>
                </div>

                <div>
                  <p className="label">Aktivitas Harian</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {ACTIVITY_LEVELS.map((act) => (
                      <button type="button" key={act.value} onClick={() => setHealthData({ ...healthData, activity: act.value })} className={`rounded-2xl border p-3 text-left transition ${healthData.activity === act.value ? "border-brand bg-brand-soft/40 text-foreground" : "border-line bg-card text-muted-foreground hover:bg-secondary/40"}`}>
                        <p className="text-xs font-bold text-foreground">{act.label}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{act.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="button" onClick={() => nextStep(4)} className="btn btn-primary btn-lg shadow-soft">
                    Lanjutkan <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========================================================
            STEP 4: PREFERENSI (LIFESTYLE & DIET)
           ======================================================== */}
        {onboardingStep === 4 && (
          <section className="space-y-8 max-w-2xl mx-auto w-full">
            <NoraAvatar size="sm" floating={false} pulsing={false} />
            <NoraDialogueBubble 
              text="Catat! Terakhir, setiap orang punya gaya andalannya masing-masing.\nMakanan dan waktu olahraga seperti apa yang paling kamu sukai?" 
              isTyping={true}
              onTypingComplete={() => setNoraTyping(false)}
            />

            {!noraTyping && (
              <div className="card card-pad space-y-6 border-line shadow-soft animate-fade-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center justify-between rounded-2xl border border-line p-4 bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><Utensils className="h-5 w-5" /></span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Pola Makan Vegetarian / Plant-Based?</p>
                      <p className="text-[11px] text-muted-foreground">Mempengaruhi saran nutrisi & kalori.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsVegetarian(!isVegetarian)} className={`relative h-7 w-12 rounded-full transition ${isVegetarian ? "bg-brand" : "bg-secondary"}`}>
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${isVegetarian ? "left-6" : "left-1"}`} />
                  </button>
                </div>

                <div>
                  <p className="label flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-brand" /> Alergi Makanan</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ALLERGY_OPTIONS.map((allergy) => (
                      <button type="button" key={allergy} onClick={() => toggleAllergy(allergy)} className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${selectedAllergies.includes(allergy) ? "bg-brand text-white shadow-sm" : "bg-secondary text-muted-foreground hover:bg-line"}`}>
                        {selectedAllergies.includes(allergy) && <Check className="mr-1 inline h-3 w-3" />} {allergy}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="label flex items-center gap-1.5"><Activity className="h-4 w-4 text-brand" /> Aktivitas Favorit</p>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {FAVORITE_ACTIVITIES.map((act) => {
                      const Icon = act.icon;
                      const active = selectedActivities.includes(act.label);
                      return (
                        <button type="button" key={act.label} onClick={() => toggleActivity(act.label)} className={`flex items-center gap-2.5 rounded-2xl border p-3 text-xs font-bold transition ${active ? "border-brand bg-brand text-white shadow-sm" : "border-line bg-card text-muted-foreground hover:bg-secondary"}`}>
                          <Icon className="h-4 w-4 shrink-0" /><span className="truncate">{act.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="label flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand" /> Waktu Olahraga Terbaikmu</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {WORKOUT_TIMES.map((wt) => {
                      const Icon = wt.icon;
                      const active = selectedWorkoutTime === wt.label;
                      return (
                        <button type="button" key={wt.label} onClick={() => setSelectedWorkoutTime(wt.label)} className={`flex items-center gap-2 rounded-xl p-3 text-xs font-bold transition ${active ? "bg-brand-soft text-brand border border-brand/30" : "bg-secondary/60 text-muted-foreground hover:bg-line"}`}>
                          <Icon className="h-4 w-4 shrink-0 text-brand" /><span className="truncate">{wt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="button" onClick={() => nextStep(5)} className="btn btn-primary btn-lg shadow-soft">
                    Simpan Profilku <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========================================================
            STEP 5: READY FOR GLOBAL TOUR
           ======================================================== */}
        {onboardingStep === 5 && (
          <section className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <NoraAvatar size="lg" overrideAvatarId={companionData.avatarId} />
            <NoraDialogueBubble 
              text={`Halo, akhirnya kita bertemu.\nAku ${companionData.name || "Nora"}.\nAku akan menemanimu selama menggunakan NutriVerse.\nTidak usah menghafal semua fitur.\nAyo ikut aku.`} 
              isTyping={true}
              onTypingComplete={() => setNoraTyping(false)}
              overrideName={companionData.name}
            />
            {!noraTyping && (
              <button
                type="button"
                onClick={() => {
                  window.localStorage.setItem("nutriverse.needs_tour", "true");
                  void finishOnboardingAndEnterDashboard();
                }}
                disabled={submitting}
                className="btn btn-primary btn-lg mt-8 shadow-premium animate-pulse-soft animate-fade-up text-lg px-8 py-4 disabled:opacity-60"
              >
                {submitting ? "Menyimpan..." : "Ayo Berkeliling"} <ArrowRight className="h-6 w-6 ml-2" />
              </button>
            )}
          </section>
        )}

      </main>
    </div>
  );
}
