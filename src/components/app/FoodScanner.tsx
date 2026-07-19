"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera, Upload, Loader2, RotateCcw, Footprints, Bike, Info,
  Flame, Sparkles, Check, X, HelpCircle, Plus, Leaf,
} from "lucide-react";
import { FOODS, analyze, verdict, type Food, type Nutrition } from "@/lib/food";

export type LoggedFood = {
  name: string;
  portion: string;
  photo?: string;
  nutrition: Nutrition;
  activityRec: string;
  insight: string;
};

type Status = "empty" | "ready" | "scanning" | "verify" | "portion" | "result";
const PORTIONS = [0.5, 1, 1.5, 2];

const toneClass: Record<string, string> = {
  brand: "bg-brand-soft text-brand",
  amber: "bg-amber/15 text-amber",
  destructive: "bg-destructive/10 text-destructive",
};

function pickCandidates(): Food[] {
  return [...FOODS].sort(() => Math.random() - 0.5).slice(0, 3);
}

function NutriCell({ label, value, unit }: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="rounded-xl bg-secondary p-2.5 text-center">
      <p className="stat-num text-base leading-none">{value}<span className="text-[10px] text-muted-foreground">{unit}</span></p>
      <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function FoodScanner({ onAdd }: { onAdd?: (entry: LoggedFood) => void }) {
  const [status, setStatus] = useState<Status>("empty");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Food[]>([]);
  const [food, setFood] = useState<Food | null>(null);
  const [portion, setPortion] = useState(1);
  const [confidence, setConfidence] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setFood(null);
    setStatus("ready");
  }

  function runAnalysis() {
    // Simulasi: business logic mengirim gambar ke Gemini, lalu memproses respons.
    setStatus("scanning");
    setTimeout(() => {
      const cands = pickCandidates();
      setCandidates(cands);
      setFood(cands[0]);
      setConfidence(0.82 + Math.random() * 0.15);
      setStatus("verify");
    }, 1600);
  }

  function reset() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setFood(null);
    setCandidates([]);
    setPortion(1);
    setStatus("empty");
    if (fileRef.current) fileRef.current.value = "";
  }

  function addToLog() {
    if (!food) return;
    const a = analyze(food, portion);
    onAdd?.({
      name: food.name,
      portion: `${portion}x ${food.portion}`,
      photo: imageUrl ?? undefined,
      nutrition: a.nutrition,
      activityRec: a.activityRec,
      insight: a.insight,
    });
    reset();
  }

  const result = food ? analyze(food, portion) : null;
  const v = result ? verdict(result.nutrition.kcal) : null;

  return (
    <div className="card card-pad">
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

      <div className="relative overflow-hidden rounded-2xl border border-line bg-secondary/40">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Foto makanan" className="h-64 w-full object-cover" />
        ) : (
          <button onClick={() => fileRef.current?.click()} className="flex h-64 w-full flex-col items-center justify-center gap-3 text-muted-foreground transition hover:bg-secondary">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><Camera className="h-7 w-7" /></span>
            <p className="text-sm font-semibold text-foreground">Ambil foto atau unggah makanan</p>
            <p className="text-xs">Format JPG/PNG</p>
          </button>
        )}
        {status === "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/60 text-white backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-semibold">Mengirim ke AI untuk dianalisis...</p>
          </div>
        )}
      </div>

      {(status === "empty" || status === "ready") && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => fileRef.current?.click()} className="btn btn-outline">
            <Upload className="h-[18px] w-[18px]" /> {imageUrl ? "Ganti foto" : "Pilih foto"}
          </button>
          {status === "ready" && (
            <button onClick={runAnalysis} className="btn btn-primary"><Sparkles className="h-[18px] w-[18px]" /> Analisis dengan AI</button>
          )}
        </div>
      )}

      {/* VERIFIKASI 1 - identitas */}
      {status === "verify" && food && (
        <div className="mt-5 animate-fade-up">
          <div className="flex items-start gap-2 rounded-2xl border border-line p-4">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
            <div>
              <p className="text-sm font-semibold">Verifikasi 1 dari 2 &middot; Sudah benar?</p>
              <p className="text-xs text-muted-foreground">Keyakinan AI {Math.round(confidence * 100)}%. Konfirmasi agar analisis nutrisi akurat.</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-secondary p-4 text-center">
            <p className="font-display text-xl font-extrabold">{food.name}</p>
            <p className="text-xs text-muted-foreground">Perkiraan {food.kcal} kkal &middot; {food.portion}</p>
          </div>
          <button onClick={() => setStatus("portion")} className="btn btn-primary mt-4 w-full"><Check className="h-[18px] w-[18px]" /> Ya, benar</button>
          <p className="mt-4 mb-2 text-xs font-medium text-muted-foreground">Bukan ini? Pilih yang benar:</p>
          <div className="space-y-2">
            {candidates.filter((c) => c.name !== food.name).map((c) => (
              <button key={c.name} onClick={() => setFood(c)} className="flex w-full items-center justify-between rounded-xl border border-line px-4 py-2.5 text-left text-sm font-medium transition hover:bg-secondary">
                <span>{c.name}</span><span className="text-xs text-muted-foreground">{c.kcal} kkal</span>
              </button>
            ))}
            <button onClick={reset} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary">
              <X className="h-4 w-4" /> Semua salah, coba lagi
            </button>
          </div>
        </div>
      )}

      {/* VERIFIKASI 2 - porsi */}
      {status === "portion" && food && (
        <div className="mt-5 animate-fade-up">
          <div className="flex items-start gap-2 rounded-2xl border border-line p-4">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
            <div>
              <p className="text-sm font-semibold">Verifikasi 2 dari 2 &middot; Berapa porsimu?</p>
              <p className="text-xs text-muted-foreground">Business logic akan mengirim porsi ini ke AI untuk analisis final.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {PORTIONS.map((p) => (
              <button key={p} onClick={() => setPortion(p)} className={`rounded-xl border px-3 py-3 text-center text-sm font-semibold transition ${portion === p ? "border-brand bg-brand-soft text-brand" : "border-line text-muted-foreground hover:bg-secondary"}`}>{p}x</button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">{food.name} &middot; {portion}x {food.portion} &middot; <span className="stat-num text-foreground">{Math.round(food.kcal * portion)}</span> kkal</p>
          <div className="mt-4 flex gap-3">
            <button onClick={() => setStatus("verify")} className="btn btn-outline flex-1">Kembali</button>
            <button onClick={() => setStatus("result")} className="btn btn-primary flex-1"><Sparkles className="h-[18px] w-[18px]" /> Analisis final</button>
          </div>
        </div>
      )}

      {/* HASIL */}
      {status === "result" && food && result && v && (
        <div className="mt-5 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-xl font-extrabold">{food.name}</h3>
              <p className="text-xs text-muted-foreground">Porsi: {portion}x {food.portion} &middot; hasil analisis AI</p>
            </div>
            <span className={`pill ${toneClass[v.tone]}`}><Flame className="h-3.5 w-3.5" /> {v.label}</span>
          </div>

          <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand to-lime p-5 text-center text-white">
            <p className="text-xs font-medium text-white/80">Estimasi kalori</p>
            <p className="stat-num mt-1 text-4xl">{result.nutrition.kcal}<span className="ml-1 text-lg text-white/80">kkal</span></p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <NutriCell label="Protein" value={result.nutrition.protein} unit="g" />
            <NutriCell label="Karbo" value={result.nutrition.carbs} unit="g" />
            <NutriCell label="Lemak" value={result.nutrition.fat} unit="g" />
            <NutriCell label="Serat" value={result.nutrition.fiber} unit="g" />
            <NutriCell label="Gula" value={result.nutrition.sugar} unit="g" />
            <NutriCell label="Sodium" value={result.nutrition.sodium} unit="mg" />
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-secondary p-2.5 text-xs text-muted-foreground">
            <Leaf className="h-3.5 w-3.5 text-brand" /> Vitamin: <span className="font-medium text-foreground">{result.nutrition.vitamins}</span>
          </div>

          <div className="mt-4 rounded-2xl border border-line p-4">
            <p className="text-sm font-semibold">Rekomendasi aktivitas</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{result.activityRec}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-secondary p-2.5"><Footprints className="h-4 w-4 text-brand" /><div><p className="stat-num text-sm leading-none">{result.burn.run}m</p><p className="text-[10px] text-muted-foreground">Lari</p></div></div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary p-2.5"><Bike className="h-4 w-4 text-sky" /><div><p className="stat-num text-sm leading-none">{result.burn.bike}m</p><p className="text-[10px] text-muted-foreground">Sepeda</p></div></div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary p-2.5"><Footprints className="h-4 w-4 text-amber" /><div><p className="stat-num text-sm leading-none">{result.burn.walk}m</p><p className="text-[10px] text-muted-foreground">Jalan</p></div></div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-sky/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
            <p>{result.insight} Scan bersifat informatif dan tidak menambah XP - XP hanya dari aktivitas fisik.</p>
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={reset} className="btn btn-ghost flex-1"><RotateCcw className="h-[18px] w-[18px]" /> Pindai lain</button>
            <button onClick={addToLog} className="btn btn-primary flex-1"><Plus className="h-[18px] w-[18px]" /> Simpan ke riwayat</button>
          </div>
        </div>
      )}
    </div>
  );
}
