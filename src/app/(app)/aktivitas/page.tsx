import { Footprints, Bike, ShieldCheck, Info, HelpCircle, MousePointerClick, MapPin, Save, Database } from "lucide-react";
import Link from "next/link";
import { ActivityTracker } from "@/components/app/ActivityTracker";
import { GpsConsent } from "@/components/app/GpsConsent";
import { getPrimaryCompanionInsight } from "@/features/companion/helpers";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";
import { getVerificationStatusLabel } from "@/features/activity/helpers";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AktivitasPage() {
  const activityReflection = getPrimaryCompanionInsight("activity");
  const user = await requireCurrentUser();
  const activities = await prisma.activitySession.findMany({
    where: { userId: user.id },
    include: { verificationResult: true, xpGrants: true },
    orderBy: { startTime: "desc" },
    take: 20,
  });

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
          <HelpCircle className="h-4.5 w-4.5" /> Kepercayaan &amp; Keamanan
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {[{ icon: ShieldCheck, title: "1. Beri izin", text: "Lokasi aktif hanya selama sesi." }, { icon: MousePointerClick, title: "2. Pilih aktivitas", text: "Jalan, lari, atau sepeda." }, { icon: MapPin, title: "3. Mulai lacak", text: "Jarak dan pace dihitung GPS." }, { icon: Save, title: "4. Tinjau & simpan", text: "XP menunggu hasil validasi." }].map((item) => { const Icon = item.icon; return <div key={item.title} className="rounded-2xl border border-line bg-card p-3"><Icon className="h-4 w-4 text-brand" /><p className="mt-2 text-xs font-bold text-foreground">{item.title}</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{item.text}</p></div>; })}
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
      <div data-tour="gps-demo">
        <ActivityTracker />
      </div>

      {/* Recent Activities list */}
      <div className="card card-pad">
        <div className="flex items-center justify-between pb-3 border-b border-line/40 mb-4">
          <h2 className="font-display text-lg font-bold">Riwayat aktivitas</h2>
          <span className="chip"><Database className="h-3.5 w-3.5" /> Database</span>
        </div>
        <div className="space-y-3">
          {!activities.length && <p className="text-sm text-muted-foreground">Belum ada aktivitas tersimpan.</p>}
          {activities.map((act) => {
            const kind = act.activityType === "WALK" ? "walk" : act.activityType === "RUN" ? "run" : "bike";
            const Icon = kind === "bike" ? Bike : Footprints;
            const xp = act.xpGrants.reduce((total, grant) => total + grant.amount, 0);
            const status = act.verificationStatus.toLowerCase().replaceAll("_", "-");
            const statusColors = {
              verified: "bg-brand-soft text-brand border-brand/20",
              "needs-review": "bg-amber/10 text-amber border-amber/20",
              "not-verified": "bg-secondary text-muted-foreground border-line",
              pending: "bg-secondary text-muted-foreground border-line",
              "manual-review": "bg-amber/10 text-amber border-line"
            }[status] ?? "bg-secondary text-muted-foreground border-line";

            return (
              <div key={act.id} className="flex items-center gap-4 rounded-2xl border border-line p-3.5 hover:border-brand/40 transition">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/aktivitas/${act.id}`} className="text-sm font-bold hover:text-brand transition truncate">
                      {act.activityType === "WALK" ? "Jalan Kaki" : act.activityType === "RUN" ? "Lari" : "Bersepeda"} {(act.distanceMeters / 1000).toFixed(2)} km
                    </Link>
                    <span className={`pill text-[8px] font-bold uppercase py-0 ${statusColors}`}>
                      {getVerificationStatusLabel(status)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Sumber: {act.isSimulated ? "simulasi" : "GPS"} &middot; {kind} &middot; {formatDuration(act.durationSeconds)}</p>
                </div>
                <div className="text-right">
                  <span className="pill bg-amber/15 text-amber text-xs font-bold">+{xp} XP</span>
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
