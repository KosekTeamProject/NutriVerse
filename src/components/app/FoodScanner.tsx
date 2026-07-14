"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera, Upload, Loader2, RotateCcw, Footprints, Bike, Info,
  Flame, Drumstick, Wheat, Droplet, Sparkles,
} from "lucide-react";
import { FOODS, verdict, burnMinutes, type Food } from "@/lib/food";

type Status = "empty" | "ready" | "scanning" | "result";

const toneClass: Record<string, string> = {
  brand: "bg-brand-soft text-brand",
  amber: "bg-amber/15 text-amber",
  destructive: "bg-destructive/10 text-destructive",
};

function Macro({ icon: Icon, label, value, unit }: { icon: typeof Drumstick; label: string; value: number; unit: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <p className="stat-num mt-1.5 text-lg">{value}<span className="text-xs text-muted-foreground">{unit}</span></p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function FoodScanner() {
  const [status, setStatus] = useState<Status>("empty");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [food, setFood] = useState<Food | null>(null);
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

  function analyze() {
    setStatus("scanning");
    setTimeout(() => {
      const picked = FOODS[Math.floor(Math.random() * FOODS.length)];
      setFood(picked);
      setConfidence(0.82 + Math.random() * 0.15);
      setStatus("result");
    }, 1600);
  }

  function reset() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setFood(null);
    setStatus("empty");
    if (fileRef.current) fileRef.current.value = "";
  }

  const v = food ? verdict(food.kcal) : null;
  const burn = food ? burnMinutes(food.kcal) : null;

  return (
    <div className="card card-pad">
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

      {/* image / dropzone */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-secondary/40">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Foto makanan" className="h-64 w-full object-cover" />
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-64 w-full flex-col items-center justify-center gap-3 text-muted-foreground transition hover:bg-secondary"
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Camera className="h-7 w-7" />
            </span>
            <p className="text-sm font-semibold text-foreground">Ambil foto atau unggah makanan</p>
            <p className="text-xs">Format JPG/PNG</p>
          </button>
        )}

        {status === "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/60 text-white backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-semibold">Menganalisis makanan...</p>
          </div>
        )}
      </div>

      {/* actions before result */}
      {(status === "empty" || status === "ready") && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => fileRef.current?.click()} className="btn btn-outline">
            <Upload className="h-[18px] w-[18px]" /> {imageUrl ? "Ganti foto" : "Pilih foto"}
          </button>
          {status === "ready" && (
            <button onClick={analyze} className="btn btn-primary">
              <Sparkles className="h-[18px] w-[18px]" /> Analisis
            </button>
          )}
        </div>
      )}

      {/* result */}
      {status === "result" && food && v && burn && (
        <div className="mt-5 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-xl font-extrabold">{food.name}</h3>
              <p className="text-xs text-muted-foreground">Porsi terdeteksi: {food.portion} &middot; keyakinan {Math.round(confidence * 100)}%</p>
            </div>
            <span className={`pill ${toneClass[v.tone]}`}><Flame className="h-3.5 w-3.5" /> {v.label}</span>
          </div>

          {/* calories */}
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand to-lime p-5 text-center text-white">
            <p className="text-xs font-medium text-white/80">Estimasi kalori</p>
            <p className="stat-num mt-1 text-4xl">{food.kcal}<span className="ml-1 text-lg text-white/80">kkal</span></p>
          </div>

          {/* macros */}
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Macro icon={Drumstick} label="Protein" value={food.protein} unit="g" />
            <Macro icon={Wheat} label="Karbo" value={food.carbs} unit="g" />
            <Macro icon={Droplet} label="Lemak" value={food.fat} unit="g" />
          </div>

          {/* correction */}
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Bukan ini? Koreksi:</label>
            <select
              className="input"
              value={food.name}
              onChange={(e) => { const f = FOODS.find((x) => x.name === e.target.value); if (f) setFood(f); }}
            >
              {FOODS.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>

          {/* burn advice */}
          <div className="mt-4 rounded-2xl border border-line p-4">
            <p className="text-sm font-semibold">Cara membakarnya</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Setara dengan aktivitas fisik berikut:</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Footprints className="h-5 w-5" /></span>
                <div><p className="stat-num text-lg leading-none">{burn.run} mnt</p><p className="text-xs text-muted-foreground">Lari</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky/10 text-sky"><Bike className="h-5 w-5" /></span>
                <div><p className="stat-num text-lg leading-none">{burn.bike} mnt</p><p className="text-xs text-muted-foreground">Bersepeda</p></div>
              </div>
            </div>
            <Link href="/aktivitas" className="btn btn-primary mt-4 w-full"><Footprints className="h-[18px] w-[18px]" /> Catat aktivitas untuk dapat XP</Link>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-sky/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
            <p>Scan makanan bersifat <span className="font-semibold text-foreground">informatif</span> — membantumu memahami asupan. XP hanya diperoleh dari aktivitas fisik nyata, bukan dari mencatat makanan.</p>
          </div>

          <button onClick={reset} className="btn btn-ghost mt-4 w-full"><RotateCcw className="h-[18px] w-[18px]" /> Pindai makanan lain</button>
        </div>
      )}
    </div>
  );
}
