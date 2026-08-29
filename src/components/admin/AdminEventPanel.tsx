"use client";

import { useEffect, useState, type FormEvent } from "react";

type EventRow = {
  id: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  capacity: number;
  approvalStatus: string;
  isActive: boolean;
  participationHp: number;
  firstPlaceBonusHp: number;
  secondPlaceBonusHp: number;
  thirdPlaceBonusHp: number;
  rewardsLockedAt: string | null;
  resultsFinalizedAt: string | null;
  _count: { registrations: number };
};

type Registration = {
  id: string;
  userId: string;
  status: string;
  placement: number | null;
  user: { name: string; username: string | null; email: string };
};

const empty = {
  title: "",
  description: "",
  bannerUrl: "",
  location: "",
  startDate: "",
  endDate: "",
  capacity: "50",
  participationHp: "25",
  firstPlaceBonusHp: "150",
  secondPlaceBonusHp: "100",
  thirdPlaceBonusHp: "75",
};

function EventResults({ event, onDone }: { event: EventRow; onDone: () => Promise<void> }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [winners, setWinners] = useState(["", "", ""]);
  const [message, setMessage] = useState("");

  const loadRegistrations = async () => {
    const response = await fetch(`/api/admin/events/${event.id}/registrations`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error ?? "Peserta belum dapat dimuat.");
    setRegistrations(result.registrations ?? []);
  };
  useEffect(() => {
    void loadRegistrations().catch(() => setMessage("Peserta belum dapat dimuat."));
    // event.id is the stable identity for this result editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const attended = registrations.filter((item) => item.status === "ATTENDED");
  async function markAttended(registrationId: string) {
    const response = await fetch(`/api/admin/events/${event.id}/registrations/${registrationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ATTENDED", reason: "Kehadiran diverifikasi oleh admin event." }),
    });
    const result = await response.json().catch(() => null);
    setMessage(response.ok && result?.success ? "Kehadiran tersimpan." : result?.error ?? "Kehadiran gagal disimpan.");
    if (response.ok && result?.success) await loadRegistrations();
  }
  async function finalize() {
    const response = await fetch(`/api/admin/events/${event.id}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstPlaceUserId: winners[0],
        secondPlaceUserId: winners[1],
        thirdPlaceUserId: winners[2],
      }),
    });
    const result = await response.json().catch(() => null);
    setMessage(response.ok && result?.success ? "Reward event berhasil dibagikan." : result?.error ?? "Finalisasi gagal.");
    if (response.ok && result?.success) await onDone();
  }

  return (
    <div className="mt-4 rounded-2xl border border-line bg-secondary/25 p-4">
      <p className="text-xs font-bold">Finalisasi hasil · {attended.length} peserta hadir</p>
      <p className="mt-1 text-[10px] text-muted-foreground">Semua peserta hadir mendapat {event.participationHp} HP. Bonus podium ditambahkan di atas HP partisipasi.</p>
      <div className="mt-3 max-h-44 space-y-1 overflow-y-auto">
        {registrations.filter((item) => item.status !== "CANCELLED").map((registration) => <div key={registration.id} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-[10px]"><span className="min-w-0 flex-1 truncate font-semibold">{registration.user.name} · {registration.user.email}</span>{registration.status === "ATTENDED" ? <span className="font-bold text-brand">Hadir</span> : <button type="button" className="font-bold text-brand" onClick={() => void markAttended(registration.id)}>Tandai hadir</button>}</div>)}
      </div>
      {event.resultsFinalizedAt ? (
        <p className="mt-3 text-xs font-bold text-brand">Sudah final · reward tidak dapat dibagikan ulang.</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {["Juara 1", "Juara 2", "Juara 3"].map((label, index) => (
            <label key={label} className="space-y-1 text-[10px] font-bold">
              {label}
              <select
                className="input"
                value={winners[index]}
                onChange={(changeEvent) => setWinners((current) => current.map((value, position) => position === index ? changeEvent.target.value : value))}
              >
                <option value="">Pilih peserta hadir</option>
                {attended.map((registration) => <option key={registration.id} value={registration.userId}>{registration.user.name}</option>)}
              </select>
            </label>
          ))}
          <button type="button" className="btn btn-primary sm:col-span-3" disabled={winners.some((value) => !value)} onClick={() => void finalize()}>
            Finalisasi &amp; Bagikan HP
          </button>
        </div>
      )}
      {message && <p className="mt-2 text-[10px] text-muted-foreground">{message}</p>}
    </div>
  );
}

export function AdminEventPanel({ embedded = false, createOnly = false }: { embedded?: boolean; createOnly?: boolean }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [adminEmail, setAdminEmail] = useState("");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(createOnly);
  const [resultsFor, setResultsFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    const response = await fetch("/api/admin/events", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error ?? "Gagal memuat event");
    setEvents(result.events ?? []);
  };
  useEffect(() => { void load().catch((error) => setMessage(error.message)); }, []);

  function edit(event: EventRow) {
    setEditing(event.id);
    setForm({
      title: event.title,
      description: event.description,
      bannerUrl: event.bannerUrl ?? "",
      location: event.location ?? "",
      startDate: event.startDate.slice(0, 16),
      endDate: event.endDate.slice(0, 16),
      capacity: String(event.capacity),
      participationHp: String(event.participationHp),
      firstPlaceBonusHp: String(event.firstPlaceBonusHp),
      secondPlaceBonusHp: String(event.secondPlaceBonusHp),
      thirdPlaceBonusHp: String(event.thirdPlaceBonusHp),
    });
    setOpen(true);
  }

  async function save(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    const response = await fetch(editing ? `/api/admin/events/${editing}` : "/api/admin/events", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        capacity: Number(form.capacity),
        participationHp: Number(form.participationHp),
        firstPlaceBonusHp: Number(form.firstPlaceBonusHp),
        secondPlaceBonusHp: Number(form.secondPlaceBonusHp),
        thirdPlaceBonusHp: Number(form.thirdPlaceBonusHp),
        bannerUrl: form.bannerUrl || "/brand/nutriverse-app-icon-200.png",
      }),
    });
    const result = await response.json();
    setMessage(!response.ok || !result.success ? result.error ?? "Gagal" : editing ? "Event diperbarui" : "Event dibuat");
    if (response.ok && result.success) {
      if (adminEmail && result.event?.id) {
        await fetch("/api/admin/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "event", targetId: result.event.id, email: adminEmail }) });
      }
      setAdminEmail("");
      setOpen(false);
      await load();
    }
  }

  async function assignAdmin(eventId: string) {
    const email = window.prompt("Masukkan email user penyelenggara:");
    if (!email) return;
    const response = await fetch("/api/admin/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "event", targetId: eventId, email }) });
    const result = await response.json().catch(() => null);
    setMessage(response.ok && result?.success ? "Admin Event berhasil ditambahkan." : result?.error ?? "Penambahan admin gagal.");
  }

  async function toggle(id: string, active: boolean) {
    const response = await fetch(`/api/admin/events/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: active }) });
    const result = await response.json();
    setMessage(result.success ? active ? "Event diaktifkan kembali" : "Event dinonaktifkan" : result.error);
    await load();
  }

  async function publish(id: string) {
    const response = await fetch(`/api/admin/events/${id}/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve" }) });
    const result = await response.json();
    setMessage(result.success ? "Event dipublikasikan" : result.error);
    await load();
  }

  const locked = editing ? events.find((event) => event.id === editing)?.rewardsLockedAt : null;
  return (
    <div className={embedded ? "" : "flex min-h-screen bg-[#f4f8f5]"}>
      <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>{!embedded && <><p className="text-[10px] font-bold uppercase tracking-wider text-brand">Admin Center</p><h1 className="font-display text-3xl font-extrabold">Kelola Event</h1></>}</div>
          <button onClick={() => embedded ? window.location.assign("/admin/kelola_event/create") : (setEditing(null), setForm(empty), setOpen(true))} className="btn btn-primary">+ Create Event</button>
        </div>
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
        {open && (
          <form onSubmit={save} className="card card-pad grid gap-3 md:grid-cols-2">
            <input required minLength={3} className="input" placeholder="Judul" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <input className="input" placeholder="Lokasi" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            <textarea required minLength={10} className="input md:col-span-2" placeholder="Deskripsi" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <input required type="datetime-local" className="input" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            <input required type="datetime-local" className="input" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
            <input required type="number" min="1" className="input" placeholder="Kapasitas" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} />
            <input type="email" className="input" placeholder="Email Admin Event (opsional)" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} />
            <div className="md:col-span-2 rounded-2xl border border-line bg-secondary/25 p-4">
              <p className="text-xs font-bold">Reward HP event</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Nilai terkunci setelah peserta pertama mendaftar. Event tidak memberi XP.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {([
                  ["participationHp", "Semua peserta", 25, 300],
                  ["firstPlaceBonusHp", "Bonus juara 1", 1, 1500],
                  ["secondPlaceBonusHp", "Bonus juara 2", 1, 1000],
                  ["thirdPlaceBonusHp", "Bonus juara 3", 1, 750],
                ] as const).map(([key, label, min, max]) => (
                  <label key={key} className="text-[10px] font-bold">{label}<input disabled={Boolean(locked)} type="number" min={min} max={max} className="input mt-1" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>
                ))}
              </div>
              {locked && <p className="mt-2 text-[10px] font-bold text-amber">Reward sudah terkunci karena pendaftaran telah dimulai.</p>}
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="url" className="input min-w-0 flex-1" placeholder="URL banner" value={form.bannerUrl} onChange={(event) => setForm({ ...form, bannerUrl: event.target.value })} />
              <label className="btn btn-outline btn-sm shrink-0 cursor-pointer">{uploading ? "Mengunggah…" : "Pilih gambar"}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setUploading(true); const data = new FormData(); data.set("bucket", "cms-media"); data.set("file", file); const response = await fetch("/api/storage/upload", { method: "POST", body: data }); const result = await response.json().catch(() => null); if (response.ok && result?.publicUrl) setForm((current) => ({ ...current, bannerUrl: result.publicUrl })); else setMessage(result?.error ?? "Upload gagal"); setUploading(false); }} /></label>
            </div>
            <button className="btn btn-primary">Simpan</button>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Batal</button>
          </form>
        )}
        <section className={createOnly ? "hidden" : "card card-pad"}>
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl font-extrabold">Preview &amp; Daftar Event</h2><input className="input max-w-xs" placeholder="Cari event…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {events.filter((event) => `${event.title} ${event.location ?? ""}`.toLowerCase().includes(query.toLowerCase())).map((event) => (
              <article key={event.id} className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
                <div className="h-28 bg-gradient-to-br from-[#07563f] via-brand to-lime" />
                <div className="p-4">
                  <h3 className="font-bold">{event.title}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(event.startDate).toLocaleString("id-ID")} · {event.location ?? "Lokasi menyusul"}</p>
                  <p className="mt-2 text-[10px] font-semibold text-brand">{event.participationHp} HP hadir · podium +{event.firstPlaceBonusHp}/+{event.secondPlaceBonusHp}/+{event.thirdPlaceBonusHp} HP</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => edit(event)} className="btn btn-outline btn-sm">Edit</button>
                    <button onClick={() => void assignAdmin(event.id)} className="btn btn-outline btn-sm">+ Admin Event</button>
                    {event.approvalStatus !== "APPROVED" && <button onClick={() => void publish(event.id)} className="btn btn-primary btn-sm">Publikasikan</button>}
                    <button onClick={() => void toggle(event.id, !event.isActive)} className="btn btn-outline btn-sm">{event.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
                    <button onClick={() => setResultsFor(resultsFor === event.id ? null : event.id)} className="btn btn-primary btn-sm">Hasil &amp; Reward</button>
                  </div>
                  {resultsFor === event.id && <EventResults event={event} onDone={load} />}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
