"use client";
import { useEffect, useState } from "react";

type Item = { id: string; name: string; slug: string };
export function CmsTaxonomyPanel() {
  const [categories, setCategories] = useState<Item[]>([]); const [tags, setTags] = useState<Item[]>([]);
  async function load() { const [c, t] = await Promise.all([fetch("/api/admin/cms/categories"), fetch("/api/admin/cms/tags")]); setCategories((await c.json()).categories ?? []); setTags((await t.json()).tags ?? []); }
  useEffect(() => { void load(); }, []);
  async function edit(type: "categories" | "tags", item: Item) { const name = window.prompt("Nama", item.name); if (!name?.trim()) return; const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); await fetch(`/api/admin/cms/${type}/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, slug }) }); await load(); }
  async function remove(type: "categories" | "tags", item: Item) { if (!window.confirm(`Hapus ${item.name}?`)) return; const response = await fetch(`/api/admin/cms/${type}/${item.id}`, { method: "DELETE" }); if (!response.ok) window.alert((await response.json()).error ?? "Tidak dapat dihapus"); await load(); }
  function list(type: "categories" | "tags", items: Item[]) { return <section className="rounded-2xl border border-line bg-card p-5 shadow-soft"><h2 className="font-display text-base font-extrabold">{type === "categories" ? "Kategori" : "Tag"}</h2><div className="mt-3 divide-y divide-line/60">{items.length === 0 ? <p className="py-5 text-sm text-muted-foreground">Belum ada data.</p> : items.map((item) => <div key={item.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{item.name}</p><p className="text-[10px] text-muted-foreground">/{item.slug}</p></div><button onClick={() => void edit(type, item)} className="text-xs font-bold text-brand">Edit</button><button onClick={() => void remove(type, item)} className="text-xs font-bold text-rose-600">Hapus</button></div>)}</div></section>; }
  return <div className="space-y-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">CMS Content</p><h1 className="mt-1 font-display text-2xl font-extrabold">Kategori &amp; Tag</h1><a href="/admin/cms" className="mt-2 inline-block text-xs font-bold text-brand">← Kembali ke artikel</a></div><div className="grid gap-5 md:grid-cols-2">{list("categories", categories)}{list("tags", tags)}</div></div>;
}
