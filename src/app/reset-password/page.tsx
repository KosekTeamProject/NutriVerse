"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8 || password.length > 72) {
      setError("Kata sandi harus terdiri dari 8-72 karakter.");
      return;
    }
    if (password !== confirmation) {
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "Reset gagal.");
      setDone(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Reset gagal.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4 text-foreground">
      <section className="card card-pad w-full max-w-md sm:p-8">
        <BrandLogo />
        {done ? (
          <div className="mt-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-brand" />
            <h1 className="mt-4 font-display text-2xl font-extrabold">Kata sandi diperbarui</h1>
            <p className="mt-2 text-sm text-muted-foreground">Gunakan kata sandi baru untuk masuk ke NutriVerse.</p>
            <Link href="/" className="btn btn-primary mt-6 w-full">Kembali dan masuk</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <KeyRound className="h-8 w-8 text-brand" />
            <div>
              <h1 className="font-display text-2xl font-extrabold">Buat kata sandi baru</h1>
              <p className="mt-1 text-sm text-muted-foreground">Masukkan 8-72 karakter yang tidak mudah ditebak.</p>
            </div>
            <div>
              <label htmlFor="new-password" className="label">Kata sandi baru</label>
              <input id="new-password" type="password" className="input mt-1.5" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <div>
              <label htmlFor="confirm-password" className="label">Ulangi kata sandi</label>
              <input id="confirm-password" type="password" className="input mt-1.5" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
            </div>
            {error && <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
            <button disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
              {pending ? "Memproses..." : "Simpan kata sandi"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
