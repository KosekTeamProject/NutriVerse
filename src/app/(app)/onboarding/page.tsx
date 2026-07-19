"use client";

import { useState } from "react";
import Link from "next/link";
import { Ruler, Weight, Cake, User, Target, Activity, Info, ArrowRight, Check } from "lucide-react";

const GENDERS = ["Laki-laki", "Perempuan"];
const GOALS = ["Menurunkan berat", "Menjaga berat", "Menambah massa", "Lebih bugar"];
const FREQ = ["Jarang (0-1x)", "Ringan (2-3x)", "Aktif (4-5x)", "Sangat aktif (6x+)"];

function Field({ icon: Icon, label, why, children }: { icon: typeof Ruler; label: string; why: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5"><Icon className="h-4 w-4 text-brand" /> {label}</label>
      {children}
      <p className="mt-1 text-xs text-muted-foreground">{why}</p>
    </div>
  );
}

function Choice({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${value === o ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{o}</button>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const [tinggi, setTinggi] = useState("");
  const [berat, setBerat] = useState("");
  const [umur, setUmur] = useState("");
  const [gender, setGender] = useState("");
  const [goal, setGoal] = useState("");
  const [freq, setFreq] = useState("");
  const [saved, setSaved] = useState(false);

  const complete = tinggi && berat && umur && gender && goal && freq;

  if (saved) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand"><Check className="h-8 w-8" /></span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Data tersimpan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Target kesehatanmu akan dipersonalisasi berdasarkan data ini.</p>
        <Link href="/dashboard" className="btn btn-primary mt-6">Lanjut ke Dashboard <ArrowRight className="h-[18px] w-[18px]" /></Link>
        <p className="mt-4 text-xs text-muted-foreground">Catatan: penyimpanan permanen aktif pada Fase 3 (database).</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Lengkapi data diri</h1>
        <p className="mt-1 text-sm text-muted-foreground">Satu langkah singkat agar target &amp; rekomendasi benar-benar sesuai untukmu.</p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
        <p>Data ini dipakai business logic untuk menghitung kebutuhan kalori (BMR/TDEE) dan menjadi konteks bagi AI Health Coach saat memberi rekomendasi.</p>
      </div>

      <div className="card card-pad space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field icon={Ruler} label="Tinggi (cm)" why="Dasar hitung BMI &amp; kebutuhan energi.">
            <input value={tinggi} onChange={(e) => setTinggi(e.target.value)} inputMode="numeric" placeholder="cth. 170" className="input" />
          </Field>
          <Field icon={Weight} label="Berat (kg)" why="Menentukan target &amp; progres.">
            <input value={berat} onChange={(e) => setBerat(e.target.value)} inputMode="numeric" placeholder="cth. 65" className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field icon={Cake} label="Umur" why="Memengaruhi laju metabolisme.">
            <input value={umur} onChange={(e) => setUmur(e.target.value)} inputMode="numeric" placeholder="cth. 21" className="input" />
          </Field>
          <Field icon={User} label="Jenis kelamin" why="Rumus BMR berbeda per gender.">
            <Choice options={GENDERS} value={gender} onChange={setGender} />
          </Field>
        </div>
        <Field icon={Target} label="Target kesehatan" why="Menyesuaikan defisit/surplus kalori &amp; jenis challenge.">
          <Choice options={GOALS} value={goal} onChange={setGoal} />
        </Field>
        <Field icon={Activity} label="Frekuensi olahraga" why="Mengatur faktor aktivitas pada perhitungan TDEE.">
          <Choice options={FREQ} value={freq} onChange={setFreq} />
        </Field>

        <button onClick={() => setSaved(true)} disabled={!complete} className={`btn w-full ${complete ? "btn-primary" : "btn-outline opacity-60"}`}>
          Simpan &amp; lanjutkan <ArrowRight className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}
