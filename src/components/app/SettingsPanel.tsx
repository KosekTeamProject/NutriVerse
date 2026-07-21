"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  User, 
  Target, 
  Palette, 
  Bell, 
  Shield, 
  Check, 
  Sun, 
  Moon, 
  Sparkles, 
  Info, 
  Lock, 
  Activity, 
  HelpCircle 
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useCompanionName } from "@/hooks/useCompanionName";

function Switch({ on, onToggle, ariaLabel }: { readonly on: boolean; readonly onToggle: () => void; readonly ariaLabel: string }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-brand" : "bg-line"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function ToggleRow({ 
  label, 
  desc, 
  on, 
  onToggle 
}: { 
  readonly label: string; 
  readonly desc: string; 
  readonly on: boolean; 
  readonly onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-line/35 last:border-0">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch on={on} onToggle={onToggle} ariaLabel={label} />
    </div>
  );
}

function SectionCard({ 
  icon: Icon, 
  title, 
  children 
}: { 
  readonly icon: typeof User; 
  readonly title: string; 
  readonly children: React.ReactNode;
}) {
  return (
    <div className="card card-pad bg-card border-line space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-line/45">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand shadow-sm"><Icon className="h-5 w-5" /></span>
        <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

function SaveButton() {
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800); }}
      className="btn btn-primary btn-sm mt-4 font-bold"
    >
      {saved ? <><Check className="h-4 w-4" /> Tersimpan</> : "Simpan Perubahan"}
    </button>
  );
}

