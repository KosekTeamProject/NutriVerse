import { Info } from "lucide-react";
import { RewardStore } from "@/components/app/RewardStore";

export default function RewardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Reward Store</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tukar Health Points yang kamu kumpulkan dari challenge dan aktivitas dengan reward nyata maupun digital.
        </p>
      </div>

      <RewardStore />

      <div className="flex items-start gap-2 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
        <p>Health Points diperoleh dari menyelesaikan challenge dan aktivitas fisik &mdash; bukan dari scan makanan. Reward mitra dan merchandise hadir bertahap seiring pertumbuhan platform.</p>
      </div>
    </div>
  );
}
