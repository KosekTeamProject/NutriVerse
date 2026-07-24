"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LogIn, UserPlus, X } from "lucide-react";
import { saveAuthSession } from "@/features/auth/session";
import { BrandLogo } from "@/components/brand/BrandLogo";

type View = "choice" | "login";

export function AuthEntryModal({ open, onClose, initialView = "choice" }: { readonly open: boolean; readonly onClose: () => void; readonly initialView?: View }) {
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (!open) return null;

  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || password.length < 8 || pending) return;
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        user?: {
          name: string;
          email: string;
          username?: string | null;
          avatarUrl?: string | null;
          companionName?: string;
          companionAvatarId?: string;
        };
      };
      if (!response.ok || !result.success || !result.user) {
        throw new Error(result.error || "Login gagal.");
      }
      saveAuthSession({
        name: result.user.name,
        email: result.user.email,
        username:
          result.user.username ||
          result.user.email.split("@")[0] ||
          "nutriverse-user",
        companionName: result.user.companionName || "Nora",
        companionAvatarId: result.user.companionAvatarId,
        avatarUrl: result.user.avatarUrl || undefined,
        provider: "password",
        createdAt: new Date().toISOString(),
        lastLoginTimestamp: Date.now(),
      });
      onClose();
      router.push("/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login gagal.");
    } finally {
      setPending(false);
    }
  }

  async function forgotPassword() {
    if (!email.includes("@") || pending) {
      setError("Isi alamat email terlebih dahulu.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Permintaan gagal.");
      setNotice(result.message || "Tautan pemulihan telah dikirim.");
    } catch (forgotError) {
      setError(forgotError instanceof Error ? forgotError.message : "Permintaan gagal.");
    } finally {
      setPending(false);
    }
  }

  function loginWithGoogle() {
    onClose();
    window.location.assign("/api/auth/google?next=/dashboard");
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-ink/65 p-3 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Tutup dialog" />
      <section className="relative z-10 max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[1.5rem] border border-line bg-card shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-[2rem]">
        <div className="bg-gradient-to-br from-brand/15 via-card to-lime/10 p-4 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <BrandLogo />
            <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary sm:h-9 sm:w-9" aria-label="Tutup"><X className="h-5 w-5" /></button>
          </div>

          {view === "choice" ? (
            <div className="mt-4 sm:mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Selamat datang</p>
              <h2 id="auth-title" className="mt-1.5 font-display text-xl font-extrabold text-foreground sm:mt-2 sm:text-3xl">Mulai perjalanan sehatmu</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground sm:mt-2 sm:text-sm">Masuk untuk melanjutkan progres, atau daftar agar NutriVerse dapat mengenali baseline dan tujuan kesehatanmu.</p>
              <button onClick={loginWithGoogle} className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition hover:border-brand/35 hover:bg-secondary sm:mt-6 sm:py-3" aria-label="Lanjutkan dengan Google">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white font-sans text-sm font-black text-[#4285F4] shadow-sm">G</span>
                Lanjutkan dengan Google
              </button>
              <div className="my-3 flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:my-4 sm:text-[10px]"><span className="h-px flex-1 bg-line" /> atau pilih alur <span className="h-px flex-1 bg-line" /></div>
              <div className="grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">
                <button onClick={() => setView("login")} className="rounded-2xl border border-line bg-card p-3.5 text-left transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft sm:p-5">
                  <LogIn className="h-5 w-5 text-brand sm:h-6 sm:w-6" />
                  <p className="mt-2.5 font-display text-sm font-bold text-foreground sm:mt-4 sm:text-base">Masuk</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">Lanjutkan Health Pulse, aktivitas, dan peringkatmu.</p>
                </button>
                <Link href="/onboarding" onClick={onClose} className="rounded-2xl border border-brand/25 bg-brand-soft/55 p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-soft sm:p-5">
                  <UserPlus className="h-5 w-5 text-brand sm:h-6 sm:w-6" />
                  <p className="mt-2.5 font-display text-sm font-bold text-foreground sm:mt-4 sm:text-base">Daftar</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">Buat akun, isi baseline, lalu beri nama AI Companion.</p>
                </Link>
              </div>
              <button onClick={onClose} className="btn btn-ghost mt-3 min-h-9 w-full py-2 text-xs sm:mt-4 sm:text-sm">Jelajahi informasi publik dahulu</button>
            </div>
          ) : (
            <form onSubmit={login} className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
              <button type="button" onClick={() => setView("choice")} className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-brand"><ArrowLeft className="h-4 w-4" /> Kembali</button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Mode Login</p>
                <h2 id="auth-title" className="mt-2 font-display text-2xl font-extrabold text-foreground">Selamat datang kembali</h2>
                <p className="mt-1 text-sm text-muted-foreground">Masuk menggunakan akun Supabase yang sudah terdaftar.</p>
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
                <button type="button" onClick={forgotPassword} className="mt-2 text-xs font-bold text-brand hover:underline">
                  Lupa kata sandi?
                </button>
              </div>
              {error && <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
              {notice && <p className="rounded-xl bg-brand-soft p-3 text-xs text-brand">{notice}</p>}
              <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
                {pending ? "Memproses..." : "Masuk ke NutriVerse"} <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-center text-[10px] leading-relaxed text-muted-foreground">Login Google dan email diproses oleh Supabase Auth menggunakan cookie aman.</p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
