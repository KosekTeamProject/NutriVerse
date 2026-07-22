import { Lock, Users2, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { journeyRecords } from "@/features/journey/data";
import { JourneyListContainer } from "@/features/journey/components/JourneyListContainer";
import { getPrimaryCompanionInsight } from "@/features/companion/helpers";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";
import { JourneyWorkspace } from "@/features/journey/components/JourneyWorkspace";

export default function JourneyOverviewPage() {
  const totalJourneys = journeyRecords.length;
  const journeyReflection = getPrimaryCompanionInsight("journey");

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 animate-fade-up">
      {/* 1. Page Header */}
      <div className="border-b border-line/40 pb-5">
        <span className="eyebrow mb-3">Progres Pribadi</span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Perjalanan Anda
        </h1>
        <p className="mt-1.5 text-muted-foreground text-sm font-medium">
          Riwayat pribadi dari tindakan sehat, refleksi, dan pencapaian yang membentuk progres Anda.
        </p>
      </div>

      <JourneyWorkspace history={(
      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        {/* Main Column: Companion Reflection + Filters + Timeline */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {journeyReflection && (
            <section className="space-y-3" aria-labelledby="journey-companion-heading">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand" />
                  <h2 id="journey-companion-heading" className="font-display text-sm font-bold text-foreground">Insight dari Nora</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Makna singkat dari progres terbaru dan arah yang dapat Anda ambil berikutnya.</p>
              </div>
              <CompanionCard
                insight={journeyReflection}
                variant="reflection"
                showSourceLabels={true}
                actionLabel="Tanya Nora tentang catatan ini"
                actionPath="/companion?journey=journey-morning-walk&journeyTitle=Morning%20Walk&prompt=Apa%20langkah%20terbaik%20setelah%20Morning%20Walk%20ini%3F#chat"
              />
            </section>
          )}

          <section className="space-y-4" aria-labelledby="journey-timeline-heading">
            <div>
              <h2 id="journey-timeline-heading" className="font-display text-lg font-bold text-foreground">Riwayat Perjalanan</h2>
              <p className="mt-1 text-xs text-muted-foreground">Aktivitas, refleksi, dan pencapaian yang membentuk pola hidup sehat Anda.</p>
            </div>
            <JourneyListContainer records={journeyRecords} />
          </section>
        </div>

        {/* Sidebar Column: Stats, Privacy & Info */}
        <div className="min-w-0 space-y-6">
          {/* Journey Summary Card */}
          <div className="card card-pad bg-gradient-to-br from-brand/5 to-secondary/30 border border-line space-y-4">
            <h3 className="font-display text-base font-bold text-foreground">Ringkasan Perjalanan</h3>
            <div className="grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2">
              <div className="rounded-2xl border border-line bg-card p-3 text-center shadow-sm">
                <p className="text-[10px] text-muted-foreground font-semibold">HARI PERJALANAN</p>
                <p className="stat-num text-xl mt-1 text-foreground">148</p>
              </div>
              <div className="rounded-2xl border border-line bg-card p-3 text-center shadow-sm">
                <p className="text-[10px] text-muted-foreground font-semibold">TOTAL CATATAN</p>
                <p className="stat-num text-xl mt-1 text-foreground">{totalJourneys}</p>
              </div>
              <div className="rounded-2xl border border-line bg-card p-3 text-center shadow-sm">
                <p className="text-[10px] text-muted-foreground font-semibold">POLA KONSISTENSI</p>
                <p className="stat-num text-sm mt-1 text-brand font-bold">7 Hari</p>
              </div>
              <div className="rounded-2xl border border-line bg-card p-3 text-center shadow-sm">
                <p className="text-[10px] text-muted-foreground font-semibold">PERUBAHAN PULSE</p>
                <p className="stat-num text-sm mt-1 text-brand font-bold">+1.2</p>
              </div>
            </div>
          </div>

          {/* Privacy Rules Card */}
          <div className="card card-pad space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-foreground">Privasi &amp; Visibilitas</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Atur bagaimana ringkasan kesehatan dibagikan</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Privat</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Hanya Anda yang dapat melihat catatan.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Users2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Lingkaran Sehat</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Terlihat oleh anggota yang disetujui dengan detail aman.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Globe2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Aman Dibagikan</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Hanya ringkasan terpilih yang dapat masuk template media sosial.</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-secondary/80 p-3 text-[10px] text-muted-foreground border border-line/30">
              <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-brand" />
              <p>Berkas GPS, koordinat presisi, jurnal pribadi, dan catatan makanan selalu privat serta tidak dipublikasikan.</p>
            </div>
          </div>
        </div>
      </div>
      )} />
    </div>
  );
}
