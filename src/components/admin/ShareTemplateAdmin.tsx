"use client";

import NextImage from "next/image";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, Eye, ImagePlus, Move, Plus, RotateCcw, Save, Settings2, Upload, WandSparkles } from "lucide-react";

type DataField = { key: string; label: string };
type PresetKey = "HEALTH_PULSE" | "ACTIVITY" | "PROGRESS" | "CUSTOM";
type FontFamily = "INTER" | "JAKARTA" | "ARIAL" | "GEORGIA";
type TextAlign = "left" | "center" | "right";
type FontWeight = 400 | 500 | 600 | 700 | 800 | 900;

type ElementDraft = {
  id: string;
  kind: "text" | "image";
  dataKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: FontFamily;
  fontWeight: FontWeight;
  color: string;
  align: TextAlign;
  required: boolean;
  userCanHide: boolean;
};

type TemplateRow = {
  id: string;
  name: string;
  category: string;
  aspectRatio: string;
  backgroundUrl: string | null;
  status: string;
  version: number;
  updatedAt: string;
  _count: { moments: number };
};

type TemplatePreset = {
  key: Exclude<PresetKey, "CUSTOM">;
  name: string;
  description: string;
  category: string;
  recommendedRatio: "SQUARE" | "PORTRAIT" | "STORY" | "LANDSCAPE";
  elements: Array<Omit<ElementDraft, "id">>;
};

const BASE_TEXT = {
  kind: "text" as const,
  fontFamily: "JAKARTA" as const,
  fontWeight: 800 as const,
  color: "#ffffff",
  align: "center" as const,
  required: false,
  userCanHide: false,
};

const PRESETS: TemplatePreset[] = [
  {
    key: "HEALTH_PULSE",
    name: "Health Pulse",
    description: "Skor, nama, perubahan, dan tren kebiasaan.",
    category: "Health Pulse",
    recommendedRatio: "PORTRAIT",
    elements: [
      { ...BASE_TEXT, dataKey: "healthPulse.current", x: 25, y: 27, width: 50, height: 18, fontSize: 104 },
      { ...BASE_TEXT, dataKey: "user.name", x: 18, y: 64, width: 64, height: 8, fontSize: 40 },
      { ...BASE_TEXT, dataKey: "healthPulse.delta", x: 9, y: 81, width: 38, height: 8, fontSize: 30 },
      { ...BASE_TEXT, dataKey: "healthPulse.trend", x: 53, y: 81, width: 38, height: 8, fontSize: 30 },
    ],
  },
  {
    key: "ACTIVITY",
    name: "Ringkasan Aktivitas",
    description: "Aktivitas, jarak, durasi, kalori, dan nama user.",
    category: "Aktivitas",
    recommendedRatio: "PORTRAIT",
    elements: [
      { ...BASE_TEXT, dataKey: "activity.type", x: 10, y: 12, width: 80, height: 9, fontSize: 54 },
      { ...BASE_TEXT, dataKey: "user.name", x: 16, y: 23, width: 68, height: 7, fontSize: 30 },
      { ...BASE_TEXT, dataKey: "activity.distance", x: 8, y: 68, width: 40, height: 10, fontSize: 46 },
      { ...BASE_TEXT, dataKey: "activity.duration", x: 52, y: 68, width: 40, height: 10, fontSize: 46 },
      { ...BASE_TEXT, dataKey: "activity.calories", x: 8, y: 82, width: 40, height: 8, fontSize: 30 },
      { ...BASE_TEXT, dataKey: "activity.date", x: 52, y: 82, width: 40, height: 8, fontSize: 25 },
    ],
  },
  {
    key: "PROGRESS",
    name: "Streak & Progres",
    description: "Streak, rank, XP, Health Pulse, dan nama user.",
    category: "Progres",
    recommendedRatio: "SQUARE",
    elements: [
      { ...BASE_TEXT, dataKey: "user.name", x: 15, y: 15, width: 70, height: 9, fontSize: 42 },
      { ...BASE_TEXT, dataKey: "progress.streak", x: 10, y: 42, width: 36, height: 12, fontSize: 44 },
      { ...BASE_TEXT, dataKey: "progress.rank", x: 54, y: 42, width: 36, height: 12, fontSize: 44 },
      { ...BASE_TEXT, dataKey: "progress.xp", x: 10, y: 68, width: 36, height: 10, fontSize: 36 },
      { ...BASE_TEXT, dataKey: "healthPulse.current", x: 54, y: 68, width: 36, height: 10, fontSize: 36 },
    ],
  },
];

