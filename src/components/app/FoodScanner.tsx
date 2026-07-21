"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera, Upload, Loader2, RotateCcw, Footprints, Bike,
  Flame, Sparkles, Check, X, HelpCircle, Plus, Leaf, Edit2
} from "lucide-react";
import { analyze, verdict, type Food, type Nutrition, type NutritionTrustLevel } from "@/lib/food";
import { deterministicFoodEntries } from "@/features/nutrition/data";
import { NutritionTrustBadge, NutritionLimitationCard } from "@/features/nutrition/components/NutritionComponents";
import { companionInsights } from "@/features/companion/data";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";
import { useCompanionName } from "@/hooks/useCompanionName";

export type LoggedFood = {
  name: string;
  portion: string;
  photo?: string;
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
  const [demoIndex, setDemoIndex] = useState<number>(0);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [portion, setPortion] = useState(1);
  const [confirmedIdentity, setConfirmedIdentity] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const activeEntry = deterministicFoodEntries[demoIndex];

  // Map the demo data to FOOD structure for calculations
  const currentFood: Food = {
    name: customName || activeEntry.title,
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

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
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
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" aria-label="Upload meal image" />

      {/* Demo Selector */}
      {(status === "empty" || status === "ready") && (
        <div className="space-y-2 border-b border-line/40 pb-4">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Demo Analysis Meals
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {deterministicFoodEntries.map((entry, idx) => (
              <button
                key={entry.id}
                onClick={() => {
                  setDemoIndex(idx);
                  setIsDemoMode(true);
                  setImageUrl(null);
                  setStatus("ready");
                }}
                className={`rounded-xl border p-2.5 text-xs font-bold text-center transition leading-tight ${
                  demoIndex === idx && isDemoMode && (status === "ready" || status === "empty")
                    ? "border-brand bg-brand-soft text-brand shadow-sm"
                    : "border-line text-muted-foreground hover:bg-secondary"
                }`}
              >
                {entry.title}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            * Use a prepared meal example without uploading a personal image.
          </p>
        </div>
      )}

      {/* Image Preview Container */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-secondary/40">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Foto makanan" className="h-64 w-full object-cover" />
        ) : isDemoMode && status !== "empty" ? (
          <div className="flex h-64 w-full flex-col items-center justify-center bg-brand/5 text-brand p-4 text-center">
            <Leaf className="h-10 w-10 mb-2" />
            <p className="text-sm font-extrabold text-foreground">{currentFood.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Demo Mode: Simulated meal layout loaded</p>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} className="flex h-64 w-full flex-col items-center justify-center gap-3 text-muted-foreground transition hover:bg-secondary">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><Camera className="h-7 w-7" /></span>
            <p className="text-sm font-semibold text-foreground">Ambil foto atau unggah makanan</p>
            <p className="text-xs">Format JPG/PNG</p>
          </button>
        )}
        {status === "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/65 text-white backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-semibold">Mengirim ke AI untuk dianalisis...</p>
          </div>
        )}
      </div>

      {/* Upload Privacy Note */}
      <p className="text-[10px] text-muted-foreground leading-normal bg-secondary/45 rounded-xl p-3 border border-line/30">
        Meal images are used only for the current analysis experience. This MVP does not provide production image storage or medical nutrition assessment.
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
          <div className="grid grid-cols-4 gap-2">
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
              <p className="text-xs text-muted-foreground mt-0.5">Porsi: {portion}x {currentFood.portion} &middot; estimasi AI log</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`pill text-[10px] font-bold uppercase ${toneClass[v.tone]}`}><Flame className="h-3.5 w-3.5" /> {v.label}</span>
              <NutritionTrustBadge trust={confirmedIdentity ? "confirmed" : "simulated"} />
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
            <span>Vitamins: <span className="font-semibold text-foreground">{result.nutrition.vitamins}</span></span>
          </div>

          {/* Activity Burn Rec */}
          <div className="rounded-2xl border border-line p-4 space-y-3 bg-card">
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wider text-brand">Rekomendasi Aktivitas Pembakaran</p>
              <p className="mt-1 text-xs text-muted-foreground leading-normal">{result.activityRec}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-secondary p-2.5"><Footprints className="h-4 w-4 text-brand" /><div><p className="stat-num text-xs font-bold text-foreground leading-none">{result.burn.run}m</p><p className="text-[9px] text-muted-foreground mt-0.5">Lari</p></div></div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary p-2.5"><Bike className="h-4 w-4 text-sky" /><div><p className="stat-num text-xs font-bold text-foreground leading-none">{result.burn.bike}m</p><p className="text-[9px] text-muted-foreground mt-0.5">Sepeda</p></div></div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary p-2.5"><Footprints className="h-4 w-4 text-amber" /><div><p className="stat-num text-xs font-bold text-foreground leading-none">{result.burn.walk}m</p><p className="text-[9px] text-muted-foreground mt-0.5">Jalan</p></div></div>
            </div>
          </div>

          {/* Companion Nutrition Insight */}
          {noraInsight && (
            <div className="space-y-2.5 pt-2 border-t border-line/35">
              <h4 className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{displayName} Nutrition Feedback</h4>
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
