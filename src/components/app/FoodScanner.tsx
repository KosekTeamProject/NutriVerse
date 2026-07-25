"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import {
  Camera, Upload, Loader2, RotateCcw, Footprints, Bike,
  Flame, Sparkles, Check, X, HelpCircle, Plus, Leaf, Edit2, ArrowRight, HeartPulse
} from "lucide-react";
import { analyze, verdict, type Food, type Nutrition, type NutritionTrustLevel, FOODS } from "@/lib/food";
import { deterministicFoodEntries } from "@/features/nutrition/data";
import { NutritionTrustBadge, NutritionLimitationCard } from "@/features/nutrition/components/NutritionComponents";
import { companionInsights } from "@/features/companion/data";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";
import { useCompanionName } from "@/hooks/useCompanionName";

export type LoggedFood = {
  name: string;
  portion: string;
  photo?: string;
  photoFile?: File;
  nutrition: Nutrition;
  activityRec: string;
  insight: string;
  trustLevel: NutritionTrustLevel;
};

type Status = "empty" | "ready" | "scanning" | "verify" | "portion" | "result";
const PORTIONS = [0.5, 1, 1.5, 2];

const toneClass: Record<string, string> = {
  brand: "bg-brand-soft text-brand",
  amber: "bg-amber/15 text-amber",
  destructive: "bg-destructive/10 text-destructive",
};

