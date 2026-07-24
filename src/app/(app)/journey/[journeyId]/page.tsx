import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Lock, 
  Users2, 
  Globe2, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  Info 
} from "lucide-react";
import { getJourneyById, toHealthStoryDisplayData, getJourneyVisibilityDescription } from "@/features/journey/helpers";
import { HealthStoryPreviewContainer } from "@/features/journey/components/HealthStoryPreviewContainer";
import { companionInsights } from "@/features/companion/data";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";
import { requireCurrentUser } from "@/lib/auth";
import { buildProgressOverview } from "@/server/progress/progress-service";

interface JourneyDetailPageProps {
  readonly params: Promise<{ readonly journeyId: string }>;
}

export default async function JourneyDetailPage({ params }: JourneyDetailPageProps) {
  const { journeyId } = await params;
  const record = getJourneyById(journeyId);

  if (!record) {
    notFound();
  }

  const user = await requireCurrentUser();
  const overview = await buildProgressOverview(user.id);
  const activeChallenge = overview.challenges[0];
  const displayData = toHealthStoryDisplayData(record, user.name);
  const dateStr = record.occurredAt.split("T")[0];

  // Fetch relevant reflection for morning walk
  const reflectionInsight = record.id === "journey-morning-walk" 
    ? companionInsights.find((ins) => ins.id === "companion-journey-reflection")
    : undefined;

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 animate-fade-up">
      {/* Back button */}
      <div>
        <Link 
          href="/journey" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-brand transition"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Perjalanan
        </Link>
      </div>

      {/* Header and badges */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-line/40 pb-5">
        <div>
          <span className="pill bg-secondary text-muted-foreground text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {dateStr}
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground mt-2">
            {record.title}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Trust Level badge */}
          <span className="pill bg-secondary text-foreground text-xs font-bold inline-flex items-center gap-1.5 border border-line">
            <ShieldCheck className="h-4 w-4 text-brand" /> {record.trustLevel.replace("-", " ")}
          </span>
          {/* Visibility badge */}
          <span className="pill bg-secondary text-foreground text-xs font-bold inline-flex items-center gap-1.5 border border-line">
            {record.visibility === "private" && <Lock className="h-4 w-4 text-muted-foreground" />}
            {record.visibility === "circle" && <Users2 className="h-4 w-4 text-brand" />}
            {record.visibility === "public" && <Globe2 className="h-4 w-4 text-brand" />}
            {record.visibility}
          </span>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        {/* Left main: Details card + Nora reflection */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <div className="card card-pad space-y-5">
            <div>
              <h3 className="font-display text-base font-bold text-foreground">Detail Perjalanan</h3>
              <p className="text-sm text-muted-foreground mt-1">{record.summary}</p>
            </div>

            {/* Health Pulse shift display if present */}
            {record.healthPulseAfter !== undefined && record.healthPulseBefore !== undefined && (
              <div className="rounded-2xl border border-line/60 bg-secondary/30 p-4 space-y-3">
                <div className="flex flex-col gap-2 text-sm min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                  <span className="text-muted-foreground font-semibold">Perubahan Pulse</span>
                  <span className="font-extrabold text-foreground flex items-center gap-2">
                    <span className="text-muted-foreground font-normal line-through">{record.healthPulseBefore.toFixed(1)}</span>
                    <span className="text-brand">&rarr;</span>
                    <span className="text-brand text-lg">{record.healthPulseAfter.toFixed(1)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#586b60] dark:text-[#96aa9e] font-semibold bg-brand-soft/20 rounded-xl p-2.5">
                  <TrendingUp className="h-4 w-4 text-brand shrink-0" />
                  <span>Your consistency during this walk caused a +{record.healthPulseChange?.toFixed(1)} improvement.</span>
                </div>
              </div>
            )}

            {/* Metrics lists */}
            <div className="space-y-2">
              <h4 className="font-display text-sm font-bold text-foreground">Segment Metrics</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {record.metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-line p-3 bg-card shadow-sm flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-semibold">{m.label}</span>
                    <span className="text-sm font-extrabold text-foreground">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meaning & Reflections */}
            <div className="border-t border-line/60 pt-4 space-y-3">
              <div className="space-y-1">
                <h4 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Meaning</h4>
                <p className="text-sm text-foreground italic leading-relaxed">&ldquo;{record.meaning}&rdquo;</p>
              </div>
              
              {record.reflection && (
                <div className="space-y-1 pt-2">
                  <h4 className="font-display text-xs font-bold text-brand uppercase tracking-wider">Reflection</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{record.reflection}</p>
                </div>
              )}
            </div>

            {/* Privacy details explanation */}
            <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-xs text-muted-foreground border border-line/30">
              <Info className="h-4.5 w-4.5 shrink-0 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Panduan Privasi</p>
                <p className="mt-1">
                  Catatan ini memiliki visibilitas <span className="font-bold uppercase text-foreground">{record.visibility}</span>.{" "}
                  {getJourneyVisibilityDescription(record.visibility)}
                </p>
              </div>
            </div>
          </div>

          {/* Nora reflection card */}
          {reflectionInsight && (
            <CompanionCard 
              insight={reflectionInsight} 
              variant="reflection" 
              showSourceLabels={true} 
            />
          )}

          {/* Active Challenge Contribution widget */}
          {record.id === "journey-morning-walk" && activeChallenge && (
            <div className="card card-pad space-y-4 border-line/60 bg-card">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <span className="pill bg-amber/10 text-amber text-[9px] font-bold uppercase tracking-wider">Kontribusi Tantangan</span>
                  <h3 className="font-display text-base font-bold text-foreground mt-1">{activeChallenge.title}</h3>
                </div>
                <span className="pill self-start bg-brand-soft text-brand text-[9px] font-bold uppercase sm:max-w-[45%]">
                  Progres Aktivitas Otomatis
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Progres</span>
                  <span className="text-foreground">{activeChallenge.currentValue} / {activeChallenge.targetValue} {activeChallenge.unit} ({activeChallenge.progressPercent}%)</span>
                </div>
                <div className="chart-progress h-2 overflow-hidden rounded-full">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${activeChallenge.progressPercent}%` }} />
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground italic leading-normal">
                * Hanya aktivitas jalan atau lari tepercaya yang berkontribusi pada tantangan ini.
              </p>

              <div className="pt-1">
                <Link href={`/challenge/${activeChallenge.id}`} className="btn btn-outline btn-sm w-full text-center font-semibold justify-center">
                  Lihat Tantangan
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right side: Sidebar visual share preview container */}
        <div className="min-w-0 space-y-6 lg:col-span-3">
          <HealthStoryPreviewContainer displayData={displayData} journeyId={record.id} />
        </div>
      </div>
    </div>
  );
}
