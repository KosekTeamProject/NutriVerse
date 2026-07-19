import { Info } from "lucide-react";
import { FoodLogger } from "@/components/app/FoodLogger";

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Scan Makanan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Foto makananmu atau catat manual untuk melihat estimasi kalori dan gizi, plus saran cara membakarnya.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
        <p>Fitur ini <span className="font-semibold text-foreground">informatif</span> dan tidak menambah XP. Tujuannya membantumu sadar asupan lalu mengarahkan ke aktivitas fisik sebagai sumber XP.</p>
      </div>

      <FoodLogger />
    </div>
  );
}
