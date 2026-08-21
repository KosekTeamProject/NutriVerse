"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { 
  Pencil, 
  Zap, 
  Heart, 
  MapPin, 
  Activity, 
  Flame, 
  Target, 
  Compass, 
  Lock, 
  Eye, 
  Info,
  Utensils,
  Droplets,
  Moon,
  Sparkles,
  Check,
  RotateCcw,
  Camera,
  ImagePlus,
  X,
  ChevronDown
} from "lucide-react";
import { RankCrest } from "@/components/brand/RankCrest";
import { ProfileCollection } from "@/components/app/ProfileCollection";
import { ProfileConnections } from "@/components/app/ProfileConnections";
import { ProfileCommunities } from "@/components/app/ProfileCommunities";
import { ProfileMomentsGallery } from "@/components/app/ProfileMomentsGallery";
import { OwnerProfileMomentShowcase } from "@/components/app/ProfileMomentShowcase";
import { TIER_EMBLEM_NAMES, tierBySlug } from "@/lib/tiers";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useCompanionName } from "@/hooks/useCompanionName";
import { updateAuthSession } from "@/features/auth/session";
import { useProgressData } from "@/providers/ProgressDataProvider";

const STORIES_POOL = [
  "Setiap langkah kecil yang tercatat terus membangun kebiasaan sehat.",
  "Pemulihan hari ini berfokus pada jalan ringan untuk mengembalikan energi sebelum tantangan berikutnya.",
  "Asupan protein mencapai 70% target. Hidrasi masih menjadi peluang peningkatan yang paling jelas."
];

const MAX_PROFILE_IMAGE_BYTES = 8 * 1024 * 1024;

type ProfileImageField = "avatarUrl" | "coverUrl";
type ProfileImageEditor = {
  readonly field: ProfileImageField;
  readonly source: string;
  readonly width: number;
  readonly height: number;
  readonly filename: string;
  readonly zoom: number;
  readonly positionX: number;
  readonly positionY: number;
};

type ProfilePrivacySummary = {
  readonly profileVisibility: "PRIVATE" | "CIRCLE" | "PUBLIC";
  readonly pulseVisibility: "PRIVATE" | "CIRCLE" | "PUBLIC";
  readonly activityVisibility: "PRIVATE" | "CIRCLE" | "PUBLIC";
  readonly challengeProgressVisible: boolean;
};

function privacyLabel(level?: "PRIVATE" | "CIRCLE" | "PUBLIC") {
  if (level === "PUBLIC") return "Publik";
  if (level === "CIRCLE") return "Lingkaran Saja";
  if (level === "PRIVATE") return "Privat";
  return "Memuat...";
}

function readProfileImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Gambar tidak dapat dibaca."));
    reader.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}

function loadProfileImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
    image.src = source;
  });
}

async function renderProfileImage(editor: ProfileImageEditor) {
  const image = await loadProfileImage(editor.source);
  const ratio = editor.field === "avatarUrl" ? 1 : 6;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const baseCropWidth = imageRatio > ratio ? image.naturalHeight * ratio : image.naturalWidth;
  const baseCropHeight = baseCropWidth / ratio;
  const cropWidth = baseCropWidth / editor.zoom;
  const cropHeight = baseCropHeight / editor.zoom;
  const sourceX = (image.naturalWidth - cropWidth) * (editor.positionX / 100);
  const sourceY = (image.naturalHeight - cropHeight) * (editor.positionY / 100);
  const outputWidth = editor.field === "avatarUrl" ? 720 : 1440;
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = Math.round(outputWidth / ratio);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia.");
  context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.88);
}

