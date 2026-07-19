import { Footprints, Bike, ShieldCheck, Info } from "lucide-react";
import { ActivityTracker } from "@/components/app/ActivityTracker";
import { GpsConsent } from "@/components/app/GpsConsent";

const RIWAYAT = [
  { tanggal: "Hari ini", jenis: "run", jarak: "5,20", durasi: "31:40", xp: 520 },
  { tanggal: "Kemarin", jenis: "bike", jarak: "14,00", durasi: "38:12", xp: 630 },
  { tanggal: "2 hari lalu", jenis: "run", jarak: "3,10", durasi: "19:05", xp: 310 },
];

export default function AktivitasPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Aktivitas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lari, bersepeda, atau jalan kaki untuk mengumpulkan XP. Hanya aktivitas fisik nyata yang dihitung.
        </p>
      </div>

      <GpsConsent />

      <div className="flex items-start gap-2 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
        <p>
          Pelacakan memakai GPS browser dan berjalan selama halaman terbuka. Sedang di dalam ruangan atau ingin
          menguji tampilannya? Aktifkan <span className="font-semibold text-foreground">Mode simulasi</span> sebelum menekan Mulai.
        </p>
      </div>

      <ActivityTracker />

      <div className="card card-pad">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Riwayat aktivitas</h2>
          <span className="chip"><ShieldCheck className="h-3.5 w-3.5" /> Tervalidasi</span>
        </div>
        <div className="mt-4 space-y-2">
          {RIWAYAT.map((r, i) => {
            const Icon = r.jenis === "run" ? Footprints : Bike;
            return (
              <div key={i} className="flex items-center gap-4 rounded-2xl border border-line p-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{r.jenis === "run" ? "Lari" : "Bersepeda"} {r.jarak} km</p>
                  <p className="text-xs text-muted-foreground">{r.tanggal} &middot; {r.durasi}</p>
                </div>
                <span className="pill bg-amber/15 text-amber">+{r.xp} XP</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
