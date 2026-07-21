import { Lock, Users2, Globe2, ShieldCheck } from "lucide-react";
import { journeyRecords } from "@/features/journey/data";
import { JourneyListContainer } from "@/features/journey/components/JourneyListContainer";
import { getPrimaryCompanionInsight } from "@/features/companion/helpers";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";

export default function JourneyOverviewPage() {
  const totalJourneys = journeyRecords.length;
  const journeyReflection = getPrimaryCompanionInsight("journey");

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      {/* 1. Page Header */}
      <div className="border-b border-line/40 pb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Journey Anda
        </h1>
        <p className="mt-1.5 text-muted-foreground text-sm font-medium">
          Riwayat pribadi dari tindakan sehat, refleksi, dan pencapaian yang membentuk progres Anda.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column: Companion Reflection + Filters + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {journeyReflection && (
            <CompanionCard 
              insight={journeyReflection} 
              variant="reflection" 
              showSourceLabels={true} 
            />
          )}

          <JourneyListContainer records={journeyRecords} />
        </div>

        {/* Sidebar Column: Stats, Privacy & Info */}
        <div className="space-y-6">
          {/* Journey Summary Card */}
          <div className="card card-pad bg-gradient-to-br from-brand/5 to-secondary/30 border border-line space-y-4">
            <h3 className="font-display text-base font-bold text-foreground">Journey Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-line bg-card p-3 text-center shadow-sm">
                <p className="text-[10px] text-muted-foreground font-semibold">JOURNEY DAY</p>
                <p className="stat-num text-xl mt-1 text-foreground">148</p>
              </div>
              <div className="rounded-2xl border border-line bg-card p-3 text-center shadow-sm">
                <p className="text-[10px] text-muted-foreground font-semibold">TOTAL RECORDS</p>
                <p className="stat-num text-xl mt-1 text-foreground">{totalJourneys}</p>
              </div>
              <div className="rounded-2xl border border-line bg-card p-3 text-center shadow-sm">
                <p className="text-[10px] text-muted-foreground font-semibold">STREAK PATTERN</p>
                <p className="stat-num text-sm mt-1 text-brand font-bold">7 Days</p>
              </div>
              <div className="rounded-2xl border border-line bg-card p-3 text-center shadow-sm">
                <p className="text-[10px] text-muted-foreground font-semibold">PULSE SHIFT</p>
                <p className="stat-num text-sm mt-1 text-brand font-bold">+1.2</p>
              </div>
            </div>
          </div>

          {/* Privacy Rules Card */}
          <div className="card card-pad space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-foreground">Privacy &amp; Visibility</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Control how your wellness details are shared</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Private</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Only you can view the record.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Users2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Healthy Circle</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Visible to approved Healthy Circle members using safe wellness details.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Globe2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Public Safe</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Eligible for public Health Story sharing format previews.</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-secondary/80 p-3 text-[10px] text-muted-foreground border border-line/30">
              <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-brand" />
              <p>GPS tracking files, exact coordinates, and personal food logs are strictly private and never made public.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