const SAMPLE_VALUES: Record<string, string> = {
  "user.name": "Dimas Pratama",
  "user.username": "@dimas",
  "activity.type": "Lari Pagi",
  "activity.date": "28 Agustus 2026",
  "activity.distance": "5,20 km",
  "activity.duration": "32 menit",
  "activity.calories": "310 kkal",
  "progress.streak": "12 hari",
  "progress.rank": "BLOOM",
  "progress.xp": "2.450 XP",
  "healthPulse.current": "78",
  "healthPulse.previous": "76,8",
  "healthPulse.delta": "↑ 1,2 poin",
  "healthPulse.trend": "Meningkat",
};

const FONT_OPTIONS: Array<{ value: FontFamily; label: string }> = [
  { value: "JAKARTA", label: "Plus Jakarta Sans" },
  { value: "INTER", label: "Inter" },
  { value: "ARIAL", label: "Arial" },
  { value: "GEORGIA", label: "Georgia" },
];

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function materializePreset(preset: TemplatePreset) {
  const stamp = Date.now();
  return preset.elements.map((element, index) => ({ ...element, id: `${preset.key.toLowerCase()}-${stamp}-${index}` }));
}

function fontFamilyValue(font: FontFamily) {
  if (font === "JAKARTA") return "var(--font-jakarta), Arial, sans-serif";
  if (font === "INTER") return "var(--font-inter), Arial, sans-serif";
  if (font === "GEORGIA") return "Georgia, serif";
  return "Arial, sans-serif";
}

function isImageDataKey(dataKey: string) {
  return dataKey === "moment.photo" || dataKey === "user.avatar";
}

