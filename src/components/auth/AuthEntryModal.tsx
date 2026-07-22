"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LogIn, UserPlus, X } from "lucide-react";
import { createDemoLogin, createGoogleDemoLogin, saveAuthSession } from "@/features/auth/session";
import { BrandLogo } from "@/components/brand/BrandLogo";

type View = "choice" | "login";

export function AuthEntryModal({ open, onClose, initialView = "choice" }: { readonly open: boolean; readonly onClose: () => void; readonly initialView?: View }) {
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  const [email, setEmail] = useState("fathan@nutriverse.id");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  function login(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    saveAuthSession(createDemoLogin(email.trim()));
    onClose();
    router.push("/dashboard");
  }

  function loginWithGoogle() {
    saveAuthSession(createGoogleDemoLogin());
    onClose();
    router.push("/dashboard");
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-ink/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Tutup dialog" />
      <section className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2rem] border border-line bg-card shadow-2xl">
        <div className="bg-gradient-to-br from-brand/15 via-card to-lime/10 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <BrandLogo />
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Tutup"><X className="h-5 w-5" /></button>
          </div>

          {view === "choice" ? (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Selamat datang</p>
              <h2 id="auth-title" className="mt-2 font-display text-2xl font-extrabold text-foreground sm:text-3xl">Mulai perjalanan sehatmu</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Masuk untuk melanjutkan progres, atau daftar agar NutriVerse dapat mengenali baseline dan tujuan kesehatanmu.</p>
              <button onClick={loginWithGoogle} className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm transition hover:border-brand/35 hover:bg-secondary" aria-label="Lanjutkan dengan Google">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white font-sans text-sm font-black text-[#4285F4] shadow-sm">G</span>
                Lanjutkan dengan Google
              </button>
              <div className="my-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><span className="h-px flex-1 bg-line" /> atau pilih alur <span className="h-px flex-1 bg-line" /></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button onClick={() => setView("login")} className="rounded-2xl border border-line bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft">
                  <LogIn className="h-6 w-6 text-brand" />
                  <p className="mt-4 font-display text-base font-bold text-foreground">Masuk</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Lanjutkan Health Pulse, aktivitas, dan peringkatmu.</p>
                </button>
                <Link href="/onboarding" onClick={onClose} className="rounded-2xl border border-brand/25 bg-brand-soft/55 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft">
                  <UserPlus className="h-6 w-6 text-brand" />
                  <p className="mt-4 font-display text-base font-bold text-foreground">Daftar</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Buat akun, isi baseline, lalu beri nama AI Companion.</p>
                </Link>
              </div>
              <button onClick={onClose} className="btn btn-ghost mt-4 w-full">Jelajahi informasi publik dahulu</button>
            </div>
          ) : (
            <form onSubmit={login} className="mt-6 space-y-4">
              <button type="button" onClick={() => setView("choice")} className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-brand"><ArrowLeft className="h-4 w-4" /> Kembali</button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Mode Login</p>
                <h2 id="auth-title" className="mt-2 font-display text-2xl font-extrabold text-foreground">Selamat datang kembali</h2>
                <p className="mt-1 text-sm text-muted-foreground">Gunakan akun demo untuk melihat sinkronisasi pengalaman login.</p>
              </div>
              <button type="button" onClick={loginWithGoogle} className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm transition hover:border-brand/35 hover:bg-secondary">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white font-sans text-sm font-black text-[#4285F4] shadow-sm">G</span>
                Masuk dengan Google
              </button>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><span className="h-px flex-1 bg-line" /> atau email <span className="h-px flex-1 bg-line" /></div>
              <div>
                <label htmlFor="login-email" className="label">Email</label>
                <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input mt-1.5" required />
              </div>
              <div>
                <label htmlFor="login-password" className="label">Kata sandi</label>
                <div className="relative mt-1.5">
                  <input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="input pr-11" required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full">Masuk ke NutriVerse <ArrowRight className="h-4 w-4" /></button>
              <p className="text-center text-[10px] leading-relaxed text-muted-foreground">Simulasi frontend: kata sandi tidak disimpan. Google OAuth memakai akun demo hingga Client ID dan backend autentikasi disambungkan.</p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
