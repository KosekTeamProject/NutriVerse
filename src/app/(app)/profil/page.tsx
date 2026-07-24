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
  X
} from "lucide-react";
import { RankCrest } from "@/components/brand/RankCrest";
import { ProfileCollection } from "@/components/app/ProfileCollection";
import { TIER_EMBLEM_NAMES, tierBySlug } from "@/lib/tiers";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useCompanionName } from "@/hooks/useCompanionName";
import { updateAuthSession } from "@/features/auth/session";

const STORIES_POOL = [
  "Kebiasaan sehat telah terjaga selama 148 hari. Setiap langkah kecil terus membangun masa depan yang lebih sehat.",
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
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
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
        <Icon className="absolute h-4.5 w-4.5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-display text-sm font-extrabold text-foreground">{value} / {target} <span className="text-[10px] font-normal text-muted-foreground">{unit}</span></p>
        <p className="text-[10px] text-muted-foreground">{pct}% target</p>
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
  const companionName = useCompanionName();
  const tier = tierBySlug("radiant");
  const [storyIndex, setStoryIndex] = useState(0);
  const [companionDraft, setCompanionDraft] = useState<string | null>(null);
  const [companionSaved, setCompanionSaved] = useState(false);
  const [imageFeedback, setImageFeedback] = useState("");
  const [imageEditor, setImageEditor] = useState<ProfileImageEditor | null>(null);
  const [imageSaving, setImageSaving] = useState(false);
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
        <div className="absolute inset-x-0 top-0 aspect-[6/1] min-h-16 overflow-hidden bg-gradient-to-br from-brand via-brand-bright to-lime">
          {session?.coverUrl && <NextImage src={session.coverUrl} alt="Latar profil" fill unoptimized className="object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
          <div className="absolute inset-0 grid-dots opacity-20" />
          <div className="absolute -left-10 top-0 h-24 w-24 rounded-full bg-white/20 blur-xl animate-pulse" />
        </div>
        <label className="absolute right-4 top-4 z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/35 bg-black/25 px-3 py-2 text-[10px] font-bold text-white backdrop-blur transition hover:bg-black/40" title="Ubah latar profil dengan rasio 6:1">
          <ImagePlus className="h-3.5 w-3.5" /> Ubah latar · 6:1
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => startProfileImageEdit(event, "coverUrl")} />
        </label>

        <div className="card-pad relative mt-4 pt-0 sm:mt-20 lg:mt-24">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {/* Floating Avatar with rotating status ring */}
              <div className="relative group shrink-0">
                <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-tr from-brand to-lime opacity-75 blur-sm animate-pulse duration-3000" />
                <div className="relative grid h-24 w-24 overflow-hidden rounded-3xl border-4 border-card bg-gradient-to-br from-brand to-lime font-display text-3xl font-extrabold text-white shadow-soft transition duration-300 group-hover:scale-105">
                  {session?.avatarUrl ? <NextImage src={session.avatarUrl} alt={`Foto profil ${profileName}`} fill unoptimized className="object-cover" /> : initials}
                </div>
                <label className="absolute -bottom-1 -right-1 z-10 grid h-9 w-9 cursor-pointer place-items-center rounded-xl border-2 border-card bg-foreground text-background shadow-soft transition hover:scale-105" title="Ubah foto profil dengan rasio 1:1">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => startProfileImageEdit(event, "avatarUrl")} />
                </label>
              </div>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">{profileName}</h1>
                <p className="text-sm text-muted-foreground">@{profileUsername} &middot; Pengguna Aktif</p>
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
            <span className="pill bg-amber/15 text-amber font-bold"><Zap className="h-3.5 w-3.5" /> 12.450 XP</span>
            <span className="pill bg-brand-soft text-brand font-bold"><Heart className="h-3.5 w-3.5 text-brand fill-brand" /> 3.280 HP</span>
            <span className="pill bg-secondary text-muted-foreground font-semibold text-xs">Hari ke-148</span>
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

      <section id="pendamping-ai" className="card card-pad scroll-mt-24 overflow-hidden border-brand/20 bg-gradient-to-br from-card via-card to-brand-soft/35">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] md:items-center">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-soft"><Sparkles className="h-5 w-5" /></span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand">Preferensi Pendamping AI</p>
              <h2 className="mt-1 font-display text-lg font-extrabold text-foreground">Panggil teman sehatmu dengan nama pilihanmu</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Nama ini dipakai di percakapan, sidebar, ringkasan, reminder, dan notifikasi. Pendamping tetap tidak mendiagnosis atau memverifikasi aktivitas.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-card/90 p-4 shadow-sm">
            <label htmlFor="profile-companion-name" className="label">Nama pendamping AI</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="profile-companion-name"
                value={companionDraftValue}
                onChange={(event) => setCompanionDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") saveCompanionName(); }}
                minLength={2}
                maxLength={24}
                className="input min-w-0 flex-1 font-bold"
                placeholder="Contoh: Nora, Aira, Nara"
              />
              <button onClick={saveCompanionName} disabled={companionDraftValue.trim().length < 2} className="btn btn-primary btn-sm shrink-0 disabled:opacity-45"><Check className="h-4 w-4" /> {companionSaved ? "Tersimpan" : "Simpan"}</button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
              <span>Nama aktif: <strong className="text-foreground">{companionName.displayName}</strong></span>
              {!companionName.isDefault && <button onClick={resetCompanionName} className="inline-flex items-center gap-1 font-bold text-brand hover:underline"><RotateCcw className="h-3.5 w-3.5" /> Kembalikan ke Nora</button>}
            </div>
          </div>
        </div>
      </section>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Zap} label="Progress XP" value="12.450" accent="amber" />
        <StatCard icon={MapPin} label="Jarak total" value="128 km" accent="brand" />
        <StatCard icon={Activity} label="Aktivitas" value="42" accent="sky" />
        <StatCard icon={Flame} label="Streak" value="7 hari" accent="lime" />
      </div>

      {/* Daily Targets - Radial Progress Rings */}
      <div className="card card-pad border-line bg-card space-y-4">
        <div className="flex items-center gap-2 border-b border-line/45 pb-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
            <Target className="h-5 w-5" />
          </span>
          <h3 className="font-display text-base font-bold text-foreground">Target Konsistensi Harian</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RadialProgress value={2050} target={2200} unit="kkal" label="Kalori" color="var(--brand)" icon={Utensils} />
          <RadialProgress value={56} target={80} unit="g" label="Protein" color="var(--brand-bright)" icon={Zap} />
          <RadialProgress value={1.1} target={2.0} unit="L" label="Air" color="var(--sky)" icon={Droplets} />
          <RadialProgress value={7.5} target={8.0} unit="jam" label="Tidur" color="var(--amber)" icon={Moon} />
        </div>
      </div>

      {/* Wellness Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Health Pulse Card */}
        <div className="card card-pad border-line bg-card space-y-4 hover:border-brand/35 transition duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-line/45">
            <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-brand" /> Ringkasan Health Pulse
            </h3>
            <span className="pill bg-brand-soft text-brand font-bold text-xs">Sangat Baik</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Skor Health Pulse</span>
            <span className="stat-num text-2xl font-extrabold text-foreground">78 / 100</span>
          </div>
          <p className="text-xs text-muted-foreground leading-normal">
            Pola kesehatan secara umum baik. Aktivitas dan hidrasi menunjukkan peningkatan.
          </p>
        </div>

        {/* Active Challenge Card */}
        <div className="card card-pad border-line bg-card space-y-4 hover:border-brand/35 transition duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-line/45">
            <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-4 w-4 text-brand" /> Tantangan Aktif
            </h3>
            <span className="pill bg-amber/10 text-amber border border-amber/15 text-[10px] font-bold">Menengah</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground">Perjalanan Kardio Ringan</p>
            <p className="text-xs text-muted-foreground">Progres: 7,2 / 10,0 km (72%)</p>
          </div>
          <div className="chart-progress h-2 overflow-hidden rounded-full">
            <div className="h-full rounded-full bg-brand" style={{ width: "72%" }} />
          </div>
        </div>
      </div>

      {/* Collection */}
      <ProfileCollection />

      {/* Privacy Summary Card */}
      <div className="card card-pad border-line bg-card space-y-4">
        <div className="flex items-center gap-2 border-b border-line/45 pb-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
            <Lock className="h-5 w-5" />
          </span>
          <h3 className="font-display text-base font-bold text-foreground">Privasi &amp; Berbagi Profil</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20">
            <span className="text-muted-foreground font-semibold">Visibilitas Profil</span>
            <span className="pill bg-secondary text-muted-foreground font-bold">Lingkaran Saja</span>
          </div>

          <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20">
            <span className="text-muted-foreground font-semibold">Berbagi Skor Pulse</span>
            <span className="pill bg-secondary text-muted-foreground font-bold">Lingkaran Saja</span>
          </div>

          <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20">
            <span className="text-muted-foreground font-semibold">Ringkasan Aktivitas</span>
            <span className="pill bg-secondary text-muted-foreground font-bold">Lingkaran Saja</span>
          </div>

          <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20">
            <span className="text-muted-foreground font-semibold">Progres Tantangan</span>
            <span className="pill bg-secondary text-muted-foreground font-bold">Lingkaran Saja</span>
          </div>

          <div className="flex justify-between items-center border border-line p-3 rounded-xl bg-secondary/20 col-span-2">
            <span className="text-muted-foreground font-semibold">Catatan Nutrisi &amp; Pemulihan</span>
            <span className="pill bg-brand-soft text-brand font-bold flex items-center gap-0.5">
              <Eye className="h-3.5 w-3.5" /> Privat Penuh
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-[10px] text-muted-foreground pt-1">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
          <p>
            NutriVerse memakai telemetri lokasi hanya untuk memverifikasi jarak olahraga GPS. Catatan nutrisi, hidrasi, dan tidur tetap privat.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/pengaturan" className="btn btn-outline w-full py-2.5 text-center flex items-center justify-center gap-1.5 font-bold">
            <Compass className="h-4.5 w-4.5" /> Kelola Privasi dan Preferensi
          </Link>
        </div>
      </div>
    </div>
  );
}