export function ShareTemplateAdmin({ canPublish }: { canPublish: boolean }) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [fields, setFields] = useState<DataField[]>([]);
  const [elements, setElements] = useState<ElementDraft[]>([]);
  const [presetKey, setPresetKey] = useState<PresetKey | "">("");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Aktivitas");
  const [aspectRatio, setAspectRatio] = useState("PORTRAIT");
  const [photoAsBackground, setPhotoAsBackground] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [dragging, setDragging] = useState<{ id: string; clientX: number; clientY: number; startX: number; startY: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedElementId) ?? null,
    [elements, selectedElementId],
  );

  async function load() {
    const response = await fetch("/api/admin/share-templates", { cache: "no-store" });
    const result = (await response.json().catch(() => null)) as { success?: boolean; templates?: TemplateRow[]; dataFields?: DataField[]; error?: string } | null;
    if (response.ok && result?.success) {
      setTemplates(result.templates ?? []);
      setFields(result.dataFields ?? []);
    } else {
      setMessage(result?.error ?? "Template belum dapat dimuat.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    function move(event: PointerEvent) {
      const preview = previewRef.current;
      if (!preview || !dragging) return;
      const bounds = preview.getBoundingClientRect();
      const nextX = dragging.startX + ((event.clientX - dragging.clientX) / bounds.width) * 100;
      const nextY = dragging.startY + ((event.clientY - dragging.clientY) / bounds.height) * 100;
      setElements((current) => current.map((item) => item.id === dragging.id ? {
        ...item,
        x: Math.round(clamp(nextX, 0, 100 - item.width) * 100) / 100,
        y: Math.round(clamp(nextY, 0, 100 - item.height) * 100) / 100,
      } : item));
    }
    function stop() { setDragging(null); }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [dragging]);

  function applyPreset(key: Exclude<PresetKey, "CUSTOM">) {
    const preset = PRESETS.find((item) => item.key === key);
    if (!preset) return;
    const next = materializePreset(preset);
    setPresetKey(key);
    setElements(next);
    setSelectedElementId(next[0]?.id ?? null);
    setCategory(preset.category);
    if (!backgroundUrl) setAspectRatio(preset.recommendedRatio);
    setMessage(`${preset.name} diterapkan. Area dapat langsung digunakan atau digeser pada preview.`);
  }

  async function uploadBackground(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      if ("createImageBitmap" in window) {
        const bitmap = await createImageBitmap(file);
        const ratio = bitmap.width / bitmap.height;
        const closest = [
          { key: "SQUARE", ratio: 1 }, { key: "PORTRAIT", ratio: 4 / 5 },
          { key: "STORY", ratio: 9 / 16 }, { key: "LANDSCAPE", ratio: 16 / 9 },
        ].sort((left, right) => Math.abs(left.ratio - ratio) - Math.abs(right.ratio - ratio))[0];
        if (closest) setAspectRatio(closest.key);
        bitmap.close();
      }
      const form = new FormData();
      form.set("bucket", "share-templates");
      form.set("file", file);
      const response = await fetch("/api/storage/upload", { method: "POST", body: form });
      const result = (await response.json().catch(() => null)) as { publicUrl?: string; error?: string } | null;
      if (!response.ok || !result?.publicUrl) {
        setMessage(result?.error ?? "Gambar template gagal diunggah.");
        return;
      }
      setBackgroundUrl(result.publicUrl);
      setUploadedFileName(file.name);
      setMessage("Gambar berhasil diunggah. Pilih preset lalu periksa preview.");
    } catch {
      setMessage("Gambar belum dapat dibaca atau diunggah. Gunakan PNG, JPG, atau WebP.");
    } finally {
      setBusy(false);
    }
  }

  function updateElement(id: string, patch: Partial<ElementDraft>) {
    setElements((current) => current.map((element) => element.id === id ? { ...element, ...patch } : element));
  }

  function addElement(dataKey: string) {
    if (elements.some((element) => element.dataKey === dataKey)) return;
    const field = fields.find((item) => item.key === dataKey);
    if (!field) return;
    const imageField = isImageDataKey(dataKey);
    const element: ElementDraft = {
      ...BASE_TEXT,
      id: `${dataKey}-${Date.now()}`,
      kind: imageField ? "image" : "text",
      dataKey,
      x: 20,
      y: 35,
      width: 60,
      height: imageField ? 45 : 10,
      fontSize: 36,
    };
    setElements((current) => [...current, element]);
    setSelectedElementId(element.id);
    setPresetKey("CUSTOM");
  }

  function resetPreset() {
    if (presetKey === "HEALTH_PULSE" || presetKey === "ACTIVITY" || presetKey === "PROGRESS") applyPreset(presetKey);
  }

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, element: ElementDraft) {
    event.preventDefault();
    setSelectedElementId(element.id);
    setDragging({ id: element.id, clientX: event.clientX, clientY: event.clientY, startX: element.x, startY: element.y });
  }

  function resetForm() {
    setName(""); setDescription(""); setCategory("Aktivitas"); setAspectRatio("PORTRAIT");
    setPresetKey(""); setElements([]); setSelectedElementId(null); setBackgroundUrl("");
    setUploadedFileName(""); setPhotoAsBackground(false); setAdvancedOpen(false);
  }

  async function save(publishAfter = false) {
    if (!name.trim()) { setMessage("Isi nama template terlebih dahulu."); return; }
    if (!backgroundUrl) { setMessage("Unggah gambar PNG, JPG, atau WebP terlebih dahulu."); return; }
    if (!presetKey || elements.length === 0) { setMessage("Pilih salah satu preset data terlebih dahulu."); return; }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/share-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, category, aspectRatio, backgroundUrl, thumbnailUrl: backgroundUrl, layoutConfig: { elements, photoAsBackground, presetKey } }),
      });
      const result = (await response.json().catch(() => null)) as { success?: boolean; template?: { id: string }; error?: string } | null;
      if (!response.ok || !result?.success || !result.template) { setMessage(result?.error ?? "Template gagal disimpan."); return; }
      if (publishAfter) {
        const publishResponse = await fetch(`/api/admin/share-templates/${result.template.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "PUBLISHED" }),
        });
        const publishResult = (await publishResponse.json().catch(() => null)) as { success?: boolean; error?: string } | null;
        if (!publishResponse.ok || !publishResult?.success) {
          setMessage(publishResult?.error ?? "Draft tersimpan, tetapi belum dapat dipublikasikan.");
          await load();
          return;
        }
      }
      resetForm();
      setMessage(publishAfter ? "Template berhasil disimpan dan dipublikasikan." : "Template tersimpan sebagai draft.");
      await load();
    } catch {
      setMessage("Template belum dapat disimpan. Periksa koneksi lalu coba kembali.");
    } finally { setBusy(false); }
  }

  async function changeStatus(template: TemplateRow, status: "PUBLISHED" | "ARCHIVED") {
    const response = await fetch(`/api/admin/share-templates/${template.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    const result = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;
    if (!response.ok || !result?.success) setMessage(result?.error ?? "Status template gagal diubah.");
    else { setMessage(status === "PUBLISHED" ? "Template sudah dipublikasikan." : "Template sudah diarsipkan."); await load(); }
  }

  const ratioClass = aspectRatio === "STORY" ? "aspect-[9/16]" : aspectRatio === "PORTRAIT" ? "aspect-[4/5]" : aspectRatio === "LANDSCAPE" ? "aspect-video" : "aspect-square";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Studio Berbagi</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">Buat template dalam empat langkah</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">Upload desain dari Canva, pilih preset, periksa preview, lalu publikasikan. Posisi teknis sudah disiapkan oleh sistem.</p>
          </div>
          <span className="pill self-start bg-brand-soft text-[10px] font-bold text-brand">TANPA KOORDINAT MANUAL</span>
        </div>
        {message && <p className="mt-4 rounded-2xl border border-line bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">{message}</p>}

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
          <div className="space-y-4">
            <StepCard number="1" title="Informasi template" description="Beri nama agar mudah ditemukan user.">
              <div className="grid gap-3 sm:grid-cols-2">
                <label><span className="label">Nama template</span><input value={name} onChange={(event) => setName(event.target.value)} className="input mt-1" placeholder="Contoh: Health Pulse Hijau" /></label>
                <label><span className="label">Rasio</span><select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)} className="input mt-1"><option value="SQUARE">Post 1:1</option><option value="PORTRAIT">Feed 4:5</option><option value="STORY">Story 9:16</option><option value="LANDSCAPE">Landscape 16:9</option></select></label>
                <label className="sm:col-span-2"><span className="label">Deskripsi singkat (opsional)</span><input value={description} onChange={(event) => setDescription(event.target.value)} className="input mt-1" placeholder="Tampilan ringkas progres Health Pulse" /></label>
              </div>
            </StepCard>

            <StepCard number="2" title="Upload gambar Canva" description="PNG direkomendasikan; JPG dan WebP juga didukung.">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-brand/35 bg-brand-soft/10 p-4 transition hover:bg-brand-soft/20">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Upload className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{uploadedFileName || "Pilih PNG, JPG, atau WebP"}</span><span className="mt-1 block text-[10px] text-muted-foreground">Maksimal 15 MB. Rasio dikenali otomatis.</span></span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void uploadBackground(event.target.files?.[0])} />
              </label>
              <label className="mt-3 flex items-start gap-3 rounded-xl bg-secondary/35 p-3"><input type="checkbox" checked={photoAsBackground} onChange={(event) => setPhotoAsBackground(event.target.checked)} className="mt-0.5" /><span><span className="block text-[11px] font-bold">Foto user berada di belakang desain</span><span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">Aktifkan hanya jika desain Canva berupa overlay PNG transparan.</span></span></label>
            </StepCard>

            <StepCard number="3" title="Pilih preset data" description="Area data langsung muncul pada posisi yang disarankan.">
              <div className="grid gap-2 sm:grid-cols-3">
                {PRESETS.map((preset) => {
                  const active = presetKey === preset.key;
                  return <button key={preset.key} type="button" onClick={() => applyPreset(preset.key)} className={`rounded-2xl border p-3 text-left transition ${active ? "border-brand bg-brand-soft/30 ring-1 ring-brand/20" : "border-line hover:border-brand/30 hover:bg-secondary/30"}`}><WandSparkles className={`h-4 w-4 ${active ? "text-brand" : "text-muted-foreground"}`} /><span className="mt-2 block text-xs font-bold">{preset.name}</span><span className="mt-1 block text-[9px] leading-relaxed text-muted-foreground">{preset.description}</span></button>;
                })}
              </div>
            </StepCard>

            <StepCard number="4" title="Simpan atau publikasikan" description="Preview menggunakan data contoh, bukan data user asli." icon={<Eye className="h-5 w-5 text-muted-foreground" />}>
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => void save(false)} disabled={busy} className="btn btn-outline"><Save className="h-4 w-4" /> Simpan Draft</button>
                {canPublish && <button type="button" onClick={() => void save(true)} disabled={busy} className="btn btn-primary"><Check className="h-4 w-4" /> Simpan & Publikasikan</button>}
              </div>
            </StepCard>
          </div>

          <div className="rounded-2xl border border-line bg-secondary/20 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="font-display text-base font-extrabold">Preview dengan data contoh</h3><p className="mt-1 text-[10px] text-muted-foreground">Klik dan geser kotak data untuk menyesuaikan posisinya.</p></div>
              <div className="flex gap-2"><button type="button" disabled={!presetKey || presetKey === "CUSTOM"} onClick={resetPreset} className="btn btn-outline btn-sm"><RotateCcw className="h-3.5 w-3.5" /> Kembali ke preset</button><button type="button" onClick={() => setAdvancedOpen((current) => !current)} className="btn btn-outline btn-sm"><Settings2 className="h-3.5 w-3.5" /> Sesuaikan</button></div>
            </div>

            <div ref={previewRef} className={`relative mx-auto mt-4 max-h-[720px] w-full touch-none overflow-hidden rounded-2xl bg-gradient-to-br from-[#052f22] via-brand to-lime shadow-premium ${ratioClass}`}>
              {backgroundUrl && <NextImage src={backgroundUrl} alt="Preview template" fill unoptimized className="pointer-events-none object-cover" />}
              {!backgroundUrl && <div className="absolute inset-0 grid place-items-center p-8 text-center"><div><ImagePlus className="mx-auto h-9 w-9 text-white/70" /><p className="mt-3 text-xs font-bold text-white">Upload gambar Canva</p><p className="mt-1 text-[10px] text-white/70">Preview desain akan muncul di sini.</p></div></div>}
              {elements.map((element) => {
                const active = selectedElementId === element.id;
                return <button key={element.id} type="button" onPointerDown={(event) => startDrag(event, element)} className={`absolute overflow-hidden border-2 border-dashed px-1 text-white transition ${active ? "z-20 border-sky-300 bg-sky-400/20 ring-2 ring-sky-300/35" : "z-10 border-white/55 bg-black/15 hover:border-sky-200"}`} style={{ left: `${element.x}%`, top: `${element.y}%`, width: `${element.width}%`, height: `${element.height}%`, color: element.color, fontFamily: fontFamilyValue(element.fontFamily), fontWeight: element.fontWeight, fontSize: `${Math.max(8, element.fontSize / 3.25)}px`, textAlign: element.align }} title="Geser untuk memindahkan area data">{element.kind === "image" ? <span className="grid h-full place-items-center"><ImagePlus className="h-5 w-5" /></span> : <span className="flex h-full items-center justify-center truncate">{SAMPLE_VALUES[element.dataKey] ?? element.dataKey}</span>}</button>;
              })}
              {elements.length > 0 && <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/65 px-3 py-1 text-[9px] font-bold text-white"><Move className="h-3 w-3" /> Area dapat digeser</div>}
            </div>

            {advancedOpen && <AdvancedControls fields={fields} elements={elements} selectedElement={selectedElement} updateElement={updateElement} addElement={addElement} removeElement={(id) => { setElements((current) => current.filter((item) => item.id !== id)); setSelectedElementId(null); setPresetKey("CUSTOM"); }} />}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
        <div className="border-b border-line p-5"><h2 className="font-display text-lg font-extrabold">Template Database</h2><p className="mt-1 text-xs text-muted-foreground">Draft dapat dipublikasikan oleh Super Admin.</p></div>
        <div className="divide-y divide-line/60">{templates.length === 0 ? <p className="p-6 text-center text-xs text-muted-foreground">Belum ada template.</p> : templates.map((template) => <article key={template.id} className="flex flex-wrap items-center gap-4 p-5"><div className="relative h-16 w-16 overflow-hidden rounded-xl bg-secondary">{template.backgroundUrl && <NextImage src={template.backgroundUrl} alt="" fill unoptimized className="object-cover" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{template.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{template.category} · v{template.version} · {template._count.moments} digunakan</p></div><span className="pill bg-secondary text-[9px] font-bold">{template.status}</span>{template.status === "DRAFT" && <button disabled={!canPublish} onClick={() => void changeStatus(template, "PUBLISHED")} className="btn btn-primary btn-sm"><Check className="h-4 w-4" /> Publikasikan</button>}{template.status === "PUBLISHED" && <button disabled={!canPublish} onClick={() => void changeStatus(template, "ARCHIVED")} className="btn btn-outline btn-sm">Arsipkan</button>}</article>)}</div>
      </section>
    </div>
  );
}

function StepCard({ number, title, description, icon, children }: { number: string; title: string; description: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-line p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-extrabold text-white">{number}</span><div><h3 className="text-sm font-bold">{title}</h3><p className="text-[11px] text-muted-foreground">{description}</p></div></div>{icon}</div><div className="mt-4">{children}</div></div>;
}

function AdvancedControls({ fields, elements, selectedElement, updateElement, addElement, removeElement }: { fields: DataField[]; elements: ElementDraft[]; selectedElement: ElementDraft | null; updateElement: (id: string, patch: Partial<ElementDraft>) => void; addElement: (key: string) => void; removeElement: (id: string) => void }) {
  return <div className="mt-4 rounded-2xl border border-line bg-card p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold">Penyesuaian opsional</p><p className="mt-0.5 text-[10px] text-muted-foreground">Pilih area pada preview, lalu ubah tampilannya.</p></div>{selectedElement && <button type="button" onClick={() => removeElement(selectedElement.id)} className="text-[10px] font-bold text-rose-500">Hapus area</button>}</div>
    {selectedElement ? <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label><span className="label">Data</span><select value={selectedElement.dataKey} onChange={(event) => { const dataKey = event.target.value; updateElement(selectedElement.id, { dataKey, kind: isImageDataKey(dataKey) ? "image" : "text" }); }} className="input mt-1">{fields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}</select></label>
      <label><span className="label">Font</span><select value={selectedElement.fontFamily} onChange={(event) => updateElement(selectedElement.id, { fontFamily: event.target.value as FontFamily })} className="input mt-1">{FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}</select></label>
      <label><span className="label">Ukuran teks: {selectedElement.fontSize}px</span><input type="range" min="8" max="160" value={selectedElement.fontSize} onChange={(event) => updateElement(selectedElement.id, { fontSize: Number(event.target.value) })} className="mt-2 w-full" /></label>
      <label><span className="label">Ketebalan</span><select value={selectedElement.fontWeight} onChange={(event) => updateElement(selectedElement.id, { fontWeight: Number(event.target.value) as FontWeight })} className="input mt-1"><option value="400">Regular</option><option value="600">Semi Bold</option><option value="700">Bold</option><option value="800">Extra Bold</option><option value="900">Black</option></select></label>
      <label><span className="label">Warna teks</span><input type="color" value={selectedElement.color} onChange={(event) => updateElement(selectedElement.id, { color: event.target.value })} className="mt-1 h-10 w-full rounded-xl border border-line bg-transparent p-1" /></label>
      <label><span className="label">Perataan</span><select value={selectedElement.align} onChange={(event) => updateElement(selectedElement.id, { align: event.target.value as TextAlign })} className="input mt-1"><option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option></select></label>
      <label><span className="label">Lebar area: {selectedElement.width}%</span><input type="range" min="5" max="100" value={selectedElement.width} onChange={(event) => updateElement(selectedElement.id, { width: Number(event.target.value) })} className="mt-2 w-full" /></label>
      <label><span className="label">Tinggi area: {selectedElement.height}%</span><input type="range" min="3" max="100" value={selectedElement.height} onChange={(event) => updateElement(selectedElement.id, { height: Number(event.target.value) })} className="mt-2 w-full" /></label>
    </div> : <p className="mt-4 rounded-xl bg-secondary/40 p-3 text-[10px] text-muted-foreground">Klik salah satu area pada preview untuk mengaturnya.</p>}
    <div className="mt-4 border-t border-line pt-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tambah area lain</p><div className="mt-2 flex flex-wrap gap-2">{fields.map((field) => <button key={field.key} type="button" disabled={elements.some((element) => element.dataKey === field.key)} onClick={() => addElement(field.key)} className="rounded-full border border-line px-3 py-1.5 text-[9px] font-bold text-muted-foreground disabled:opacity-35"><Plus className="mr-1 inline h-3 w-3" />{field.label}</button>)}</div></div>
  </div>;
}
