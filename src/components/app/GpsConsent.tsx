"use client";

import { useState } from "react";
import { MapPin, ShieldCheck, Clock, Database, EyeOff, Check, ChevronDown, Trash2 } from "lucide-react";

const POINTS = [
  { icon: MapPin, title: "Mengapa GPS diperlukan", text: "Untuk menghitung jarak dan pace aktivitas - satu-satunya sumber XP yang terverifikasi." },
  { icon: Clock, title: "Kapan GPS aktif", text: "Hanya selama sesi tracking berjalan dan halaman terbuka." },
  { icon: EyeOff, title: "Kapan GPS berhenti", text: "Segera setelah kamu menghentikan atau menyelesaikan aktivitas." },
  { icon: Database, title: "Data yang digunakan", text: "Sampel rute dipakai selama sesi untuk validasi; ringkasan jarak, durasi, pace, dan status verifikasi dapat disimpan." },
  { icon: EyeOff, title: "Yang tidak pernah ditampilkan", text: "Rute mentah dan koordinat presisi tidak tampil di leaderboard, komunitas, atau profil publik." },
  { icon: Trash2, title: "Retensi & penghapusan", text: "MVP browser tidak mengunggah rute. Kebijakan retensi dan penghapusan server wajib ditetapkan sebelum produksi." },
  { icon: ShieldCheck, title: "Kontrolmu", text: "Kamu dapat menghentikan tracking atau mencabut izin lokasi kapan saja lewat pengaturan browser." },
];

export function GpsConsent() {
  const [agreed, setAgreed] = useState(false);
  const [open, setOpen] = useState(false);

  if (agreed) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-brand/20 bg-brand-soft p-3 text-sm text-brand transition-all">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span className="font-medium text-xs sm:text-sm">Izin lokasi aktif selama tracking.</span>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="text-[10px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100 flex items-center gap-1">
          Info <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="card card-pad border-brand/30 bg-brand/5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-sm sm:text-base font-bold text-foreground">Akses Lokasi (GPS)</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Wajib untuk menghitung jarak & XP.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto mt-2 sm:mt-0">
          <button 
            onClick={() => setOpen((o) => !o)} 
            className="btn btn-ghost flex-1 sm:flex-none text-xs"
          >
            Detail <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          <button 
            onClick={() => setAgreed(true)} 
            className="btn btn-primary flex-1 sm:flex-none text-xs shadow-sm"
          >
            <Check className="h-4 w-4 mr-1" /> Izinkan
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 border-t border-brand/10 pt-4 space-y-3 animate-fade-in">
          {POINTS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground border border-line/50">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{p.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
