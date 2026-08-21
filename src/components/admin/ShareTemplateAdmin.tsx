"use client";

import NextImage from "next/image";
import { useEffect, useState } from "react";
import { Check, ImagePlus, Plus, Save, Upload } from "lucide-react";

type DataField = { key: string; label: string };
type ElementDraft = { id: string; kind: "text" | "image"; dataKey: string; x: number; y: number; width: number; height: number; fontSize: number; color: string; required: boolean; userCanHide: boolean };
type TemplateRow = { id: string; name: string; category: string; aspectRatio: string; backgroundUrl: string | null; status: string; version: number; updatedAt: string; _count: { moments: number } };

const EMPTY_ELEMENT = (field: DataField, index: number): ElementDraft => ({
  id: `${field.key}-${Date.now()}`,
  kind: field.key.includes("photo") || field.key.includes("avatar") ? "image" : "text",
  dataKey: field.key,
  x: 6,
  y: Math.min(82, 8 + index * 11),
  width: field.key.includes("photo") ? 88 : 48,
  height: field.key.includes("photo") ? 50 : 9,
  fontSize: 32,
  color: "#ffffff",
  required: false,
  userCanHide: false,
});

export function ShareTemplateAdmin({ canPublish }: { canPublish: boolean }) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [fields, setFields] = useState<DataField[]>([]);
  const [elements, setElements] = useState<ElementDraft[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Aktivitas");
  const [aspectRatio, setAspectRatio] = useState("SQUARE");
  const [photoAsBackground, setPhotoAsBackground] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/share-templates", { cache: "no-store" });
    const result = await response.json().catch(() => null) as { success?: boolean; templates?: TemplateRow[]; dataFields?: DataField[]; error?: string } | null;
    if (response.ok && result?.success) {
      setTemplates(result.templates ?? []);
      setFields(result.dataFields ?? []);
    } else setMessage(result?.error ?? "Template belum dapat dimuat.");
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, []);

  async function uploadBackground(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("bucket", "share-templates");
      form.set("file", file);
      const response = await fetch("/api/storage/upload", { method: "POST", body: form });
      const result = await response.json().catch(() => null) as { publicUrl?: string; error?: string } | null;
      if (!response.ok || !result?.publicUrl) setMessage(result?.error ?? "Background gagal diunggah.");
      else { setBackgroundUrl(result.publicUrl); setMessage("Background berhasil diunggah."); }
    } finally { setBusy(false); }
  }

  function addElement(dataKey: string) {
    const field = fields.find((item) => item.key === dataKey);
    if (!field || elements.some((element) => element.dataKey === dataKey)) return;
    setElements((current) => [...current, EMPTY_ELEMENT(field, current.length)]);
  }

  function updateElement(id: string, patch: Partial<ElementDraft>) {
    setElements((current) => current.map((element) => element.id === id ? { ...element, ...patch } : element));
  }

  function togglePhotoBackground(checked: boolean) {
    setPhotoAsBackground(checked);
    if (!checked) return;
    const photoField = fields.find((field) => field.key === "moment.photo");
    if (!photoField) return;
    setElements((current) => current.some((element) => element.dataKey === "moment.photo")
      ? current.map((element) => element.dataKey === "moment.photo" ? { ...element, required: true, userCanHide: false } : element)
      : [{ ...EMPTY_ELEMENT(photoField, 0), x: 0, y: 0, width: 100, height: 100, required: true, userCanHide: false }, ...current]);
  }

  async function save() {
    if (!name.trim() || elements.length === 0) { setMessage("Isi nama dan tambahkan minimal satu elemen data."); return; }
    setBusy(true);
    const response = await fetch("/api/admin/share-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, aspectRatio, backgroundUrl: backgroundUrl || null, thumbnailUrl: backgroundUrl || null, layoutConfig: { elements, photoAsBackground } }),
    });
    const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
    setBusy(false);
    if (!response.ok || !result?.success) { setMessage(result?.error ?? "Template gagal disimpan."); return; }
    setName(""); setBackgroundUrl(""); setElements([]); setPhotoAsBackground(false); setMessage("Template tersimpan sebagai draft."); await load();
  }

  async function changeStatus(template: TemplateRow, status: "PUBLISHED" | "ARCHIVED") {
    const response = await fetch(`/api/admin/share-templates/${template.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
    if (!response.ok || !result?.success) setMessage(result?.error ?? "Status template gagal diubah.");
    else { setMessage(status === "PUBLISHED" ? "Template sudah dipublikasikan." : "Template sudah diarsipkan."); await load(); }
  }

  const ratioClass = aspectRatio === "STORY" ? "aspect-[9/16]" : aspectRatio === "PORTRAIT" ? "aspect-[4/5]" : aspectRatio === "LANDSCAPE" ? "aspect-video" : "aspect-square";
  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-line bg-card p-5 shadow-soft">
          <div><p className="text-[9px] font-bold uppercase tracking-wider text-brand">Studio Berbagi</p><h2 className="mt-1 font-display text-lg font-extrabold">Buat Template Dinamis</h2><p className="mt-1 text-xs text-muted-foreground">Pilih field yang aman, lalu atur posisi dalam persentase canvas.</p></div>
          {message && <p className="mt-4 rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">{message}</p>}
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><label><span className="label">Nama template</span><input value={name} onChange={(event) => setName(event.target.value)} className="input mt-1" placeholder="Morning Run Summary" /></label><label><span className="label">Kategori</span><input value={category} onChange={(event) => setCategory(event.target.value)} className="input mt-1" /></label><label><span className="label">Rasio</span><select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)} className="input mt-1"><option value="SQUARE">Post 1:1</option><option value="PORTRAIT">Feed 4:5</option><option value="STORY">Story 9:16</option><option value="LANDSCAPE">Landscape 16:9</option></select></label><label className="flex flex-col"><span className="label">Overlay desain</span><span className="btn btn-outline btn-sm mt-1 cursor-pointer"><Upload className="h-4 w-4" /> Unggah PNG transparan<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void uploadBackground(event.target.files?.[0])} /></span></label></div>
          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-line bg-secondary/30 p-4"><input type="checkbox" checked={photoAsBackground} onChange={(event) => togglePhotoBackground(event.target.checked)} className="mt-0.5" /><span><span className="block text-xs font-bold">Foto user sebagai background penuh</span><span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">Foto memenuhi canvas dengan mode cover, lalu desain transparan dan data ditempel sebagai overlay.</span></span></label>
          <div className="mt-5"><span className="label">Tambahkan data</span><div className="mt-2 flex flex-wrap gap-2">{fields.map((field) => <button key={field.key} type="button" disabled={elements.some((element) => element.dataKey === field.key)} onClick={() => addElement(field.key)} className="rounded-full border border-line px-3 py-1.5 text-[10px] font-bold text-muted-foreground disabled:opacity-35"><Plus className="mr-1 inline h-3 w-3" />{field.label}</button>)}</div></div>
          <div className="mt-5 space-y-3">{elements.map((element) => <article key={element.id} className="rounded-2xl border border-line p-4"><div className="flex items-center justify-between"><p className="text-xs font-bold">{fields.find((field) => field.key === element.dataKey)?.label ?? element.dataKey}</p><button onClick={() => setElements((current) => current.filter((item) => item.id !== element.id))} className="text-[10px] font-bold text-rose-500">Hapus</button></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{(["x", "y", "width", "height"] as const).map((key) => <label key={key}><span className="text-[9px] uppercase text-muted-foreground">{key}</span><input type="number" min="0" max="100" value={element[key]} onChange={(event) => updateElement(element.id, { [key]: Number(event.target.value) })} className="input mt-1" /></label>)}</div><div className="mt-3 flex flex-wrap gap-3"><label className="text-[10px]"><input type="checkbox" checked={element.required} onChange={(event) => updateElement(element.id, { required: event.target.checked })} className="mr-1" />Wajib</label></div></article>)}</div>
          <button onClick={() => void save()} disabled={busy} className="btn btn-primary mt-5 w-full"><Save className="h-4 w-4" /> {busy ? "Menyimpan…" : "Simpan Draft"}</button>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5 shadow-soft"><h3 className="font-display text-base font-extrabold">Preview Canvas</h3><div className={`relative mx-auto mt-4 max-h-[680px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#07553b] via-brand to-lime ${ratioClass}`}>{backgroundUrl && <NextImage src={backgroundUrl} alt="Preview background" fill unoptimized className="object-cover" />}{elements.map((element) => <div key={element.id} className="absolute overflow-hidden border border-dashed border-white/50 bg-black/20 p-1 text-white" style={{ left: `${element.x}%`, top: `${element.y}%`, width: `${element.width}%`, height: `${element.height}%`, color: element.color, fontSize: `${Math.max(8, element.fontSize / 3)}px` }}>{element.kind === "image" ? <span className="grid h-full place-items-center"><ImagePlus className="h-5 w-5" /></span> : fields.find((field) => field.key === element.dataKey)?.label}</div>)}</div></div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft"><div className="border-b border-line p-5"><h2 className="font-display text-lg font-extrabold">Template Database</h2><p className="mt-1 text-xs text-muted-foreground">Draft dapat dipublikasikan oleh Super Admin.</p></div><div className="divide-y divide-line/60">{templates.length === 0 ? <p className="p-6 text-center text-xs text-muted-foreground">Belum ada template.</p> : templates.map((template) => <article key={template.id} className="flex flex-wrap items-center gap-4 p-5"><div className="relative h-16 w-16 overflow-hidden rounded-xl bg-secondary">{template.backgroundUrl && <NextImage src={template.backgroundUrl} alt="" fill unoptimized className="object-cover" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{template.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{template.category} · v{template.version} · {template._count.moments} digunakan</p></div><span className="pill bg-secondary text-[9px] font-bold">{template.status}</span>{template.status === "DRAFT" && <button disabled={!canPublish} onClick={() => void changeStatus(template, "PUBLISHED")} className="btn btn-primary btn-sm"><Check className="h-4 w-4" /> Publikasikan</button>}{template.status === "PUBLISHED" && <button disabled={!canPublish} onClick={() => void changeStatus(template, "ARCHIVED")} className="btn btn-outline btn-sm">Arsipkan</button>}</article>)}</div></section>
    </div>
  );
}
