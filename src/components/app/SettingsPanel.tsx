"use client";

import { useEffect, useState } from "react";
import { User, Target, Palette, Bell, Shield, LogOut, Check, Sun, Moon } from "lucide-react";

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-brand" : "bg-line"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function ToggleRow({ label, desc, on, onToggle }: { label: string; desc: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch on={on} onToggle={onToggle} />
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <div className="card card-pad">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="h-5 w-5" /></span>
        <h2 className="font-display text-lg font-bold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SaveButton() {
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800); }}
      className="btn btn-primary btn-sm mt-4"
    >
      {saved ? <><Check className="h-4 w-4" /> Tersimpan</> : "Simpan perubahan"}
    </button>
  );
}

export function SettingsPanel() {
  const [dark, setDark] = useState(false);
  const [notif, setNotif] = useState({ aktivitas: true, leaderboard: true, sosial: false });
  const [privasi, setPrivasi] = useState({ publik: true, leaderboard: true });

  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);

  const toggleTheme = () => {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try { localStorage.setItem("nv-theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  };

  return (
    <div className="space-y-6">
      <SectionCard icon={User} title="Profil">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nama lengkap</label>
            <input className="input" defaultValue="Rafi Adiputra" />
          </div>
          <div>
            <label className="label">Username</label>
            <input className="input" defaultValue="rafi.adiputra" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Email</label>
            <input className="input" type="email" defaultValue="rafi@example.com" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Bio</label>
            <input className="input" defaultValue="Mahasiswa AMIKOM. Suka lari pagi." />
          </div>
        </div>
        <SaveButton />
      </SectionCard>

      <SectionCard icon={Target} title="Target harian">
        <div className="grid gap-4 sm:grid-cols-4">
          <div><label className="label">Kalori</label><input className="input" defaultValue="2200" /></div>
          <div><label className="label">Protein (g)</label><input className="input" defaultValue="90" /></div>
          <div><label className="label">Air (L)</label><input className="input" defaultValue="2.0" /></div>
          <div><label className="label">Tidur (jam)</label><input className="input" defaultValue="8" /></div>
        </div>
        <SaveButton />
      </SectionCard>

      <SectionCard icon={Palette} title="Tampilan">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Mode gelap</p>
            <p className="text-xs text-muted-foreground">Ganti tema terang atau gelap</p>
          </div>
          <button onClick={toggleTheme} className="btn btn-outline btn-sm">
            {dark ? <><Sun className="h-4 w-4" /> Terang</> : <><Moon className="h-4 w-4" /> Gelap</>}
          </button>
        </div>
      </SectionCard>

      <SectionCard icon={Bell} title="Notifikasi">
        <div className="divide-y divide-line">
          <ToggleRow label="Pengingat aktivitas" desc="Ingatkan untuk bergerak setiap hari" on={notif.aktivitas} onToggle={() => setNotif((s) => ({ ...s, aktivitas: !s.aktivitas }))} />
          <ToggleRow label="Update leaderboard" desc="Beri tahu saat peringkatmu berubah" on={notif.leaderboard} onToggle={() => setNotif((s) => ({ ...s, leaderboard: !s.leaderboard }))} />
          <ToggleRow label="Semangat & komentar" desc="Notifikasi interaksi sosial" on={notif.sosial} onToggle={() => setNotif((s) => ({ ...s, sosial: !s.sosial }))} />
        </div>
      </SectionCard>

      <SectionCard icon={Shield} title="Privasi">
        <div className="divide-y divide-line">
          <ToggleRow label="Profil publik" desc="Izinkan orang lain melihat profilmu" on={privasi.publik} onToggle={() => setPrivasi((s) => ({ ...s, publik: !s.publik }))} />
          <ToggleRow label="Tampil di leaderboard" desc="Sertakan aku di peringkat publik" on={privasi.leaderboard} onToggle={() => setPrivasi((s) => ({ ...s, leaderboard: !s.leaderboard }))} />
        </div>
      </SectionCard>

      <div className="card card-pad">
        <button className="btn btn-outline w-full text-destructive"><LogOut className="h-[18px] w-[18px]" /> Keluar</button>
      </div>
    </div>
  );
}
