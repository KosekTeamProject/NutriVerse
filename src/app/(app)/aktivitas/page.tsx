import { Footprints, Bike, ShieldCheck, Info, HelpCircle } from "lucide-react";
import Link from "next/link";
import { ActivityTracker } from "@/components/app/ActivityTracker";
import { GpsConsent } from "@/components/app/GpsConsent";
import { getPrimaryCompanionInsight } from "@/features/companion/helpers";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";
import { getVerificationStatusLabel } from "@/features/activity/helpers";
import { deterministicActivities } from "@/lib/activity";

export default function AktivitasPage() {
  const activityReflection = getPrimaryCompanionInsight("activity");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line/45 pb-5">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">Aktivitas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lari, bersepeda, atau jalan kaki untuk mengumpulkan XP. Hanya aktivitas fisik nyata yang dihitung.
          </p>
        </div>
        <Link href="/aktivitas/kepercayaan" className="btn btn-outline btn-sm inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider self-start sm:self-center">
          <HelpCircle className="h-4.5 w-4.5" /> Trust &amp; Safety
        </Link>
      </div>

      {/* GPS Consent Card */}
      <GpsConsent />

      {/* Info Warning */}
      <div className="flex items-start gap-2 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-sky" />
        <p>
          Pelacakan memakai GPS browser dan berjalan selama halaman terbuka. Sedang di dalam ruangan atau ingin
          menguji tampilannya? Aktifkan <span className="font-semibold text-foreground">Mode simulasi</span> sebelum menekan Mulai.
        </p>
      </div>

      {/* Live tracker component */}
      <ActivityTracker />

      {/* Recent Activities list */}
      <div className="card card-pad">
        <div className="flex items-center justify-between pb-3 border-b border-line/40 mb-4">
          <h2 className="font-display text-lg font-bold">Riwayat aktivitas</h2>
          <span className="chip"><ShieldCheck className="h-3.5 w-3.5" /> Demo Validation Passed</span>
        </div>
        <div className="space-y-3">
          {deterministicActivities.map((act) => {
            const Icon = act.type === "walk" ? Footprints : act.type === "run" ? Footprints : Bike;
            const xp = Math.floor(act.distanceKm * (act.type === "walk" ? 60 : act.type === "run" ? 100 : 45));
            const statusColors = {
              verified: "bg-brand-soft text-brand border-brand/20",
              "needs-review": "bg-amber/10 text-amber border-amber/20",
              "not-verified": "bg-secondary text-muted-foreground border-line",
              pending: "bg-secondary text-muted-foreground border-line",
              "manual-review": "bg-amber/10 text-amber border-line"
            }[act.verification?.status || "verified"];

            return (
              <div key={act.id} className="flex items-center gap-4 rounded-2xl border border-line p-3.5 hover:border-brand/40 transition">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/aktivitas/${act.id}`} className="text-sm font-bold hover:text-brand transition truncate">
                      {act.title} {act.distanceKm.toFixed(2)} km
                    </Link>
                    {act.verification && (
                      <span className={`pill text-[8px] font-bold uppercase py-0 ${statusColors}`}>
                        {getVerificationStatusLabel(act.verification.status)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{act.type} &middot; {formatDuration(act.durationSeconds)}</p>
                </div>
                <div className="text-right">
                  <span className="pill bg-amber/15 text-amber text-xs font-bold">+{xp} Potential XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nora activity reflection insight card */}
      {activityReflection && (
        <CompanionCard 
          insight={activityReflection} 
          variant="reflection" 
          showSourceLabels={true} 
        />
      )}
    </div>
  );
}

// Quick helper to format seconds
function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s}s`;
}