function RadialProgress({ 
  value, 
  target, 
  unit, 
  label, 
  color, 
  icon: Icon 
}: { 
  readonly value: number; 
  readonly target: number; 
  readonly unit: string; 
  readonly label: string; 
  readonly color: string; 
  readonly icon: typeof Utensils; 
}) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 400);
    return () => clearTimeout(t);
  }, []);

  const pct = Math.min(100, Math.round((value / target) * 100));
  const dashOffset = active ? c * (1 - pct / 100) : c;

  return (
    <div className="chart-surface chart-surface-brand flex items-center gap-4 rounded-2xl border border-line p-4 transition hover:border-brand/35 hover:shadow-soft">
      <div className="relative grid place-items-center shrink-0">
        <svg width="48" height="48" viewBox="0 0 56 56" className="-rotate-90 sm:w-[56px] sm:h-[56px]">
          <circle cx="28" cy="28" r={r} fill="none" stroke="var(--secondary)" strokeWidth="4.5" />
          <circle 
            cx="28" 
            cy="28" 
            r={r} 
            fill="none" 
            stroke={color} 
            strokeWidth="4.5" 
            strokeLinecap="round" 
            strokeDasharray={c} 
            className="transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ strokeDashoffset: dashOffset }} 
          />
        </svg>
        <Icon className="absolute h-4 w-4 sm:h-4.5 sm:w-4.5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{label}</p>
        <p className="font-display text-xs sm:text-sm font-extrabold text-foreground truncate">{value} / {target} <span className="text-[9px] sm:text-[10px] font-normal text-muted-foreground">{unit}</span></p>
        <p className="text-[9px] sm:text-[10px] text-muted-foreground">{pct}% target</p>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  accent 
}: { 
  readonly icon: typeof Zap; 
  readonly label: string; 
  readonly value: string; 
  readonly accent: "amber" | "brand" | "sky" | "lime";
}) {
  const accentStyles = {
    amber: "text-amber bg-amber/10 border-amber/15",
    brand: "text-brand bg-brand-soft border-brand/20",
    sky: "text-sky bg-sky/10 border-sky/15",
    lime: "text-lime bg-lime/10 border-lime/15"
  }[accent];

  return (
    <div className="card card-pad border-line bg-card space-y-3 hover:border-brand/35 hover:-translate-y-0.5 transition hover:shadow-soft duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-xl ${accentStyles}`}>
          <Icon className="h-4.5 w-4.5 animate-[float_6s_ease-in-out_infinite]" />
        </span>
      </div>
      <p className="stat-num text-xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}

export default function ProfilPage() {
  const session = useAuthSession();
  const { overview } = useProgressData();
  const companionName = useCompanionName();
  const tier = tierBySlug(overview?.economy.currentTier.toLowerCase() ?? "sprout");
  const [storyIndex, setStoryIndex] = useState(0);
  const [activeProfileSection, setActiveProfileSection] = useState<"summary" | "moments">("summary");
  const [companionDraft, setCompanionDraft] = useState<string | null>(null);
  const [companionSaved, setCompanionSaved] = useState(false);
  const [imageFeedback, setImageFeedback] = useState("");
  const [imageEditor, setImageEditor] = useState<ProfileImageEditor | null>(null);
  const [imageSaving, setImageSaving] = useState(false);
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const [privacySummary, setPrivacySummary] =
    useState<ProfilePrivacySummary | null>(null);
  const profileName = session?.name ?? "Fathan Mubarak";
  const profileUsername = session?.username ?? "fathan.mubarak";
  const initials = profileName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const companionDraftValue = companionDraft ?? companionName.displayName;

  useEffect(() => {
    const interval = setInterval(() => {
      setStoryIndex((prev) => (prev + 1) % STORIES_POOL.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  function selectProfileSection(section: "summary" | "moments") {
    setActiveProfileSection(section);
    const hash = section === "moments" ? "#momen-saya" : "#ringkasan";
    window.history.replaceState(null, "", `${window.location.pathname}${hash}`);
  }

  useEffect(() => {
    if (!session?.email) return;
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as {
          settings?: ProfilePrivacySummary | null;
        } | null;
        if (!response.ok || !result?.settings || cancelled) return;
        setPrivacySummary(result.settings);
      })
      .catch(() => {
        // Ringkasan tetap menunjukkan status memuat jika layanan preferensi terputus.
      });
    return () => {
      cancelled = true;
    };
  }, [session?.email]);

  async function saveCompanionName() {
    if (companionDraftValue.trim().length < 2) return;
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ companionName: companionDraftValue.trim() }),
    });
    if (response.ok) {
      companionName.setDisplayName(companionDraftValue);
      updateAuthSession({ companionName: companionDraftValue.trim() });
      setCompanionDraft(null);
      setCompanionSaved(true);
      window.setTimeout(() => setCompanionSaved(false), 1800);
    }
  }

  function resetCompanionName() {
    companionName.resetToDefault();
    updateAuthSession({ companionName: "Nora" });
    setCompanionDraft("Nora");
  }

  async function startProfileImageEdit(event: ChangeEvent<HTMLInputElement>, field: ProfileImageField) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_PROFILE_IMAGE_BYTES) {
      setImageFeedback("Gunakan gambar JPG, PNG, atau WebP dengan ukuran maksimal 8 MB.");
      return;
    }
    try {
      const source = await readProfileImage(file);
      const image = await loadProfileImage(source);
      setImageEditor({ field, source, width: image.naturalWidth, height: image.naturalHeight, filename: file.name, zoom: 1, positionX: 50, positionY: 50 });
    } catch {
      setImageFeedback("Gambar tidak dapat diproses. Coba gunakan gambar lain.");
    }
  }

  async function applyProfileImage() {
    if (!imageEditor) return;
    setImageSaving(true);
    try {
      const imageUrl = await renderProfileImage(imageEditor);
      if (imageEditor.field === "avatarUrl") {
        const imageBlob = await fetch(imageUrl).then((response) => response.blob());
        const form = new FormData();
        form.set("bucket", "avatars");
        form.set("file", new File([imageBlob], imageEditor.filename, { type: imageBlob.type || "image/png" }));
        const uploadResponse = await fetch("/api/storage/upload", { method: "POST", body: form });
        const uploadResult = (await uploadResponse.json()) as { publicUrl?: string; error?: string };
        if (!uploadResponse.ok || !uploadResult.publicUrl) {
          throw new Error(uploadResult.error || "Upload avatar gagal.");
        }
        const profileResponse = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ avatarUrl: uploadResult.publicUrl }),
        });
        if (!profileResponse.ok) throw new Error("Profil belum dapat diperbarui.");
        setAvatarImageFailed(false);
        updateAuthSession({ avatarUrl: uploadResult.publicUrl });
      } else {
        updateAuthSession({ coverUrl: imageUrl });
      }
      setImageFeedback(imageEditor.field === "avatarUrl" ? "Foto profil berhasil diperbarui." : "Latar profil berhasil diperbarui.");
      setImageEditor(null);
    } catch {
      setImageFeedback("Gambar tidak dapat diproses. Coba atur atau gunakan gambar lain.");
    } finally {
      setImageSaving(false);
    }
  }

  const editorRatio = imageEditor?.field === "avatarUrl" ? 1 : 6;
  const editorImageRatio = imageEditor ? imageEditor.width / imageEditor.height : 1;
  const editorBackgroundSize = imageEditor
    ? editorImageRatio > editorRatio
      ? `${(editorImageRatio / editorRatio) * 100 * imageEditor.zoom}% ${100 * imageEditor.zoom}%`
      : `${100 * imageEditor.zoom}% ${(editorRatio / editorImageRatio) * 100 * imageEditor.zoom}%`
    : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up-premium">
      {/* profile header */}
      <div className="card overflow-hidden border-line relative">
        {/* Animated cover background */}
        <div className="absolute inset-x-0 top-0 h-28 overflow-hidden bg-gradient-to-br from-brand via-brand-bright to-lime sm:h-32">
          {session?.coverUrl && <NextImage src={session.coverUrl} alt="Latar profil" fill unoptimized className="object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
          <div className="absolute inset-0 grid-dots opacity-20" />
          <div className="absolute -left-10 top-0 h-24 w-24 rounded-full bg-white/20 blur-xl animate-pulse" />
        </div>
        <label className="absolute right-4 top-4 z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/35 bg-black/25 px-3 py-2 text-[10px] font-bold text-white backdrop-blur transition hover:bg-black/40" title="Ubah latar profil dengan rasio 6:1">
          <ImagePlus className="h-3.5 w-3.5" /> Ubah latar · 6:1
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => startProfileImageEdit(event, "coverUrl")} />
        </label>

        <div className="card-pad relative mt-28 pt-0 sm:mt-32">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {/* Floating Avatar with rotating status ring */}
              <div className="relative group shrink-0">
                <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-tr from-brand to-lime opacity-75 blur-sm animate-pulse duration-3000" />
                <div className="relative grid h-24 w-24 overflow-hidden rounded-3xl border-4 border-card bg-gradient-to-br from-brand to-lime font-display text-3xl font-extrabold text-white shadow-soft transition duration-300 group-hover:scale-105">
                  {session?.avatarUrl && !avatarImageFailed ? <NextImage src={session.avatarUrl} alt="" fill unoptimized className="object-cover" onError={() => setAvatarImageFailed(true)} /> : initials}
                </div>
                <label className="absolute -bottom-1 -right-1 z-10 grid h-9 w-9 cursor-pointer place-items-center rounded-xl border-2 border-card bg-foreground text-background shadow-soft transition hover:scale-105" title="Ubah foto profil dengan rasio 1:1">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => startProfileImageEdit(event, "avatarUrl")} />
                </label>
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="break-words font-display text-2xl font-extrabold tracking-tight text-foreground">{profileName}</h1>
                <p className="truncate text-sm text-muted-foreground">@{profileUsername} &middot; Pengguna Aktif</p>
                <ProfileConnections />
              </div>
            </div>
            <Link href="/pengaturan" className="btn btn-outline btn-sm font-bold"><Pencil className="h-4 w-4" /> Edit Profil</Link>
          </div>

          {imageFeedback && <p className="mt-3 rounded-xl bg-brand-soft px-3 py-2 text-[10px] font-semibold text-brand" role="status">{imageFeedback}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-muted-foreground"><span className="rounded-full bg-secondary px-2.5 py-1">Foto profil 1:1</span><span className="rounded-full bg-secondary px-2.5 py-1">Latar profil 6:1</span><span className="rounded-full bg-brand-soft px-2.5 py-1 text-brand">Atur posisi sebelum menyimpan</span></div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-line px-3 py-2 bg-secondary/35">
              <RankCrest id="profil" tier={tier.slug} from={tier.from} to={tier.to} size={28} />
              <div className="leading-tight">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Divisi Peringkat</p>
                <p className="font-display text-sm font-bold text-foreground">{tier.name} &middot; {TIER_EMBLEM_NAMES[tier.slug]} &middot; Divisi II</p>
              </div>
            </div>
            <span className="pill bg-amber/15 text-amber font-bold"><Zap className="h-3.5 w-3.5" /> {(overview?.economy.totalXp ?? 0).toLocaleString("id-ID")} XP</span>
            <span className="pill bg-brand-soft text-brand font-bold"><Heart className="h-3.5 w-3.5 text-brand fill-brand" /> {(overview?.economy.currentHp ?? 0).toLocaleString("id-ID")} HP</span>
            <span className="pill bg-secondary text-muted-foreground font-semibold text-xs">{overview?.healthyDays.achievedDays ?? 0} hari sehat / 28 hari</span>
          </div>

          {/* Dynamic Profile Story Card */}
          <div className="mt-5 rounded-2xl bg-secondary/45 border border-line/45 p-4 transition-all duration-500 ease-in-out">
            <p className="text-[9px] font-bold text-brand uppercase tracking-wider select-none">Cerita Progres Pengguna</p>
            <p className="text-xs text-foreground font-medium mt-1 leading-relaxed">
              &ldquo;{STORIES_POOL[storyIndex]}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {imageEditor && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="profile-image-editor-title">
          <section className="w-full max-w-2xl overflow-hidden rounded-t-3xl border border-line bg-card shadow-2xl sm:rounded-3xl">
            <header className="flex items-center justify-between border-b border-line px-5 py-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand">Penyesuaian gambar</p><h2 id="profile-image-editor-title" className="mt-1 font-display text-lg font-extrabold text-foreground">{imageEditor.field === "avatarUrl" ? "Atur foto profil" : "Atur latar profil"}</h2></div><button onClick={() => setImageEditor(null)} disabled={imageSaving} className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary disabled:opacity-45" aria-label="Tutup penyesuaian gambar"><X className="h-5 w-5" /></button></header>
            <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_240px] sm:p-6">
              <div>
                <div className={`overflow-hidden rounded-2xl bg-secondary shadow-inner ${imageEditor.field === "avatarUrl" ? "aspect-square" : "aspect-[6/1] min-h-24"}`} style={{ backgroundImage: `url(${imageEditor.source})`, backgroundPosition: `${imageEditor.positionX}% ${imageEditor.positionY}%`, backgroundRepeat: "no-repeat", backgroundSize: editorBackgroundSize }} aria-label={`Pratinjau ${imageEditor.field === "avatarUrl" ? "foto profil" : "latar profil"}`} role="img" />
                <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">File: <span className="font-semibold text-foreground">{imageEditor.filename}</span>. Pratinjau ini menggunakan rasio final <strong className="text-foreground">{imageEditor.field === "avatarUrl" ? "1:1" : "6:1"}</strong>.</p>
              </div>
              <div className="space-y-4 rounded-2xl border border-line bg-secondary/35 p-4">
                <div><label htmlFor="profile-image-zoom" className="label">Perbesar gambar</label><input id="profile-image-zoom" type="range" min="1" max="3" step="0.01" value={imageEditor.zoom} onChange={(event) => setImageEditor((current) => current ? { ...current, zoom: Number(event.target.value) } : current)} className="mt-2 w-full accent-[var(--brand)]" /><p className="mt-1 text-right text-[9px] font-bold text-muted-foreground">{imageEditor.zoom.toFixed(2)}×</p></div>
                <div><label htmlFor="profile-image-x" className="label">Posisi horizontal</label><input id="profile-image-x" type="range" min="0" max="100" value={imageEditor.positionX} onChange={(event) => setImageEditor((current) => current ? { ...current, positionX: Number(event.target.value) } : current)} className="mt-2 w-full accent-[var(--brand)]" /></div>
                <div><label htmlFor="profile-image-y" className="label">Posisi vertikal</label><input id="profile-image-y" type="range" min="0" max="100" value={imageEditor.positionY} onChange={(event) => setImageEditor((current) => current ? { ...current, positionY: Number(event.target.value) } : current)} className="mt-2 w-full accent-[var(--brand)]" /></div>
                <p className="rounded-xl bg-card px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">Geser slider sampai bagian gambar yang diinginkan masuk ke area crop, lalu simpan.</p>
              </div>
            </div>
            <footer className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end"><button onClick={() => setImageEditor(null)} disabled={imageSaving} className="btn btn-outline btn-sm disabled:opacity-45">Batal</button><button onClick={applyProfileImage} disabled={imageSaving} className="btn btn-primary btn-sm disabled:opacity-45">{imageSaving ? "Menyimpan…" : "Gunakan gambar ini"}</button></footer>
          </section>
        </div>
      )}

      <nav className="grid grid-cols-2 rounded-2xl bg-secondary p-1" aria-label="Navigasi profil">
        <button type="button" onClick={() => selectProfileSection("summary")} aria-current={activeProfileSection === "summary" ? "page" : undefined} className={`rounded-xl px-3 py-2.5 text-center text-xs font-bold transition ${activeProfileSection === "summary" ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-brand"}`}>Ringkasan</button>
        <button type="button" onClick={() => selectProfileSection("moments")} aria-current={activeProfileSection === "moments" ? "page" : undefined} className={`rounded-xl px-3 py-2.5 text-center text-xs font-bold transition ${activeProfileSection === "moments" ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-brand"}`}>Momen Saya</button>
      </nav>

      {activeProfileSection === "summary" ? <>
      {/* stats */}
      <div id="ringkasan" className="grid scroll-mt-24 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Zap} label="Progress XP" value={(overview?.economy.totalXp ?? 0).toLocaleString("id-ID")} accent="amber" />
        <StatCard icon={MapPin} label="Jarak total" value={`${overview?.profile.totalDistanceKm ?? 0} km`} accent="brand" />
        <StatCard icon={Activity} label="Aktivitas" value={`${overview?.profile.verifiedActivityCount ?? 0}`} accent="sky" />
        <StatCard icon={Flame} label="Streak" value={`${overview?.economy.streakDays ?? 0} hari`} accent="lime" />
      </div>

      <OwnerProfileMomentShowcase />

      <ProfileCommunities />

      <div className="space-y-4">
        {/* Tier 1 - Always Visible Primary Preference */}
        <section id="pendamping-ai" className="card border-brand/20 bg-gradient-to-br from-secondary/50 via-secondary/50 to-brand-soft/20 p-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] md:items-center">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-soft"><Sparkles className="h-4 w-4" /></span>
              <div>
                <h2 className="font-display text-sm font-extrabold text-foreground">Preferensi Pendamping AI</h2>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">Panggil teman sehatmu dengan nama pilihanmu.</p>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-card/90 p-3 shadow-sm relative overflow-hidden">
              <div className="flex flex-col gap-2 sm:flex-row items-center w-full">
                <div className="relative flex-1 w-full">
                  <input
                    id="profile-companion-name"
                    value="Nora"
                    disabled
                    className="input min-w-0 w-full font-bold text-xs bg-secondary/50 text-muted-foreground cursor-not-allowed pr-8"
                  />
                  <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="pill bg-brand/10 text-brand font-bold text-[10px] shrink-0 border border-brand/20 uppercase">PRO</span>
              </div>
              <p className="mt-2 text-[9px] text-muted-foreground leading-relaxed">
                Kustomisasi Nama AI hanya tersedia di versi <span className="font-bold text-brand">NutriVerse Pro</span>.
              </p>
            </div>
          </div>
        </section>
        {/* Statistik & Progres Expandable */}
        <details className="group card border-line bg-card [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between p-4 sm:p-5 font-display font-bold text-foreground">
            <div className="flex items-center gap-2.5">
               <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand"><Target className="h-4 w-4" /></span>
               <span className="text-sm sm:text-base">Statistik &amp; Target Harian</span>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground transition group-open:rotate-180" />
          </summary>
          <div className="p-4 sm:p-5 pt-0 border-t border-line/45 mt-2 space-y-6">
            {/* Daily Targets - Radial Progress Rings */}
            <div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <RadialProgress value={overview?.daily.calories.value ?? 0} target={overview?.daily.calories.target ?? 2000} unit="kkal" label="Kalori" color="var(--brand)" icon={Utensils} />
                <RadialProgress value={overview?.daily.protein.value ?? 0} target={overview?.daily.protein.target ?? 80} unit="g" label="Protein" color="var(--brand-bright)" icon={Zap} />
                <RadialProgress value={(overview?.daily.water.value ?? 0) / 1000} target={(overview?.daily.water.target ?? 2000) / 1000} unit="L" label="Air" color="var(--sky)" icon={Droplets} />
                <RadialProgress value={overview?.daily.sleep.value ?? 0} target={overview?.daily.sleep.target ?? 8} unit="jam" label="Tidur" color="var(--amber)" icon={Moon} />
              </div>
            </div>

            {/* Wellness Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-line bg-secondary/30 p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-line/45">
                  <h3 className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-brand" /> Health Pulse
                  </h3>
                  <span className="pill bg-brand-soft text-brand font-bold text-[10px]">{overview?.healthPulse.current.status ?? "Belum ada data"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Skor Pulse</span>
                  <span className="stat-num text-xl font-extrabold text-foreground">{overview?.healthPulse.current.score ?? 0} <span className="text-xs text-muted-foreground font-normal">/ 100</span></span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-normal">
                  {overview?.healthPulse.current.recommendedNextAction ?? "Tambahkan data harian untuk membentuk ringkasan."}
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-secondary/30 p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-line/45">
                  <h3 className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-amber" /> Tantangan Aktif
                  </h3>
                  <span className="pill bg-amber/10 text-amber border border-amber/15 text-[9px] font-bold">Menengah</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs font-bold text-foreground">{overview?.challenges[0]?.title ?? "Belum ada tantangan aktif"}</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Progres: {overview?.challenges[0]?.currentValue ?? 0} / {overview?.challenges[0]?.targetValue ?? 0} {overview?.challenges[0]?.unit ?? ""} ({overview?.challenges[0]?.progressPercent ?? 0}%)</p>
                </div>
                <div className="chart-progress h-1.5 overflow-hidden rounded-full">
                  <div className="h-full rounded-full bg-amber" style={{ width: `${overview?.challenges[0]?.progressPercent ?? 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* Koleksi Expandable */}
        <details id="badge" className="group card scroll-mt-24 border-line bg-card [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between p-4 sm:p-5 font-display font-bold text-foreground">
            <div className="flex items-center gap-2.5">
               <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky/15 text-sky"><Sparkles className="h-4 w-4" /></span>
               <span className="text-sm sm:text-base">Koleksi Badge &amp; Pencapaian</span>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground transition group-open:rotate-180" />
          </summary>
          <div className="p-4 sm:p-5 pt-0 border-t border-line/45 mt-2">
            <ProfileCollection />
          </div>
        </details>

        {/* Pengaturan & Privasi Expandable */}
        <details className="group card border-line bg-card [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between p-4 sm:p-5 font-display font-bold text-foreground">
            <div className="flex items-center gap-2.5">
               <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-muted-foreground"><Lock className="h-4 w-4" /></span>
               <span className="text-sm sm:text-base">Pengaturan &amp; Privasi Tambahan</span>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground transition group-open:rotate-180" />
          </summary>
          <div className="p-4 sm:p-5 pt-0 border-t border-line/45 mt-2 space-y-6">
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2 text-[10px] sm:text-xs">
                <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20">
                  <span className="text-muted-foreground font-semibold">Visibilitas Profil</span>
                  <span className="pill bg-secondary text-muted-foreground font-bold">{privacyLabel(privacySummary?.profileVisibility)}</span>
                </div>
                <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20">
                  <span className="text-muted-foreground font-semibold">Berbagi Skor Pulse</span>
                  <span className="pill bg-secondary text-muted-foreground font-bold">{privacyLabel(privacySummary?.pulseVisibility)}</span>
                </div>
                <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20">
                  <span className="text-muted-foreground font-semibold">Ringkasan Aktivitas</span>
                  <span className="pill bg-secondary text-muted-foreground font-bold">{privacyLabel(privacySummary?.activityVisibility)}</span>
                </div>
                <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20">
                  <span className="text-muted-foreground font-semibold">Progres Tantangan</span>
                  <span className="pill bg-secondary text-muted-foreground font-bold">
                    {privacySummary
                      ? privacySummary.challengeProgressVisible
                        ? "Lingkaran Saja"
                        : "Privat"
                      : "Memuat..."}
                  </span>
                </div>
                <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20 col-span-2">
                  <span className="text-muted-foreground font-semibold">Catatan Nutrisi &amp; Pemulihan</span>
                  <span className="pill bg-brand-soft text-brand font-bold flex items-center gap-0.5">
                    <Eye className="h-3 w-3" /> Privat Penuh
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-[9px] sm:text-[10px] text-muted-foreground pt-1">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                <p>NutriVerse memakai telemetri lokasi hanya untuk memverifikasi jarak olahraga GPS. Catatan nutrisi, hidrasi, dan tidur tetap privat.</p>
              </div>
              <div className="pt-2">
                <Link href="/pengaturan" className="btn btn-outline w-full py-2 text-center flex items-center justify-center gap-1.5 font-bold text-xs">
                  <Compass className="h-4 w-4" /> Kelola Privasi Lebih Lanjut
                </Link>
              </div>
            </div>
          </div>
        </details>
      </div>
      </> : <ProfileMomentsGallery />}
    </div>
  );
}
