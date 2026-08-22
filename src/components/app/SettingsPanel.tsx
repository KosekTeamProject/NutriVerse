"use client";

import { useEffect, useState } from "react";
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
  HelpCircle,
  TimerReset,
  StretchHorizontal,
  MessageCircle,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useCompanionName } from "@/hooks/useCompanionName";
import {
  BREAK_REMINDER_EVENT,
  BREAK_REMINDER_KEY,
  BREAK_REMINDER_PREVIEW_EVENT,
  type BreakReminderPreference,
} from "@/components/app/WellbeingReminder";
import { useAuthSession } from "@/hooks/useAuthSession";
import { clearAuthSession, updateAuthSession } from "@/features/auth/session";
import { notifyDataChanged } from "@/lib/data-sync";

type ProfileDraft = {
  name: string;
  username: string;
  bio: string;
};

type ProfileFeedback = {
  tone: "success" | "error";
  message: string;
};

type DailyTargetDraft = {
  calories: number;
  protein: number;
  waterLiters: number;
  steps: number;
  sleepHours: number;
};

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

function SaveButton({
  onSave,
  disabled = false,
}: {
  readonly onSave: () => Promise<void>;
  readonly disabled?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setStatus("saving");
    try {
      await onSave();
      setStatus("saved");
    } catch {
      setStatus("error");
    }
    window.setTimeout(() => setStatus("idle"), 1800);
  }

  return (
    <button
      type="button"
      onClick={() => void save()}
      disabled={disabled || status === "saving"}
      className="btn btn-primary btn-sm mt-4 font-bold disabled:cursor-not-allowed disabled:opacity-60"
    >
      {status === "saving"
        ? "Menyimpan..."
        : status === "saved"
          ? <><Check className="h-4 w-4" /> Tersimpan</>
          : status === "error"
            ? "Gagal menyimpan"
            : "Simpan Perubahan"}
    </button>
  );
}