export function SettingsPanel() {
  const { dark, toggleTheme } = useTheme();
  const companionName = useCompanionName();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(companionName.displayName);
  
  // Local state toggles (MVP simulations)
  const [notif, setNotif] = useState({ aktivitas: true, leaderboard: true, sosial: false });
  const [privasi, setPrivasi] = useState({ 
    publik: false, 
    leaderboard: true, 
    pulsePublic: false,
    activityPublic: false,
    challengePublic: true,
    nutritionPrivate: true,
    recoveryPrivate: true
  });
  const [companion, setCompanion] = useState({
    insights: true,
    morningBrief: true,
    weeklyLetter: true,
    safetyNotes: true
  });
  const [simulation, setSimulation] = useState({
    useDemoData: true,
    showSimLabels: true,
    gpsSimEnabled: true,
    foodSimEnabled: true
  });

  return (
    <div className="space-y-6">
      {/* 1. Profile section */}
      <SectionCard icon={User} title="Profil">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label text-xs font-bold uppercase text-muted-foreground">Nama Lengkap</label>
            <input className="input mt-1.5" defaultValue="Fathan Mubarak" />
          </div>
          <div>
            <label className="label text-xs font-bold uppercase text-muted-foreground">Username</label>
            <input className="input mt-1.5" defaultValue="fathan.mubarak" />
          </div>
          <div className="sm:col-span-2">
            <label className="label text-xs font-bold uppercase text-muted-foreground">Bio</label>
            <input className="input mt-1.5" defaultValue="Building sustainable healthy habits through small, consistent actions." />
          </div>
        </div>
        <SaveButton />
      </SectionCard>

      {/* 2. Target harian section */}
      <SectionCard icon={Target} title="Target Harian">
        <div className="grid gap-4 sm:grid-cols-4 text-xs">
          <div><label className="label text-xs font-bold uppercase text-muted-foreground">Protein Target (g)</label><input className="input mt-1.5" defaultValue="80" /></div>
          <div><label className="label text-xs font-bold uppercase text-muted-foreground">Air Target (L)</label><input className="input mt-1.5" defaultValue="2.0" /></div>
          <div><label className="label text-xs font-bold uppercase text-muted-foreground">Langkah Target</label><input className="input mt-1.5" defaultValue="10000" /></div>
          <div><label className="label text-xs font-bold uppercase text-muted-foreground">Tidur (jam)</label><input className="input mt-1.5" defaultValue="8" /></div>
        </div>
        <SaveButton />
      </SectionCard>

      {/* 3. Appearance section */}
      <SectionCard icon={Palette} title="Tampilan">
        <div className="flex items-center justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Mode Gelap</p>
            <p className="text-xs text-muted-foreground">Ganti tema terang atau gelap aplikasi</p>
          </div>
          <button onClick={toggleTheme} className="btn btn-outline btn-sm font-bold flex items-center gap-1.5">
            {dark ? <><Sun className="h-4 w-4" /> Terang</> : <><Moon className="h-4 w-4" /> Gelap</>}
          </button>
        </div>
      </SectionCard>

      {/* 4. Privacy settings */}
      <SectionCard icon={Shield} title="Privasi">
        <div className="divide-y divide-line/35">
          <ToggleRow label="Profil Publik" desc="Izinkan orang lain mencari dan melihat profilmu" on={privasi.publik} onToggle={() => setPrivasi((s) => ({ ...s, publik: !s.publik }))} />
          <ToggleRow label="Tampil di Leaderboard" desc="Sertakan aku di peringkat konsistensi publik" on={privasi.leaderboard} onToggle={() => setPrivasi((s) => ({ ...s, leaderboard: !s.leaderboard }))} />
          <ToggleRow label="Bagi Health Pulse Score" desc="Izinkan Circle melihat nilai Pulse kesehatanmu" on={privasi.pulsePublic} onToggle={() => setPrivasi((s) => ({ ...s, pulsePublic: !s.pulsePublic }))} />
          <ToggleRow label="Bagi Ringkasan Aktivitas" desc="Tampilkan jarak tempuh fisik di feed Circle" on={privasi.activityPublic} onToggle={() => setPrivasi((s) => ({ ...s, activityPublic: !s.activityPublic }))} />
          <ToggleRow label="Tampilkan Progress Challenge" desc="Perlihatkan keaktifan tantangan mingguan" on={privasi.challengePublic} onToggle={() => setPrivasi((s) => ({ ...s, challengePublic: !s.challengePublic }))} />
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-brand" /> Catatan Gizi &amp; Pemulihan</p>
              <p className="text-xs text-muted-foreground">Catatan makanan, air, dan tidur selalu diset privat penuh</p>
            </div>
            <span className="pill bg-brand-soft text-brand font-bold text-[10px]">Privat Penuh</span>
          </div>
        </div>
        <SaveButton />
      </SectionCard>

      {/* 5. Companion settings */}
      <SectionCard icon={Sparkles} title={`${companionName.displayName} Companion`}>
        <div className="divide-y divide-line/35">
          {/* Display Name Edit Row */}
          <div className="py-3.5 space-y-2 border-b border-line/35">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Nama Tampilan Companion</p>
                <p className="text-xs text-muted-foreground">Nama ini digunakan pada Morning Brief, chat, refleksi, dan insight Companion.</p>
              </div>
              {!isEditingName && (
                <button
                  onClick={() => { setIsEditingName(true); setNameInput(companionName.displayName); }}
                  className="btn btn-outline btn-xs font-bold shrink-0"
                >
                  Edit Nama
                </button>
              )}
            </div>

            {isEditingName ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={24}
                  placeholder="Contoh: Nora, Aira, Maya…"
                  className="input text-sm flex-1"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      companionName.setDisplayName(nameInput);
                      setIsEditingName(false);
                    }}
                    className="btn btn-primary btn-xs font-bold"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="btn btn-outline btn-xs font-semibold text-muted-foreground"
                  >
                    Batal
                  </button>
                  {!companionName.isDefault && (
                    <button
                      onClick={() => {
                        companionName.resetToDefault();
                        setNameInput("Nora");
                        setIsEditingName(false);
                      }}
                      className="btn btn-ghost btn-xs font-semibold text-muted-foreground"
                    >
                      Kembalikan ke Nora
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs bg-secondary/30 rounded-xl p-2.5">
                <span className="text-muted-foreground">Nama Aktif: <strong className="text-foreground">{companionName.displayName}</strong></span>
                {!companionName.isDefault && (
                  <button
                    onClick={() => companionName.resetToDefault()}
                    className="text-[10px] text-brand underline font-bold"
                  >
                    Kembalikan ke Nora
                  </button>
                )}
              </div>
            )}
          </div>

          <ToggleRow label={`${companionName.displayName} Contextual Insights`} desc={`Tampilkan kartu refleksi dan masukan dari ${companionName.displayName}`} on={companion.insights} onToggle={() => setCompanion((s) => ({ ...s, insights: !s.insights }))} />
          <ToggleRow label="Morning Brief" desc={`Aktifkan ringkasan pagi ${companionName.displayName} di halaman utama`} on={companion.morningBrief} onToggle={() => setCompanion((s) => ({ ...s, morningBrief: !s.morningBrief }))} />
          <ToggleRow label="Weekly Letter Preview" desc={`Sertakan evaluasi siklus mingguan ${companionName.displayName}`} on={companion.weeklyLetter} onToggle={() => setCompanion((s) => ({ ...s, weeklyLetter: !s.weeklyLetter }))} />
          <ToggleRow label="Safety Reminders" desc="Ingatkan batas latihan fisik dan disclaimer klinis" on={companion.safetyNotes} onToggle={() => setCompanion((s) => ({ ...s, safetyNotes: !s.safetyNotes }))} />
        </div>
        <div className="mt-3 flex items-start gap-2 text-[10px] text-muted-foreground bg-secondary/30 rounded-xl p-3 border border-line/20">
          <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <p>{companionName.displayName} tidak menghitung Health Pulse, memverifikasi aktivitas, memberikan reward, atau mendiagnosis kondisi medis.</p>
        </div>
        <SaveButton />
      </SectionCard>

      {/* 6. Activity & Location settings */}
      <SectionCard icon={Activity} title="Latihan &amp; Lokasi">
        <div className="space-y-4 text-xs text-muted-foreground">
          <div className="flex justify-between items-center border border-line p-3.5 rounded-xl bg-secondary/15">
            <div>
              <p className="font-bold text-foreground">Location Permission for Activity</p>
              <p className="mt-0.5 text-[11px]">NutriVerse uses location data only during active sessions to measure distance and pace.</p>
            </div>
            <Link href="/aktivitas/kepercayaan" className="btn btn-outline btn-xs shrink-0 font-bold flex items-center gap-1">
              Trust &amp; Safety <HelpCircle className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="italic text-[10px]">
            * Background tracking and coordinate export are not supported to protect your location privacy.
          </p>
        </div>
      </SectionCard>

      {/* 7. Demo & Simulation settings */}
      <SectionCard icon={HelpCircle} title="Demo &amp; Simulasi">
        <div className="divide-y divide-line/35">
          <ToggleRow label="Gunakan Data Deterministic" desc="Muat dataset demo default untuk simulasi perjalanan" on={simulation.useDemoData} onToggle={() => setSimulation((s) => ({ ...s, useDemoData: !s.useDemoData }))} />
          <ToggleRow label="Tampilkan Label Simulasi" desc="Perlihatkan tanda Simulated pada panel data non-aktif" on={simulation.showSimLabels} onToggle={() => setSimulation((s) => ({ ...s, showSimLabels: !s.showSimLabels }))} />
          <ToggleRow label="Simulasi GPS Lokasi" desc="Izinkan mode simulator lokasi di tracker latihan" on={simulation.gpsSimEnabled} onToggle={() => setSimulation((s) => ({ ...s, gpsSimEnabled: !s.gpsSimEnabled }))} />
          <ToggleRow label="Simulasi Foto Makanan" desc="Gunakan daftar demo makanan di scanner AI" on={simulation.foodSimEnabled} onToggle={() => setSimulation((s) => ({ ...s, foodSimEnabled: !s.foodSimEnabled }))} />
        </div>
        <SaveButton />
      </SectionCard>

      {/* 8. Notification settings */}
      <SectionCard icon={Bell} title="Notifikasi">
        <div className="divide-y divide-line/35">
          <ToggleRow label="Pengingat Aktivitas" desc="Ingatkan untuk bergerak dan mencatat hidrasi" on={notif.aktivitas} onToggle={() => setNotif((s) => ({ ...s, aktivitas: !s.aktivitas }))} />
          <ToggleRow label="Update Leaderboard" desc="Beri tahu saat peringkat mingguan diperbarui" on={notif.leaderboard} onToggle={() => setNotif((s) => ({ ...s, leaderboard: !s.leaderboard }))} />
          <ToggleRow label="Semangat &amp; Dukungan" desc="Notifikasi saat anggota Circle memberi dorongan semangat" on={notif.sosial} onToggle={() => setNotif((s) => ({ ...s, sosial: !s.sosial }))} />
        </div>
        <SaveButton />
      </SectionCard>

      {/* 9. Data and Export */}
      <div className="card card-pad bg-secondary/20 border-line space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Data Control</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Preferences and locally cached files are stored on this browser only.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="btn btn-outline text-destructive flex-1" onClick={() => alert("Simulated clear complete.")}>
            Clear Local Cache
          </button>
          <button className="btn btn-ghost flex-1 text-muted-foreground font-semibold">
            Logout (Demo)
          </button>
        </div>
      </div>
    </div>
  );
}
