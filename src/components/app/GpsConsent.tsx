"use client";

import { useState } from "react";
import { MapPin, ShieldCheck, Clock, Database, EyeOff, Check, ChevronDown } from "lucide-react";

const POINTS = [
  { icon: MapPin, title: "Mengapa GPS diperlukan", text: "Untuk menghitung jarak dan pace aktivitas - satu-satunya sumber XP yang terverifikasi." },
  { icon: Clock, title: "Kapan GPS aktif", text: "Hanya selama sesi tracking berjalan dan halaman terbuka." },
  { icon: EyeOff, title: "Kapan GPS berhenti", text: "Segera setelah kamu menghentikan atau menyelesaikan aktivitas." },
  { icon: Database, title: "Data yang disimpan", text: "Ringkasan jarak, durasi, pace, dan XP - bukan pelacakan lokasi terus-menerus." },
  { icon: ShieldCheck, title: "Privasi", text: "Lokasi tidak dibagikan publik. Kamu bisa mencabut izin kapan saja lewat pengaturan." },
];

export function GpsConsent() {
  const [agreed, setAgreed] = useState(false);
  const [open, setOpen] = useState(true);

  if (agreed) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-brand/20 bg-brand-soft p-3 text-sm text-brand">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span className="font-medium">Izin lokasi disetujui. GPS hanya aktif selama sesi tracking berjalan.</span>
      </div>
    );
  }

  return (
    <div className="card card-pad">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><MapPin className="h-5 w-5" /></span>
        <div className="flex-1">
          <h2 className="font-display text-base font-bold">Izin lokasi (GPS)</h2>
          <p className="text-xs text-muted-foreground">Baca dulu sebelum memulai tracking</p>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="mt-4 space-y-3">
            {POINTS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground"><Icon className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm font-semibold">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setAgreed(true)} className="btn btn-primary mt-4 w-full"><Check className="h-[18px] w-[18px]" /> Saya mengerti, izinkan lokasi</button>
        </>
      )}
    </div>
  );
}
