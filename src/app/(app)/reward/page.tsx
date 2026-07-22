import { Info } from "lucide-react";
import { RewardStore } from "@/components/app/RewardStore";

export default function RewardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Toko Hadiah</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tukar Health Points yang kamu kumpulkan dari challenge dan aktivitas dengan reward nyata maupun digital.
        </p>
      </div>

      <RewardStore />

      <div className="flex items-start gap-2 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
        <p>Health Points diperoleh dari tantangan dan aktivitas fisik tervalidasi &mdash; bukan dari pindai makanan. Hadiah mitra dan produk fisik hadir bertahap.</p>
      </div>
    </div>
  );
}
