import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb, Compass, BookOpen } from "lucide-react";
import { FEATURE_GUIDES } from "@/features/help/data";

export default async function FeatureGuidePage({ params }: { readonly params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const guide = FEATURE_GUIDES.find(g => g.id === slug);

  if (!guide) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl pb-12 pt-4">
      {/* Back navigation */}
      <Link
        href="/bantuan"
        className="group mb-8 inline-flex min-h-10 items-center gap-2 rounded-xl border border-line/70 bg-card/45 px-3.5 py-2 text-sm font-semibold text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_24px_-20px_rgba(15,46,32,0.35)] backdrop-blur-xl transition-all duration-300 hover:border-brand/25 hover:bg-card/75 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Kembali ke Pusat Bantuan
      </Link>

      {/* Header */}
      <header className="mb-12">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
          {guide.title}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {guide.tujuan}
        </p>
      </header>

      <div className="space-y-12">
        
        {/* Fungsi Utama */}
        <section className="rounded-2xl border border-line bg-card p-6 sm:p-8 shadow-sm">
          <h2 className="font-display text-xl font-bold flex items-center gap-2 mb-4">
            <Compass className="h-5 w-5 text-brand" /> Fungsi Utama
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {guide.fungsi}
          </p>
        </section>

        {/* Cara Penggunaan */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Cara Penggunaan</h2>
          <div className="space-y-4">
            {guide.caraPenggunaan.map((langkah, index) => (
              <div key={index} className="flex gap-4 p-4 rounded-xl border border-line bg-card/50 hover:bg-card transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand font-bold text-sm mt-0.5">
                  {index + 1}
                </div>
                <p className="text-foreground leading-relaxed pt-1">
                  {langkah}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tips & Best Practice */}
        <section className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-amber/20 bg-amber/5 p-6">
            <h3 className="font-display font-bold text-amber flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5" /> Tips
            </h3>
            <p className="text-sm text-amber/90 leading-relaxed">
              {guide.tips}
            </p>
          </div>
          <div className="rounded-2xl border border-brand/20 bg-brand-soft/50 p-6">
            <h3 className="font-display font-bold text-brand flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5" /> Best Practice
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {guide.bestPractice}
            </p>
          </div>
        </section>

        {/* Troubleshooting */}
        {guide.troubleshooting.length > 0 && (
          <section className="pt-8 border-t border-line/50">
            <h2 className="font-display text-2xl font-bold mb-6">Troubleshooting (Pemecahan Masalah)</h2>
            <div className="space-y-6">
              {guide.troubleshooting.map((ts, index) => (
                <div key={index} className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
                  <h4 className="font-bold text-destructive flex items-start gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    {ts.issue}
                  </h4>
                  <div className="pl-7 space-y-3 mt-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Penyebab</p>
                      <p className="text-sm text-foreground/90">{ts.cause}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-brand mb-1">Cara Mengatasi</p>
                      <p className="text-sm text-foreground/90">{ts.fix}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
      
      {/* Footer Nav */}
      <div className="mt-16 rounded-2xl border border-line/75 bg-card/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_18px_50px_-38px_rgba(15,46,32,0.4)] backdrop-blur-2xl sm:p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-brand/15 bg-brand-soft/70 text-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
              <BookOpen className="h-5 w-5" />
            </span>
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand">Panduan lainnya</p>
              <p className="mt-1 font-display text-base font-bold text-foreground">Lanjut jelajahi Pusat Bantuan</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Temukan penjelasan untuk fitur NutriVerse yang lain.</p>
            </div>
          </div>
          <Link
            href="/bantuan"
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-brand/20 bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_-20px_rgba(5,150,105,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Pusat Bantuan
          </Link>
        </div>
      </div>
    </div>
  );
}
