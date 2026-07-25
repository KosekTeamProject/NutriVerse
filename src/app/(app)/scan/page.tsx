import { FoodLogger } from "@/components/app/FoodLogger";

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Analisis Nutrisi Pintar</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Pindai makanan menggunakan kamera, catat secara manual, atau dapatkan rekomendasi menu harian dari AI dalam hitungan detik.
        </p>
      </div>

      <div data-tour="scan-demo">
        <FoodLogger />
      </div>
    </div>
  );
}
