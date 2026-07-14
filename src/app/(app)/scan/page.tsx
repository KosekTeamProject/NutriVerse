import { Info, Clock } from "lucide-react";
import { FoodScanner } from "@/components/app/FoodScanner";

const RIWAYAT = [
  { nama: "Nasi Goreng", waktu: "Sarapan · 07:20", kkal: 333 },
  { nama: "Soto Ayam", waktu: "Makan siang · 12:40", kkal: 240 },
  { nama: "Salad Buah", waktu: "Camilan · 16:10", kkal: 180 },
];

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Scan Makanan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Foto makananmu untuk melihat estimasi kalori dan gizi, plus saran cara membakarnya.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
        <p>Fitur ini <span className="font-semibold text-foreground">informatif</span> dan tidak menambah XP. Tujuannya membantumu sadar asupan lalu mengarahkan ke aktivitas fisik sebagai sumber XP.</p>
      </div>

      <FoodScanner />

      <div className="card card-pad">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Catatan hari ini</h2>
          <span className="chip"><Clock className="h-3.5 w-3.5" /> {RIWAYAT.reduce((s, r) => s + r.kkal, 0)} kkal</span>
        </div>
        <div className="mt-4 space-y-2">
          {RIWAYAT.map((r, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-line p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{r.nama}</p>
                <p className="text-xs text-muted-foreground">{r.waktu}</p>
              </div>
              <span className="stat-num text-sm text-muted-foreground">{r.kkal} kkal</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