export function SettingsPanel() {
  const session = useAuthSession();
  const { dark, toggleTheme } = useTheme();
  const companionName = useCompanionName();
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    name: session?.name ?? "",
    username: session?.username ?? "",
    bio: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<ProfileFeedback | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [targets, setTargets] = useState<DailyTargetDraft>({
    calories: 2000,
    protein: 80,
    waterLiters: 2,
    steps: 8000,
    sleepHours: 8,
  });

  const [notif, setNotif] = useState({ aktivitas: true, leaderboard: true, sosial: false, momentLikes: true, momentComments: true, community: true });
  const [momentPrivacy, setMomentPrivacy] = useState({
    showLikeCount: true,
    likerList: "AUDIENCE" as "AUDIENCE" | "OWNER_ONLY",
    comments: "AUDIENCE" as "AUDIENCE" | "FRIENDS_ONLY" | "OFF",
    hiddenWords: "",
  });
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
  const [breakReminder, setBreakReminder] = useState<BreakReminderPreference>({ enabled: false, intervalMinutes: 60 });

  async function logout() {
    if (!window.confirm("Yakin ingin keluar dari akun NutriVerse?")) return;
    const response = await fetch("/api/auth/sign-out", { method: "POST" }).catch(
      () => null,
    );
    if (response && !response.ok) {
      window.alert("Sesi belum dapat diakhiri. Silakan coba lagi.");
      return;
    }
    clearAuthSession();
    window.location.assign("/");
  }

  useEffect(() => {
    if (!session?.email) return;
    let cancelled = false;

    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as {
          profile?: {
            name: string;
            username: string | null;
            bio: string | null;
          };
        } | null;
        if (!response.ok || !result?.profile || cancelled) return;
        setProfileDraft({
          name: result.profile.name,
          username: result.profile.username ?? session.username,
          bio: result.profile.bio ?? "",
        });
      })
      .catch(() => {
        // Data session tetap dapat dipakai jika profil belum dapat dimuat.
      });

    return () => {
      cancelled = true;
    };
  }, [session?.email, session?.name, session?.username]);

  useEffect(() => {
    if (!session?.email) return;
    let cancelled = false;

    fetch("/api/settings", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as {
          settings?: {
            profileVisibility: "PRIVATE" | "CIRCLE" | "PUBLIC";
            pulseVisibility: "PRIVATE" | "CIRCLE" | "PUBLIC";
            activityVisibility: "PRIVATE" | "CIRCLE" | "PUBLIC";
            leaderboardVisible: boolean;
            challengeProgressVisible: boolean;
            notificationsActivity: boolean;
            notificationsLeaderboard: boolean;
            notificationsSocial: boolean;
            notificationsMomentLikes: boolean;
            notificationsMomentComments: boolean;
            notificationsCommunity: boolean;
            defaultMomentShowLikeCount: boolean;
            defaultMomentLikerList: "AUDIENCE" | "OWNER_ONLY";
            defaultMomentComments: "AUDIENCE" | "FRIENDS_ONLY" | "OFF";
            momentHiddenWords: string[];
            companionInsightsEnabled: boolean;
            companionSafetyNotesEnabled: boolean;
            useDemoData: boolean;
            showSimulationLabels: boolean;
            gpsSimulationEnabled: boolean;
            foodSimulationEnabled: boolean;
          } | null;
          companion?: {
            morningBriefEnabled: boolean;
            weeklyLetterEnabled: boolean;
            breakReminderEnabled: boolean;
            breakReminderIntervalMinutes: number;
          } | null;
          healthProfile?: {
            dailyCalorieTarget: number;
            dailyProteinTargetGrams: number;
            dailyWaterTargetMl: number;
            dailyStepTarget: number;
            dailySleepTargetHours: number;
          } | null;
        } | null;
        if (!response.ok || !result || cancelled) return;

        if (result.settings) {
          setPrivasi((current) => ({
            ...current,
            publik: result.settings!.profileVisibility === "PUBLIC",
            leaderboard: result.settings!.leaderboardVisible,
            pulsePublic: result.settings!.pulseVisibility !== "PRIVATE",
            activityPublic: result.settings!.activityVisibility !== "PRIVATE",
            challengePublic: result.settings!.challengeProgressVisible,
          }));
          setNotif({
            aktivitas: result.settings.notificationsActivity,
            leaderboard: result.settings.notificationsLeaderboard,
            sosial: result.settings.notificationsSocial,
            momentLikes: result.settings.notificationsMomentLikes,
            momentComments: result.settings.notificationsMomentComments,
            community: result.settings.notificationsCommunity,
          });
          setMomentPrivacy({
            showLikeCount: result.settings.defaultMomentShowLikeCount,
            likerList: result.settings.defaultMomentLikerList,
            comments: result.settings.defaultMomentComments,
            hiddenWords: result.settings.momentHiddenWords.join(", "),
          });
          setCompanion((current) => ({
            ...current,
            insights: result.settings!.companionInsightsEnabled,
            safetyNotes: result.settings!.companionSafetyNotesEnabled,
          }));
          setSimulation({
            useDemoData: result.settings.useDemoData,
            showSimLabels: result.settings.showSimulationLabels,
            gpsSimEnabled: result.settings.gpsSimulationEnabled,
            foodSimEnabled: result.settings.foodSimulationEnabled,
          });
        }
        if (result.companion) {
          setCompanion((current) => ({
            ...current,
            morningBrief: result.companion!.morningBriefEnabled,
            weeklyLetter: result.companion!.weeklyLetterEnabled,
          }));
          const storedReminder = {
            enabled: result.companion.breakReminderEnabled,
            intervalMinutes: result.companion.breakReminderIntervalMinutes,
          };
          setBreakReminder(storedReminder);
          window.localStorage.setItem(
            BREAK_REMINDER_KEY,
            JSON.stringify(storedReminder),
          );
          window.dispatchEvent(new Event(BREAK_REMINDER_EVENT));
        }
        if (result.healthProfile) {
          setTargets({
            calories: result.healthProfile.dailyCalorieTarget,
            protein: result.healthProfile.dailyProteinTargetGrams,
            waterLiters: result.healthProfile.dailyWaterTargetMl / 1_000,
            steps: result.healthProfile.dailyStepTarget,
            sleepHours: result.healthProfile.dailySleepTargetHours,
          });
        }
      })
      .catch(() => {
        // Nilai aman tetap tersedia jika koneksi preferensi sedang terputus.
      })
      .finally(() => {
        if (!cancelled) setSettingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.email]);

  async function saveSettings(payload: Record<string, boolean | number | string | string[]>) {
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      error?: string;
    } | null;
    if (!response.ok || !result?.success) {
      throw new Error(result?.error || "Preferensi belum dapat disimpan.");
    }
    notifyDataChanged();
  }

  function updateBreakReminder(next: BreakReminderPreference) {
    setBreakReminder(next);
    window.localStorage.setItem(BREAK_REMINDER_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(BREAK_REMINDER_EVENT));
    void saveSettings({
      breakReminderEnabled: next.enabled,
      breakReminderIntervalMinutes: next.intervalMinutes,
    });
  }

  async function saveProfile() {
    const name = profileDraft.name.trim();
    const username = profileDraft.username.trim().toLowerCase();
    const bio = profileDraft.bio.trim();

    if (name.length < 2) {
      setProfileFeedback({ tone: "error", message: "Nama minimal 2 karakter." });
      return;
    }
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      setProfileFeedback({
        tone: "error",
        message:
          "Username 3-30 karakter dan hanya boleh memakai huruf, angka, titik, garis bawah, atau tanda hubung.",
      });
      return;
    }

    setProfileSaving(true);
    setProfileFeedback(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, username, bio }),
      });
      const result = (await response.json().catch(() => null)) as {
        profile?: { name: string; username: string | null; bio: string | null };
        error?: string;
      } | null;
      if (!response.ok || !result?.profile) {
        throw new Error(result?.error || "Profil belum dapat diperbarui.");
      }

      const savedProfile = {
        name: result.profile.name,
        username: result.profile.username ?? username,
        bio: result.profile.bio ?? "",
      };
      setProfileDraft(savedProfile);
      updateAuthSession({
        name: savedProfile.name,
        username: savedProfile.username,
      });
      setProfileFeedback({
        tone: "success",
        message: "Nama, username, dan bio berhasil disimpan.",
      });
    } catch (error) {
      setProfileFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Profil belum dapat diperbarui.",
      });
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Profile section */}
      <SectionCard icon={User} title="Profil">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-profile-name" className="label text-xs font-bold uppercase text-muted-foreground">Nama Lengkap</label>
            <input
              id="settings-profile-name"
              className="input mt-1.5"
              value={profileDraft.name}
              onChange={(event) => {
                setProfileDraft((current) => ({ ...current, name: event.target.value }));
                setProfileFeedback(null);
              }}
              autoComplete="name"
              maxLength={100}
            />
          </div>
          <div>
            <label htmlFor="settings-profile-username" className="label text-xs font-bold uppercase text-muted-foreground">Username</label>
            <input
              id="settings-profile-username"
              className="input mt-1.5"
              value={profileDraft.username}
              onChange={(event) => {
                setProfileDraft((current) => ({ ...current, username: event.target.value }));
                setProfileFeedback(null);
              }}
              autoCapitalize="none"
              autoComplete="username"
              minLength={3}
              maxLength={30}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="settings-profile-bio" className="label text-xs font-bold uppercase text-muted-foreground">Bio</label>
            <input
              id="settings-profile-bio"
              className="input mt-1.5"
              value={profileDraft.bio}
              onChange={(event) => {
                setProfileDraft((current) => ({ ...current, bio: event.target.value }));
                setProfileFeedback(null);
              }}
              maxLength={300}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={saveProfile}
          disabled={profileSaving}
          className="btn btn-primary btn-sm mt-4 font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {profileSaving ? "Menyimpan..." : <><Check className="h-4 w-4" /> Simpan Perubahan</>}
        </button>
        {profileFeedback && (
          <p
            className={`mt-2 text-xs font-semibold ${
              profileFeedback.tone === "success" ? "text-brand" : "text-destructive"
            }`}
            role={profileFeedback.tone === "error" ? "alert" : "status"}
          >
            {profileFeedback.message}
          </p>
        )}
      </SectionCard>

      {/* 2. Target harian section */}
      <SectionCard icon={Target} title="Target Harian">
        <div className="grid gap-4 sm:grid-cols-4 text-xs">
          <div><label className="label text-xs font-bold uppercase text-muted-foreground">Target Protein (g)</label><input className="input mt-1.5" type="number" min={10} max={1000} value={targets.protein} onChange={(event) => setTargets((current) => ({ ...current, protein: Number(event.target.value) }))} /></div>
          <div><label className="label text-xs font-bold uppercase text-muted-foreground">Target Air (L)</label><input className="input mt-1.5" type="number" min={0.25} max={10} step={0.1} value={targets.waterLiters} onChange={(event) => setTargets((current) => ({ ...current, waterLiters: Number(event.target.value) }))} /></div>
          <div><label className="label text-xs font-bold uppercase text-muted-foreground">Target Langkah</label><input className="input mt-1.5" type="number" min={1000} max={100000} step={500} value={targets.steps} onChange={(event) => setTargets((current) => ({ ...current, steps: Number(event.target.value) }))} /></div>
          <div><label className="label text-xs font-bold uppercase text-muted-foreground">Tidur (jam)</label><input className="input mt-1.5" type="number" min={1} max={24} step={0.5} value={targets.sleepHours} onChange={(event) => setTargets((current) => ({ ...current, sleepHours: Number(event.target.value) }))} /></div>
        </div>
        <SaveButton
          disabled={settingsLoading}
          onSave={() =>
            saveSettings({
              dailyProteinTargetGrams: targets.protein,
              dailyWaterTargetMl: Math.round(targets.waterLiters * 1_000),
              dailyStepTarget: targets.steps,
              dailySleepTargetHours: targets.sleepHours,
            })
          }
        />
      </SectionCard>

      {/* 3. Appearance section */}
      <SectionCard icon={Palette} title="Tampilan">
        <div className="flex items-center justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Mode Gelap</p>
            <p className="text-xs text-muted-foreground">Ganti tema terang atau gelap aplikasi</p>
          </div>
          <button
            onClick={() => {
              toggleTheme();
              void saveSettings({ darkTheme: !dark });
            }}
            className="btn btn-outline btn-sm font-bold flex items-center gap-1.5"
          >
            {dark ? <><Sun className="h-4 w-4" /> Terang</> : <><Moon className="h-4 w-4" /> Gelap</>}
          </button>
        </div>
      </SectionCard>

      {/* 4. Privacy settings */}
      <SectionCard icon={Shield} title="Privasi">
        <div className="divide-y divide-line/35">
          <ToggleRow label="Profil Publik" desc="Izinkan orang lain mencari dan melihat profilmu" on={privasi.publik} onToggle={() => setPrivasi((s) => ({ ...s, publik: !s.publik }))} />
          <ToggleRow label="Tampil di Peringkat" desc="Sertakan aku di peringkat konsistensi publik" on={privasi.leaderboard} onToggle={() => setPrivasi((s) => ({ ...s, leaderboard: !s.leaderboard }))} />
          <ToggleRow label="Bagikan Nilai Health Pulse" desc="Izinkan Lingkaran Sehat melihat nilai Pulse-mu" on={privasi.pulsePublic} onToggle={() => setPrivasi((s) => ({ ...s, pulsePublic: !s.pulsePublic }))} />
          <ToggleRow label="Bagikan Ringkasan Aktivitas" desc="Tampilkan jarak tempuh di aktivitas komunitas" on={privasi.activityPublic} onToggle={() => setPrivasi((s) => ({ ...s, activityPublic: !s.activityPublic }))} />
          <ToggleRow label="Tampilkan Progres Tantangan" desc="Perlihatkan keaktifan tantangan mingguan" on={privasi.challengePublic} onToggle={() => setPrivasi((s) => ({ ...s, challengePublic: !s.challengePublic }))} />
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-brand" /> Catatan Gizi &amp; Pemulihan</p>
              <p className="text-xs text-muted-foreground">Catatan makanan, air, dan tidur selalu diset privat penuh</p>
            </div>
            <span className="pill bg-brand-soft text-brand font-bold text-[10px]">Privat Penuh</span>
          </div>
        </div>
        <SaveButton
          disabled={settingsLoading}
          onSave={() =>
            saveSettings({
              profileVisibility: privasi.publik ? "PUBLIC" : "CIRCLE",
              pulseVisibility: privasi.pulsePublic ? "CIRCLE" : "PRIVATE",
              activityVisibility: privasi.activityPublic ? "CIRCLE" : "PRIVATE",
              leaderboardVisible: privasi.leaderboard,
              challengeProgressVisible: privasi.challengePublic,
            })
          }
        />
      </SectionCard>

      <SectionCard icon={MessageCircle} title="Privasi & Interaksi Momen">
        <div className="rounded-2xl border border-brand/15 bg-brand-soft/35 p-4">
          <p className="text-sm font-bold text-foreground">Pengaturan bawaan unggahan baru</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Setiap Momen tetap dapat diatur ulang secara terpisah sebelum atau setelah diunggah.</p>
        </div>
        <div className="mt-3 divide-y divide-line/35">
          <ToggleRow label="Tampilkan jumlah suka" desc="Pengguna yang dapat melihat Momen juga melihat total suka" on={momentPrivacy.showLikeCount} onToggle={() => setMomentPrivacy((current) => ({ ...current, showLikeCount: !current.showLikeCount }))} />
          <div className="grid gap-2 py-3 sm:grid-cols-[1fr_220px] sm:items-center">
            <div><p className="text-sm font-semibold">Daftar pengguna yang menyukai</p><p className="text-xs text-muted-foreground">Pemilik Momen selalu dapat melihat daftar untuk moderasi.</p></div>
            <select className="input" value={momentPrivacy.likerList} onChange={(event) => setMomentPrivacy((current) => ({ ...current, likerList: event.target.value as "AUDIENCE" | "OWNER_ONLY" }))}>
              <option value="AUDIENCE">Terlihat oleh audiens</option>
              <option value="OWNER_ONLY">Hanya saya</option>
            </select>
          </div>
          <div className="grid gap-2 py-3 sm:grid-cols-[1fr_220px] sm:items-center">
            <div><p className="text-sm font-semibold">Siapa yang dapat berkomentar</p><p className="text-xs text-muted-foreground">Komentar lama tidak dihapus ketika komentar dimatikan.</p></div>
            <select className="input" value={momentPrivacy.comments} onChange={(event) => setMomentPrivacy((current) => ({ ...current, comments: event.target.value as "AUDIENCE" | "FRIENDS_ONLY" | "OFF" }))}>
              <option value="AUDIENCE">Semua audiens Momen</option>
              <option value="FRIENDS_ONLY">Teman saja</option>
              <option value="OFF">Dinonaktifkan</option>
            </select>
          </div>
          <label className="block py-3">
            <span className="text-sm font-semibold">Filter kata komentar</span>
            <span className="mt-1 block text-xs text-muted-foreground">Pisahkan dengan koma. Komentar yang memuat kata tersebut otomatis masuk moderasi.</span>
            <textarea className="input mt-2 min-h-24 resize-y" value={momentPrivacy.hiddenWords} onChange={(event) => setMomentPrivacy((current) => ({ ...current, hiddenWords: event.target.value }))} maxLength={2000} placeholder="contoh: spam, promosi, kata tidak pantas" />
          </label>
        </div>
        <SaveButton
          disabled={settingsLoading}
          onSave={() => saveSettings({
            defaultMomentShowLikeCount: momentPrivacy.showLikeCount,
            defaultMomentLikerList: momentPrivacy.likerList,
            defaultMomentComments: momentPrivacy.comments,
            momentHiddenWords: momentPrivacy.hiddenWords.split(",").map((word) => word.trim()).filter(Boolean),
          })}
        />
      </SectionCard>

      {/* 5. Companion settings */}
      <SectionCard icon={Sparkles} title={`Preferensi ${companionName.displayName}`}>
        <div className="divide-y divide-line/35">
          <ToggleRow label={`Saran kontekstual ${companionName.displayName}`} desc={`Tampilkan kartu refleksi dan masukan dari ${companionName.displayName}`} on={companion.insights} onToggle={() => setCompanion((s) => ({ ...s, insights: !s.insights }))} />
          <ToggleRow label="Ringkasan Pagi" desc={`Aktifkan ringkasan pagi ${companionName.displayName} di halaman utama`} on={companion.morningBrief} onToggle={() => setCompanion((s) => ({ ...s, morningBrief: !s.morningBrief }))} />
          <ToggleRow label="Surat Mingguan" desc={`Sertakan evaluasi siklus mingguan ${companionName.displayName}`} on={companion.weeklyLetter} onToggle={() => setCompanion((s) => ({ ...s, weeklyLetter: !s.weeklyLetter }))} />
          <ToggleRow label="Pengingat Keamanan" desc="Ingatkan batas latihan fisik dan batas panduan nonmedis" on={companion.safetyNotes} onToggle={() => setCompanion((s) => ({ ...s, safetyNotes: !s.safetyNotes }))} />
        </div>
        <div className="mt-3 flex items-start gap-2 text-[10px] text-muted-foreground bg-secondary/30 rounded-xl p-3 border border-line/20">
          <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <p>{companionName.displayName} tidak menghitung Health Pulse, memverifikasi aktivitas, memberikan reward, atau mendiagnosis kondisi medis.</p>
        </div>
        <SaveButton
          disabled={settingsLoading}
          onSave={() =>
            saveSettings({
              companionInsightsEnabled: companion.insights,
              companionSafetyNotesEnabled: companion.safetyNotes,
              morningBriefEnabled: companion.morningBrief,
              weeklyLetterEnabled: companion.weeklyLetter,
            })
          }
        />
      </SectionCard>

      {/* 6. Activity & Location settings */}
      <SectionCard icon={Activity} title="Latihan &amp; Lokasi">
        <div className="space-y-4 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 border border-line p-4 rounded-xl bg-secondary/15">
            <div className="flex-1">
              <p className="font-bold text-foreground">Izin Lokasi untuk Aktivitas</p>
              <p className="mt-0.5 text-[11px] leading-relaxed pr-2">NutriVerse memakai lokasi hanya selama sesi aktif untuk mengukur jarak dan pace.</p>
            </div>
            <Link href="/aktivitas/kepercayaan" className="btn btn-outline btn-xs shrink-0 font-bold flex items-center justify-center gap-1 w-full sm:w-auto mt-2 sm:mt-0">
              Kepercayaan &amp; Keamanan <HelpCircle className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="italic text-[10px]">
            * Pelacakan latar belakang dan ekspor koordinat tidak tersedia untuk melindungi privasi lokasi.
          </p>
        </div>
      </SectionCard>

      {/* 7. Demo & Simulation settings */}
      <SectionCard icon={HelpCircle} title="Demo &amp; Simulasi">
        <div className="divide-y divide-line/35">
          <ToggleRow label="Gunakan Data Demo Tetap" desc="Muat dataset bawaan untuk simulasi perjalanan" on={simulation.useDemoData} onToggle={() => setSimulation((s) => ({ ...s, useDemoData: !s.useDemoData }))} />
          <ToggleRow label="Simulasi GPS Lokasi" desc="Izinkan mode simulator lokasi di tracker latihan" on={simulation.gpsSimEnabled} onToggle={() => setSimulation((s) => ({ ...s, gpsSimEnabled: !s.gpsSimEnabled }))} />
          <ToggleRow label="Simulasi Foto Makanan" desc="Gunakan daftar demo makanan di scanner AI" on={simulation.foodSimEnabled} onToggle={() => setSimulation((s) => ({ ...s, foodSimEnabled: !s.foodSimEnabled }))} />
        </div>
        <SaveButton
          disabled={settingsLoading}
          onSave={() =>
            saveSettings({
              useDemoData: simulation.useDemoData,
              showSimulationLabels: simulation.showSimLabels,
              gpsSimulationEnabled: simulation.gpsSimEnabled,
              foodSimulationEnabled: simulation.foodSimEnabled,
            })
          }
        />
      </SectionCard>

      {/* Bantuan & Tur */}
      <SectionCard icon={Sparkles} title="Bantuan">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Tur Bersama Nora</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              Jalankan ulang tur interaktif keliling aplikasi NutriVerse bersama Nora. 
              Ini akan memandumu memahami cara kerja setiap fitur utama dari awal.
            </p>
          </div>
          <button 
            onClick={() => {
              if (typeof window !== "undefined") {
                // Because useGuidedTour must be imported, but we didn't import it to avoid breaking changes if it doesn't exist, we can use an event or local storage + reload.
                window.localStorage.setItem("nutriverse.needs_tour", "true");
                window.location.href = "/dashboard";
              }
            }} 
            className="btn btn-outline btn-sm font-bold flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-brand" /> Ulangi Tur Bersama Nora
          </button>
        </div>
      </SectionCard>

      {/* 8. Break reminder settings */}
      <SectionCard icon={TimerReset} title="Pengingat Jeda">
        <div className="space-y-4">
          <ToggleRow
            label="Ingatkan untuk bergerak"
            desc="Nora mengingatkan secara halus saat aplikasi terbuka. Fitur ini nonaktif secara bawaan."
            on={breakReminder.enabled}
            onToggle={() => updateBreakReminder({ ...breakReminder, enabled: !breakReminder.enabled })}
          />
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-secondary/25 p-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <label htmlFor="break-interval" className="text-xs font-bold text-foreground">Jarak antar-pengingat</label>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Tidak mendeteksi posisi duduk; pengingat hanya mengikuti waktu ketika aplikasi aktif.</p>
              <select
                id="break-interval"
                value={breakReminder.intervalMinutes}
                onChange={(event) => updateBreakReminder({ ...breakReminder, intervalMinutes: Number(event.target.value) })}
                className="input mt-2 max-w-48 text-sm"
                disabled={!breakReminder.enabled}
              >
                <option value={60}>Setiap 1 jam</option>
                <option value={90}>Setiap 1,5 jam</option>
                <option value={120}>Setiap 2 jam</option>
              </select>
            </div>
            <button onClick={() => window.dispatchEvent(new Event(BREAK_REMINDER_PREVIEW_EVENT))} className="btn btn-outline btn-sm" type="button">
              <StretchHorizontal className="h-4 w-4" /> Lihat Contoh
            </button>
          </div>
        </div>
      </SectionCard>

      {/* 9. Notification settings */}
      <SectionCard icon={Bell} title="Notifikasi">
        <div className="divide-y divide-line/35">
          <ToggleRow label="Pengingat Aktivitas" desc="Ingatkan untuk bergerak dan mencatat hidrasi" on={notif.aktivitas} onToggle={() => setNotif((s) => ({ ...s, aktivitas: !s.aktivitas }))} />
          <ToggleRow label="Pembaruan Peringkat" desc="Beri tahu saat peringkat mingguan diperbarui" on={notif.leaderboard} onToggle={() => setNotif((s) => ({ ...s, leaderboard: !s.leaderboard }))} />
          <ToggleRow label="Semangat &amp; Dukungan" desc="Notifikasi saat anggota Circle memberi dorongan semangat" on={notif.sosial} onToggle={() => setNotif((s) => ({ ...s, sosial: !s.sosial }))} />
          <ToggleRow label="Suka pada Momen" desc="Beri tahu saat seseorang menyukai Momenmu" on={notif.momentLikes} onToggle={() => setNotif((s) => ({ ...s, momentLikes: !s.momentLikes }))} />
          <ToggleRow label="Komentar Momen" desc="Beri tahu saat ada komentar baru pada Momenmu" on={notif.momentComments} onToggle={() => setNotif((s) => ({ ...s, momentComments: !s.momentComments }))} />
          <ToggleRow label="Aktivitas Komunitas" desc="Pembaruan penting dari komunitas yang kamu ikuti" on={notif.community} onToggle={() => setNotif((s) => ({ ...s, community: !s.community }))} />
        </div>
        <SaveButton
          disabled={settingsLoading}
          onSave={() =>
            saveSettings({
              notificationsActivity: notif.aktivitas,
              notificationsLeaderboard: notif.leaderboard,
              notificationsSocial: notif.sosial,
              notificationsMomentLikes: notif.momentLikes,
              notificationsMomentComments: notif.momentComments,
              notificationsCommunity: notif.community,
            })
          }
        />
      </SectionCard>

      {/* 10. Data and Export */}
      <div className="card card-pad bg-secondary/20 border-line space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Kontrol Data</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Preferensi akun disimpan di database. Kontrol lokal hanya membersihkan cache perangkat ini.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="btn btn-outline text-destructive flex-1" onClick={() => alert("Simulasi pembersihan data lokal selesai.")}>
            Bersihkan Data Lokal
          </button>
          <button className="btn btn-ghost flex-1 text-muted-foreground font-semibold" onClick={logout}>
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