function NutriCell({ label, value, unit }: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="rounded-xl bg-secondary p-2.5 text-center">
      <p className="stat-num text-base leading-none font-bold text-foreground">
        {value}
        <span className="text-[10px] text-muted-foreground font-normal ml-0.5">{unit}</span>
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

export function FoodScanner({ onAdd }: { onAdd?: (entry: LoggedFood) => void }) {
  const { displayName } = useCompanionName();
  const [status, setStatus] = useState<Status>("empty");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [demoIndex, setDemoIndex] = useState<number>(0);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [portion, setPortion] = useState(1);
  const [confirmedIdentity, setConfirmedIdentity] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const activeEntry = deterministicFoodEntries[demoIndex];

  // Find matching food in FOODS if customName matches or is search-based
  const matchedFood = useMemo(() => {
    if (!customName) return null;
    const nameLower = customName.toLowerCase().trim();
    return FOODS.find(f => f.name.toLowerCase() === nameLower) || 
           FOODS.find(f => f.name.toLowerCase().includes(nameLower)) || 
           null;
  }, [customName]);

  const currentFood: Food = useMemo(() => {
    if (isDemoMode || (!customName && activeEntry)) {
      return {
        name: activeEntry.title,
        portion: activeEntry.portion,
        kcal: activeEntry.nutrition.kcal,
        protein: activeEntry.nutrition.protein,
        carbs: activeEntry.nutrition.carbs,
        fat: activeEntry.nutrition.fat,
        fiber: activeEntry.nutrition.fiber,
        sugar: activeEntry.nutrition.sugar ?? 0,
        sodium: activeEntry.nutrition.sodium ?? 0,
        vitamins: activeEntry.nutrition.vitamins || "A, B"
      };
    }

    if (matchedFood) {
      return matchedFood;
    }

    return {
      name: customName,
      portion: "1 porsi",
      kcal: 250,
      protein: 8,
      carbs: 35,
      fat: 8,
      fiber: 2,
      sugar: 5,
      sodium: 400,
      vitamins: "B1, B2"
    };
  }, [isDemoMode, activeEntry, matchedFood, customName]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setSelectedFile(file);
    setIsDemoMode(false);
    setStatus("ready");
  }

  function runAnalysis() {
    setStatus("scanning");
    // Simulated delay matching API calls
    setTimeout(() => {
      setStatus("verify");
    }, 1500);
  }

  function reset() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setSelectedFile(null);
    setPortion(1);
    setConfirmedIdentity(false);
    setIsEditingName(false);
    setCustomName("");
    setStatus("empty");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleConfirmIdentity() {
    setConfirmedIdentity(true);
    setStatus("portion");
  }

  function addToLog() {
    const a = analyze(currentFood, portion);
    const finalTrust: NutritionTrustLevel = confirmedIdentity ? "confirmed" : "simulated";
    onAdd?.({
      name: currentFood.name,
      portion: `${portion}x ${currentFood.portion}`,
      photo: imageUrl ?? undefined,
      photoFile: selectedFile ?? undefined,
      nutrition: a.nutrition,
      activityRec: a.activityRec,
      insight: a.insight,
      trustLevel: finalTrust
    });
    reset();
  }

  const result = analyze(currentFood, portion);
  const v = verdict(result.nutrition.kcal);

  // Retrieve Nora Nutrition Insight
  const noraInsight = companionInsights.find((ins) => ins.id === "companion-nutrition-insight");

  return (
    <div className="card card-pad space-y-6">
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" aria-label="Unggah foto makanan" />

      {/* Image Preview Container - Dominant and First */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-secondary/20 shadow-sm transition-all duration-300">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Foto makanan" className="h-48 sm:h-64 w-full object-cover" />
        ) : isDemoMode && status !== "empty" ? (
          <div className="flex h-48 sm:h-64 w-full flex-col items-center justify-center bg-brand/5 text-brand p-4 text-center">
            <Leaf className="h-8 sm:h-10 w-8 sm:w-10 mb-2 sm:mb-3" />
            <p className="text-base font-extrabold text-foreground">{currentFood.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Mode Demo: contoh susunan makanan dimuat</p>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} className="group flex h-48 sm:h-64 w-full flex-col items-center justify-center gap-3 sm:gap-4 text-muted-foreground transition hover:bg-secondary/40">
            <span className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full bg-brand-soft text-brand transition-transform group-hover:scale-110 shadow-sm"><Camera className="h-6 w-6 sm:h-7 sm:w-7" /></span>
            <div className="space-y-1 text-center">
              <p className="text-sm sm:text-base font-bold text-foreground">Ambil foto makanan</p>
              <p className="text-[10px] sm:text-xs">atau unggah gambar (JPG/PNG)</p>
            </div>
          </button>
        )}
        {status === "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/75 text-white backdrop-blur-md transition-all duration-300">
            <Loader2 className="h-10 w-10 animate-spin text-brand" />
            <p className="text-sm font-semibold">Menganalisis nutrisi dengan AI...</p>
          </div>
        )}
      </div>

      {/* Demo Selector - Progressive Disclosure */}
      {(status === "empty" || status === "ready") && (
        <details className="group rounded-2xl border border-line bg-card shadow-sm open:pb-4 transition-all duration-300">
          <summary className="flex cursor-pointer items-center justify-between p-3 outline-none select-none text-xs font-bold text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Atau coba contoh Analisis Demo</span>
            <span className="text-brand group-open:hidden">Buka</span>
          </summary>
          <div className="px-3 pt-1 space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {deterministicFoodEntries.map((entry, idx) => (
                <button
                  type="button"
                  key={entry.id}
                  onClick={() => {
                    setDemoIndex(idx);
                    setIsDemoMode(true);
                    setImageUrl(null);
                    setCustomName("");
                    setStatus("ready");
                  }}
                  className={`rounded-xl border p-2 text-xs font-bold text-center transition leading-tight ${
                    demoIndex === idx && isDemoMode && (status === "ready" || status === "empty") && !customName
                      ? "border-brand bg-brand-soft text-brand shadow-sm"
                      : "border-line text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {entry.title}
                </button>
              ))}
            </div>
            
            {/* Custom Food Name Input */}
            <div className="pt-3 border-t border-line/30 space-y-2">
              <label htmlFor="food-name-input" className="text-xs font-bold text-foreground block">
                Ketik Manual Jenis Makanan
              </label>
              <input
                id="food-name-input"
                type="text"
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  setIsDemoMode(false);
                  if (status === "empty" && e.target.value.trim()) {
                    setStatus("ready");
                  } else if (status === "ready" && !e.target.value.trim() && !imageUrl) {
                    setStatus("empty");
                  }
                }}
                placeholder="misal: Soto Ayam, Nasi Goreng..."
                className="input text-sm w-full"
              />
            </div>
          </div>
        </details>
      )}

      {/* Upload Privacy Note */}
      <p className="text-[10px] text-muted-foreground leading-normal bg-secondary/45 rounded-xl p-3 border border-line/30">
        Foto makanan hanya digunakan untuk analisis saat ini. MVP belum menyediakan penyimpanan foto produksi atau penilaian gizi medis.
      </p>

      {/* Controls */}
      {(status === "empty" || status === "ready") && (
        <div className="flex flex-wrap gap-3">
          <button onClick={() => fileRef.current?.click()} className="btn btn-outline">
            <Upload className="h-[18px] w-[18px]" /> {imageUrl ? "Ganti foto" : "Pilih foto"}
          </button>
          {status === "ready" && (
            <button onClick={runAnalysis} className="btn btn-primary"><Sparkles className="h-[18px] w-[18px]" /> Analisis dengan AI</button>
          )}
        </div>
      )}

      {/* VERIFIKASI 1 - identitas */}
      {status === "verify" && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-start gap-2.5 rounded-2xl border border-line p-4 bg-secondary/20">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
            <div>
              <p className="text-xs font-bold text-foreground">Apakah makanan yang terdeteksi sudah benar?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Konfirmasikan kecocokan menu sebelum menghitung porsi detail.</p>
            </div>
          </div>
          <div className="rounded-2xl bg-secondary p-5 text-center space-y-3">
            {isEditingName ? (
              <div className="space-y-1.5 max-w-xs mx-auto">
                <input 
                  type="text" 
                  value={customName || currentFood.name} 
                  onChange={(e) => setCustomName(e.target.value)}
                  className="input text-center text-sm font-bold"
                  placeholder="Ketik nama menu..."
                  aria-label="Nama menu kustom"
                />
                <button onClick={() => setIsEditingName(false)} className="btn btn-ghost btn-sm">Selesai</button>
              </div>
            ) : (
              <div>
                <p className="font-display text-xl font-extrabold text-foreground">{currentFood.name}</p>
                <p className="text-xs text-muted-foreground mt-1">Perkiraan {currentFood.kcal} kkal &middot; {currentFood.portion}</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={reset} className="btn btn-ghost flex-1 text-xs"><X className="h-4 w-4" /> Coba Gambar Lain</button>
            <button onClick={() => setIsEditingName(true)} className="btn btn-outline flex-1 text-xs"><Edit2 className="h-4 w-4" /> Ubah Nama</button>
            <button onClick={handleConfirmIdentity} className="btn btn-primary flex-1 text-xs"><Check className="h-[18px] w-[18px]" /> Konfirmasi Makanan</button>
          </div>
        </div>
      )}

      {/* VERIFIKASI 2 - porsi */}
      {status === "portion" && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-start gap-2.5 rounded-2xl border border-line p-4 bg-secondary/20">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
            <div>
              <p className="text-xs font-bold text-foreground">Konfirmasi Porsi (Langkah 2 dari 2)</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tentukan porsi relatif makanan Anda untuk mengalikan zat gizi.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PORTIONS.map((p) => (
              <button 
                key={p} 
                onClick={() => setPortion(p)} 
                className={`rounded-xl border px-3 py-3 text-center text-xs font-bold transition ${portion === p ? "border-brand bg-brand-soft text-brand" : "border-line text-muted-foreground hover:bg-secondary"}`}
              >
                {p}x
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground font-semibold">
            {currentFood.name} &middot; {portion}x {currentFood.portion} &middot; <span className="stat-num text-foreground">{Math.round(currentFood.kcal * portion)}</span> kkal
          </p>
          <div className="flex gap-3">
            <button onClick={() => setStatus("verify")} className="btn btn-outline flex-1">Kembali</button>
            <button onClick={() => setStatus("result")} className="btn btn-primary flex-1"><Sparkles className="h-[18px] w-[18px]" /> Konfirmasi Porsi</button>
          </div>
        </div>
      )}

      {/* HASIL */}
      {status === "result" && result && v && (
        <div className="space-y-5 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/45 pb-3">
            <div>
              <h3 className="font-display text-lg font-extrabold text-foreground">{currentFood.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Porsi: {portion}x {currentFood.portion} &middot; estimasi catatan AI</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`pill text-[10px] font-extrabold uppercase tracking-wider border px-2.5 py-1 ${result.healthIndicator.badgeClass}`}>
                ● {result.healthIndicator.label}
              </span>
              <NutritionTrustBadge trust={confirmedIdentity ? "confirmed" : "simulated"} />
            </div>
          </div>

          {/* Health Indicator & Reasons Card */}
          <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-card to-brand-soft/20 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand uppercase tracking-wider">Health Indicator</span>
              <span className={`pill text-[9px] font-bold ${result.healthIndicator.badgeClass}`}>
                {result.healthIndicator.label}
              </span>
            </div>

            {/* Reasons Chips */}
            <div className="flex flex-wrap gap-1.5">
              {result.healthIndicator.reasons.map((r, idx) => (
                <span key={idx} className="pill bg-secondary text-foreground text-[10px] font-bold border border-line">
                  ✓ {r}
                </span>
              ))}
            </div>

            {/* Educational Grid: Insight, Alternative, Portion */}
            <div className="grid gap-2.5 sm:grid-cols-3 pt-2 text-xs">
              <div className="rounded-xl border border-line bg-card p-3 space-y-1">
                <p className="text-[10px] font-bold text-brand uppercase tracking-wider">Nutrition Insight</p>
                <p className="text-muted-foreground leading-relaxed">{result.healthIndicator.nutritionInsight}</p>
              </div>

              <div className="rounded-xl border border-line bg-card p-3 space-y-1">
                <p className="text-[10px] font-bold text-sky uppercase tracking-wider">Healthy Alternative</p>
                <p className="text-muted-foreground leading-relaxed">{result.healthIndicator.healthyAlternative}</p>
              </div>

              <div className="rounded-xl border border-line bg-card p-3 space-y-1">
                <p className="text-[10px] font-bold text-amber uppercase tracking-wider">Portion Advice</p>
                <p className="text-muted-foreground leading-relaxed">{result.healthIndicator.portionAdvice}</p>
              </div>
            </div>
          </div>

          {/* Calorie Card */}
          <div className="rounded-2xl bg-gradient-to-br from-brand to-lime p-5 text-center text-white shadow-soft">
            <p className="text-xs font-medium text-white/80">Estimasi Kalori</p>
            <p className="stat-num mt-1 text-4xl font-extrabold">{result.nutrition.kcal}<span className="ml-1 text-base text-white/80 font-normal">kkal</span></p>
          </div>

          {/* Nutrition Macros */}
          <div className="grid grid-cols-3 gap-2">
            <NutriCell label="Protein" value={result.nutrition.protein} unit="g" />
            <NutriCell label="Karbo" value={result.nutrition.carbs} unit="g" />
            <NutriCell label="Lemak" value={result.nutrition.fat} unit="g" />
            <NutriCell label="Serat" value={result.nutrition.fiber} unit="g" />
            <NutriCell label="Gula" value={result.nutrition.sugar} unit="g" />
            <NutriCell label="Sodium" value={result.nutrition.sodium} unit="mg" />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-secondary p-2.5 text-xs text-muted-foreground">
            <Leaf className="h-4 w-4 text-brand shrink-0" /> 
            <span>Vitamin: <span className="font-semibold text-foreground">{result.nutrition.vitamins}</span></span>
          </div>

          {/* Supportive movement options */}
          <div className="rounded-2xl border border-brand/20 bg-brand-soft/45 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-brand"><HeartPulse className="h-5 w-5" /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand">Pilihan gerak ringan · opsional</p>
                <p className="mt-1 text-sm font-bold text-foreground">Mulai dengan jalan santai 10–15 menit</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Tidak perlu “membayar” makanan dengan olahraga. Pilih gerak yang terasa realistis untuk kondisi tubuhmu hari ini.
                </p>
              </div>
            </div>
            <Link href="/aktivitas?source=food-scan" className="btn btn-primary w-full sm:w-auto">
              Lihat aktivitas ringan <ArrowRight className="h-4 w-4" />
            </Link>
            <details className="rounded-xl border border-line bg-card p-3">
              <summary className="cursor-pointer text-xs font-bold text-foreground">Lihat estimasi ekuivalen energi</summary>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Angka berikut hanya estimasi informatif, bukan target wajib atau kompensasi atas makanan.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                <div className="flex items-center gap-2 rounded-xl bg-secondary p-2.5"><Footprints className="h-4 w-4 text-brand" /><div><p className="stat-num text-xs font-bold text-foreground leading-none">{result.burn.run}m</p><p className="text-[9px] text-muted-foreground mt-0.5">Lari</p></div></div>
                <div className="flex items-center gap-2 rounded-xl bg-secondary p-2.5"><Bike className="h-4 w-4 text-sky" /><div><p className="stat-num text-xs font-bold text-foreground leading-none">{result.burn.bike}m</p><p className="text-[9px] text-muted-foreground mt-0.5">Sepeda</p></div></div>
                <div className="flex items-center gap-2 rounded-xl bg-secondary p-2.5"><Footprints className="h-4 w-4 text-amber" /><div><p className="stat-num text-xs font-bold text-foreground leading-none">{result.burn.walk}m</p><p className="text-[9px] text-muted-foreground mt-0.5">Jalan</p></div></div>
              </div>
            </details>
          </div>

          {/* Companion Nutrition Insight */}
          {noraInsight && (
            <div className="space-y-2.5 pt-2 border-t border-line/35">
              <h4 className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Masukan Gizi dari {displayName}</h4>
              <CompanionCard 
                insight={noraInsight} 
                variant="compact" 
                showExplanation={false} 
                showPriority={false}
              />
            </div>
          )}

          {/* Ask Companion contextual button */}
          <div className="border-t border-line/35 pt-4">
            <Link 
              href={`/companion?analysis=${activeEntry.id}`}
              className="btn btn-outline w-full flex items-center justify-center gap-2 font-bold py-3 text-xs"
            >
              <Sparkles className="h-4.5 w-4.5 text-brand" /> Tanyakan hasil ini kepada {displayName}
            </Link>
          </div>

          {/* Estimated Warning */}
          <NutritionLimitationCard />

          {/* Save / Reset */}
          <div className="flex gap-3 pt-2">
            <button onClick={reset} className="btn btn-ghost flex-1"><RotateCcw className="h-[18px] w-[18px]" /> Pindai Lain</button>
            <button onClick={addToLog} className="btn btn-primary flex-1"><Plus className="h-[18px] w-[18px]" /> Simpan ke riwayat</button>
          </div>
        </div>
      )}
    </div>
  );
}
