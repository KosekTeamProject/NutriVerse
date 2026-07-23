import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb, Compass } from "lucide-react";
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
      <Link href="/bantuan" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Pusat Bantuan
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
      <div className="mt-16 pt-8 border-t border-line/50 text-center">
        <p className="text-muted-foreground mb-6">Informasi ini membantu?</p>
        <Link href="/bantuan" className="btn btn-secondary">
          Kembali ke Pusat Bantuan
        </Link>
      </div>
    </div>
  );
}
