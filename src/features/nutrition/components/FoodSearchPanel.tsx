"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Loader2, 
  AlertTriangle, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  HelpCircle, 
  Info,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { ExternalFoodSearchResult, FoodSearchResponse } from "../providers/types";
import { scaleNutrientsFromPer100g, ScaledNutritionResult } from "../helpers/scale-nutrients";
import { useCompanionName } from "@/hooks/useCompanionName";

interface FoodSearchPanelProps {
  readonly onConfirmFood?: (summary: {
    name: string;
    portionLabel: string;
    scaled: ScaledNutritionResult;
    sourceLabel: string;
  }) => void;
}

type Step = "search" | "confirm-identity" | "confirm-portion" | "summary";

export function FoodSearchPanel({ onConfirmFood }: FoodSearchPanelProps) {
  const { displayName } = useCompanionName();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<FoodSearchResponse | null>(null);
  const [selectedFood, setSelectedFood] = useState<ExternalFoodSearchResult | null>(null);
  
  const [step, setStep] = useState<Step>("search");
  
  // Portion form state
  const [portionQty, setPortionQty] = useState<number>(1);
  const [portionUnit, setPortionUnit] = useState<string>("porsi");
  const [gramWeight, setGramWeight] = useState<number>(150);

  const [finalScaled, setFinalScaled] = useState<ScaledNutritionResult | null>(null);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q || q.length < 2 || loading) return;

    setLoading(true);
    setResponse(null);
    setSelectedFood(null);
    setStep("search");

    try {
      const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(q)}`);
      const data: FoodSearchResponse = await res.json();
      setResponse(data);
    } catch {
      setResponse({
        success: false,
        query: q,
        results: [],
        source: "Internet",
        error: "Gagal terhubung ke server pencarian nutrisi.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSelectFood(item: ExternalFoodSearchResult) {
    setSelectedFood(item);
    setStep("confirm-identity");
  }

  function handleConfirmIdentity() {
    setStep("confirm-portion");
  }

  function handleCalculatePortion() {
    if (!selectedFood) return;
    const scaled = scaleNutrientsFromPer100g(selectedFood, gramWeight, portionQty, portionUnit);
    setFinalScaled(scaled);
    setStep("summary");
  }

  function handleFinalSave() {
    if (!selectedFood || !finalScaled) return;
    onConfirmFood?.({
      name: selectedFood.name,
      portionLabel: finalScaled.portionLabel,
      scaled: finalScaled,
      sourceLabel: selectedFood.sourceLabel,
    });
  }

  return (
    <div className="space-y-4">
      {/* 1. Free-Text Search Form */}
      {step === "search" && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={80}
                placeholder="Contoh: nasi goreng, tempe, banana, chicken breast…"
                aria-label="Nama Makanan"
                className="input pl-10 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || query.trim().length < 2}
              className="btn btn-primary font-bold shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Mencari…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> Cari Informasi Nutrisi
                </>
              )}
            </button>
          </form>

          {/* Missing API Key / Config Notice */}
          {response?.isMissingApiKey && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber/20 bg-amber/5 p-3.5 text-xs text-amber">
              <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Pencarian Internet Menggunakan Data Demo Fallback</p>
                <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">{response.error}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {response && !response.success && !response.isMissingApiKey && (
            <div className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{response.error}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="py-8 text-center space-y-2" aria-live="polite">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand" />
              <p className="text-xs text-muted-foreground">Mencari basis data nutrisi eksternal…</p>
            </div>
          )}

          {/* Search Results List */}
          {response?.success && response.results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>Hasil Pencarian ({response.results.length} ditemukan)</span>
                <span className="font-medium text-brand">{response.source}</span>
              </div>

              <div className="divide-y divide-line/45 rounded-2xl border border-line bg-card overflow-hidden">
                {response.results.map((item) => (
                  <button
                    key={item.externalId}
                    onClick={() => handleSelectFood(item)}
                    className="w-full p-3.5 text-left hover:bg-secondary/40 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground group-hover:text-brand transition truncate">
                          {item.name}
                        </span>
                        {item.brand && (
                          <span className="pill bg-secondary text-muted-foreground text-[10px] font-semibold">
                            {item.brand}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {item.nutrientsPer100g.caloriesKcal ? `${item.nutrientsPer100g.caloriesKcal} kkal / 100g` : "Kalori tidak tersedia"}
                        {" · "}
                        Protein: {item.nutrientsPer100g.proteinG ?? "-"}g · Karbo: {item.nutrientsPer100g.carbohydrateG ?? "-"}g · Lemak: {item.nutrientsPer100g.fatG ?? "-"}g
                      </p>
                    </div>
                    <span className="btn btn-outline btn-xs font-bold shrink-0 group-hover:border-brand">
                      Pilih Makanan <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results Fallback */}
          {response?.success && response.results.length === 0 && (
            <div className="card card-pad text-center space-y-3 bg-secondary/15 border-line">
              <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-bold text-sm text-foreground">Tidak Ada Hasil Ditemukan</p>
                <p className="text-xs text-muted-foreground mt-0.5">Coba kata kunci lain atau gunakan contoh makanan demo bawaan.</p>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button onClick={() => setQuery("")} className="btn btn-outline btn-xs">Coba Kata Lain</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Step: Identity Confirmation */}
      {step === "confirm-identity" && selectedFood && (
        <div className="space-y-4 animate-fade-up">
          <button onClick={() => setStep("search")} className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Hasil Pencarian
          </button>

          <div className="flex items-start gap-2.5 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-xs text-muted-foreground">
            <HelpCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-sky" />
            <div>
              <p className="font-bold text-foreground">Konfirmasi Identitas Makanan (Langkah 1 dari 2)</p>
              <p className="mt-0.5">Apakah makanan ini yang Anda maksud sebelum menghitung porsi?</p>
            </div>
          </div>

          <div className="card card-pad space-y-3 bg-card border-line">
            <div className="space-y-1">
              <span className="pill bg-brand-soft text-brand text-[10px] font-bold uppercase">{selectedFood.sourceLabel}</span>
              <h3 className="font-display text-xl font-extrabold text-foreground">{selectedFood.name}</h3>
              {selectedFood.brand && <p className="text-xs text-muted-foreground">Merek: {selectedFood.brand}</p>}
            </div>

            <div className="rounded-xl bg-secondary/30 p-3 text-xs space-y-1">
              <p className="font-bold text-foreground">Kandungan per 100 gram:</p>
              <p className="text-muted-foreground">
                Kalori: {selectedFood.nutrientsPer100g.caloriesKcal ?? "-"} kkal · Protein: {selectedFood.nutrientsPer100g.proteinG ?? "-"}g · Karbo: {selectedFood.nutrientsPer100g.carbohydrateG ?? "-"}g · Lemak: {selectedFood.nutrientsPer100g.fatG ?? "-"}g
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => setStep("search")} className="btn btn-outline flex-1 text-xs font-bold">Cari Ulang</button>
            <button onClick={handleConfirmIdentity} className="btn btn-primary flex-1 text-xs font-bold">
              <Check className="h-4 w-4" /> Ya, Gunakan Makanan Ini
            </button>
          </div>
        </div>
      )}

      {/* 3. Step: Portion Confirmation */}
      {step === "confirm-portion" && selectedFood && (
        <div className="space-y-4 animate-fade-up">
          <button onClick={() => setStep("confirm-identity")} className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Konfirmasi Makanan
          </button>

          <div className="flex items-start gap-2.5 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-xs text-muted-foreground">
            <HelpCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-sky" />
            <div>
              <p className="font-bold text-foreground">Konfirmasi Porsi (Langkah 2 dari 2)</p>
              <p className="mt-0.5">Tentukan porsi dan perkiraan berat gram untuk mengalikan zat gizi.</p>
            </div>
          </div>

          <div className="card card-pad space-y-4 bg-card border-line">
            <h4 className="font-display text-base font-bold text-foreground">{selectedFood.name}</h4>

            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              <div>
                <label className="label text-xs font-bold uppercase text-muted-foreground">Jumlah Porsi</label>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={portionQty}
                  onChange={(e) => {
                    const q = parseFloat(e.target.value) || 1;
                    setPortionQty(q);
                    setGramWeight(Math.round(q * 150));
                  }}
                  className="input mt-1"
                />
              </div>

              <div>
                <label className="label text-xs font-bold uppercase text-muted-foreground">Satuan Porsi</label>
                <select
                  value={portionUnit}
                  onChange={(e) => setPortionUnit(e.target.value)}
                  className="input mt-1"
                >
                  <option value="porsi">Porsi</option>
                  <option value="mangkuk">Mangkuk</option>
                  <option value="piring">Piring</option>
                  <option value="potong">Potong</option>
                  <option value="buah">Buah</option>
                  <option value="gram">Gram</option>
                </select>
              </div>

              <div>
                <label className="label text-xs font-bold uppercase text-muted-foreground">Estimasi Berat (gram)</label>
                <input
                  type="number"
                  min="10"
                  max="2000"
                  value={gramWeight}
                  onChange={(e) => setGramWeight(parseInt(e.target.value) || 100)}
                  className="input mt-1"
                />
              </div>
            </div>
          </div>

          <button onClick={handleCalculatePortion} className="btn btn-primary w-full text-xs font-bold">
            <Check className="h-4 w-4" /> Hitung &amp; Tampilkan Ringkasan Nutrisi
          </button>
        </div>
      )}

      {/* 4. Step: Scaled Summary */}
      {step === "summary" && selectedFood && finalScaled && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-center justify-between border-b border-line/45 pb-3">
            <div>
              <span className="pill bg-brand-soft text-brand text-[9px] font-bold uppercase">{selectedFood.sourceLabel}</span>
              <h3 className="font-display text-xl font-extrabold text-foreground mt-1">{selectedFood.name}</h3>
              <p className="text-xs text-muted-foreground">{finalScaled.portionLabel}</p>
            </div>
            <button onClick={() => setStep("confirm-portion")} className="btn btn-outline btn-xs font-bold">
              Ubah Porsi
            </button>
          </div>

          {/* Calorie card */}
          <div className="rounded-2xl bg-gradient-to-br from-brand to-lime p-5 text-center text-white shadow-soft">
            <p className="text-xs font-medium text-white/80">Estimasi Kalori Terhitung</p>
            <p className="stat-num mt-1 text-4xl font-extrabold">{finalScaled.nutrition.kcal}<span className="ml-1 text-base text-white/80 font-normal">kkal</span></p>
          </div>

          {/* Macros grid */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl border border-line p-2.5 bg-card text-center"><p className="text-muted-foreground text-[10px]">Protein</p><p className="font-bold text-foreground text-sm">{finalScaled.nutrition.protein}g</p></div>
            <div className="rounded-xl border border-line p-2.5 bg-card text-center"><p className="text-muted-foreground text-[10px]">Karbo</p><p className="font-bold text-foreground text-sm">{finalScaled.nutrition.carbs}g</p></div>
            <div className="rounded-xl border border-line p-2.5 bg-card text-center"><p className="text-muted-foreground text-[10px]">Lemak</p><p className="font-bold text-foreground text-sm">{finalScaled.nutrition.fat}g</p></div>
            <div className="rounded-xl border border-line p-2.5 bg-card text-center"><p className="text-muted-foreground text-[10px]">Serat</p><p className="font-bold text-foreground text-sm">{finalScaled.nutrition.fiber}g</p></div>
            <div className="rounded-xl border border-line p-2.5 bg-card text-center"><p className="text-muted-foreground text-[10px]">Gula</p><p className="font-bold text-foreground text-sm">{finalScaled.nutrition.sugar}g</p></div>
            <div className="rounded-xl border border-line p-2.5 bg-card text-center"><p className="text-muted-foreground text-[10px]">Sodium</p><p className="font-bold text-foreground text-sm">{finalScaled.nutrition.sodium}mg</p></div>
          </div>

          {/* Source Attribution and Disclaimer */}
          <div className="rounded-2xl border border-line/50 bg-secondary/30 p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-foreground font-bold">
              <ShieldCheck className="h-4 w-4 text-brand" />
              <span>Sumber Data: {selectedFood.sourceLabel}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Informasi nutrisi berasal dari basis data eksternal dan disesuaikan dengan porsi yang dikonfirmasi. Nilainya tetap berupa estimasi dan dapat berbeda karena bahan serta cara pengolahan.
            </p>
          </div>

          {/* Ask Companion Link */}
          <Link
            href={`/companion?analysis=food-analysis-balanced-breakfast`}
            className="btn btn-outline w-full flex items-center justify-center gap-2 font-bold py-3 text-xs"
          >
            <Sparkles className="h-4 w-4 text-brand" /> Tanyakan hasil ini kepada {displayName}
          </Link>

          <div className="flex gap-2">
            <button onClick={() => setStep("search")} className="btn btn-outline flex-1 text-xs font-bold">
              Cari Makanan Lain
            </button>
            <button onClick={handleFinalSave} className="btn btn-primary flex-1 text-xs font-bold">
              <Check className="h-4 w-4" /> Simpan ke Catatan Harian
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
