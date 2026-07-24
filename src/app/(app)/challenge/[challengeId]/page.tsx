import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  Compass, 
  Zap, 
  Heart, 
  Activity 
} from "lucide-react";
import { ChallengeMetric, ChallengeTrustLevel } from "@prisma/client";
import { TIER_STYLE, type ChallengeTier } from "@/lib/challenges";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrimaryCompanionInsight } from "@/features/companion/helpers";
import { CompanionGuidanceSection } from "@/features/companion/components/CompanionGuidanceSection";

interface ChallengeDetailPageProps {
  readonly params: Promise<{ readonly challengeId: string }>;
}

export default async function ChallengeDetailPage({ params }: ChallengeDetailPageProps) {
  const { challengeId } = await params;
  const user = await requireCurrentUser();
  const storedChallenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      progresses: {
        where: { userId: user.id },
        take: 1,
      },
    },
  });

  if (!storedChallenge) {
    notFound();
  }

  const progress = storedChallenge.progresses[0];
  const convertValue = (value: number) =>
    storedChallenge.metric === ChallengeMetric.DISTANCE_METERS
      ? Number((value / 1_000).toFixed(2))
      : storedChallenge.metric === ChallengeMetric.DURATION_SECONDS
        ? Number((value / 60).toFixed(1))
        : Number(value.toFixed(1));
  const unit =
    storedChallenge.metric === ChallengeMetric.DISTANCE_METERS
      ? "km"
      : storedChallenge.metric === ChallengeMetric.DURATION_SECONDS
        ? "mnt"
        : storedChallenge.targetUnit.toLowerCase();
  const rewardScore = storedChallenge.bonusXp + storedChallenge.bonusHp;
  const tier: ChallengeTier =
    rewardScore >= 900 ? "High" : rewardScore >= 250 ? "Medium" : "Low";
  const challenge = {
    title: storedChallenge.title,
    desc: storedChallenge.description,
    period: storedChallenge.type.toLowerCase(),
    tier,
    source:
      storedChallenge.trustLevel === ChallengeTrustLevel.GPS_VERIFIED_ONLY
        ? "gps"
        : "manual",
    goal: convertValue(storedChallenge.targetValue),
    unit,
    xp: storedChallenge.bonusXp,
    hp: storedChallenge.bonusHp,
  };
  const now = convertValue(progress?.currentValue ?? 0);
  const pct = Math.min(
    100,
    Math.round(
      ((progress?.currentValue ?? 0) / storedChallenge.targetValue) * 100,
    ),
  );
  const done = progress?.isCompleted ?? false;

  // Retrieve Nora Challenge guidance
  const noraInsight = getPrimaryCompanionInsight("challenge");

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      {/* Back Link */}
      <div>
        <Link 
          href="/challenge" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-brand transition"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Pusat Tantangan
        </Link>
      </div>

      {/* Page Header */}
      <div className="border-b border-line/40 pb-5">
        <span className={`pill text-[10px] font-bold uppercase tracking-wider ${TIER_STYLE[challenge.tier]}`}>
          Tier {challenge.tier}
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground mt-2">
          {challenge.title}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm leading-normal">
          {challenge.desc}
        </p>
      </div>

      {/* Progress Card */}
      <div className="card card-pad space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Progres Tantangan</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Status progres pada periode berjalan.</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="capitalize">Target {challenge.period}</span>
            <span>{now} / {challenge.goal} {challenge.unit} ({pct}%)</span>
          </div>
          <div className="chart-progress h-3 overflow-hidden rounded-full">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${done ? "bg-brand" : "bg-gradient-to-r from-brand to-lime"}`} 
              style={{ width: `${pct}%` }} 
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line/40 pt-4 flex-wrap gap-2 text-xs">
          <div className="flex gap-2 items-center text-muted-foreground">
            <Activity className="h-4 w-4 text-brand" />
            <span className="font-semibold text-foreground">Sumber:</span>
            <span>{challenge.source === "gps" ? "Progres Otomatis" : "Catatan Mandiri"}</span>
          </div>

          <div className="flex gap-2 items-center text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <span className="font-semibold text-foreground">Tingkat Kepercayaan:</span>
            <span>{challenge.source === "gps" ? "Terverifikasi" : "Catatan Mandiri"}</span>
          </div>
        </div>
      </div>

      {/* Eligible Activities info */}
      <div className="card card-pad space-y-3">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">Sumber Data yang Memenuhi Syarat</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Data yang dapat digunakan untuk menghitung progres.</p>
        </div>

        <div className="rounded-xl border border-line p-3 flex justify-between items-center text-xs">
          <span className="font-semibold text-foreground">Mode Aktivitas</span>
          <span className="text-muted-foreground">
            {challenge.source === "gps" ? "Metrik GPS yang telah diverifikasi" : "Daftar cek yang dicatat pengguna"}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-normal">
          {challenge.source === "gps" 
            ? "Hanya aktivitas GPS tervalidasi yang sesuai dengan jenis challenge ini yang dapat menambah progres."
            : "Catatan mandiri berguna untuk melihat konsistensi, tetapi tidak memperoleh status aktivitas terverifikasi."
          }
        </p>
      </div>

      {/* Reward Preview Panel */}
      <div className="card card-pad bg-gradient-to-br from-brand/5 to-secondary/35 border-brand/20 space-y-4">
        <div>
          <h4 className="text-xs text-brand font-bold uppercase tracking-wider flex items-center gap-1.5">
            Pratinjau Hadiah Potensial
          </h4>
          <p className="text-xs text-muted-foreground mt-1">Estimasi diberikan setelah penyelesaian divalidasi server.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          {challenge.xp > 0 && (
            <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Bonus XP Challenge</p>
              <p className="text-lg font-extrabold text-foreground flex items-center justify-center gap-1">
                <Zap className="h-4.5 w-4.5 text-amber" /> +{challenge.xp} XP
              </p>
            </div>
          )}

          <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1 col-span-2 sm:col-span-1">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">HP Potensial</p>
            <p className="text-lg font-extrabold text-brand flex items-center justify-center gap-1">
              <Heart className="h-4.5 w-4.5 text-brand" /> +{challenge.hp} HP
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground italic leading-normal bg-secondary/40 rounded-xl p-2.5 border border-line/20">
          * Bonus XP hanya diberikan sekali setelah target challenge tervalidasi. XP dasar aktivitas tetap dihitung melalui aktivitas GPS yang sama sesuai batas sistem.
        </p>
      </div>

      {/* Challenge Guidance */}
      {noraInsight && (
        <CompanionGuidanceSection insight={noraInsight} type="guidance" variant="compact" />
      )}

      {/* Fair Progress Section */}
      <div className="card card-pad bg-secondary/35 border-line/65 space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Progres yang Adil</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Menjaga metrik konsistensi tetap seimbang dan tepercaya.</p>
        </div>

        <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Progres Tantangan berbasis GPS harus menggunakan data aktivitas yang tervalidasi.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Tantangan manual diberi label catatan mandiri untuk menjaga integritas data.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Data mandiri tetap berguna, tetapi tidak otomatis menjadi data terverifikasi.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Pemulihan dan istirahat adalah progres sehat; data kosong diperlakukan netral.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Hadiah memerlukan validasi server tepercaya pada versi produksi.</span>
          </li>
        </ul>
      </div>

      {/* Privacy Section */}
      <div className="card card-pad space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-1.5">
            <Lock className="h-5 w-5 text-brand" /> Privasi &amp; Visibilitas
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Kendalikan bagaimana detail kesehatan Anda dicatat.</p>
        </div>

        <p className="text-xs text-muted-foreground leading-normal">
          Ringkasan Tantangan dapat dibuat aman untuk publik, sedangkan detail nutrisi, hidrasi, dan pemulihan tetap privat. Koordinat GPS mentah tidak pernah ditampilkan kepada publik.
        </p>
      </div>

      {/* Navigation CTA */}
      <div className="pt-2">
        <Link href="/todays-journey" className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
          <Compass className="h-5 w-5" /> Lihat Perjalanan Hari Ini
        </Link>
      </div>

      {/* MVP Transparency */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-[10px] text-muted-foreground border border-line/30">
        <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p>
          Progres ini dibaca langsung dari kontribusi aktivitas dan catatan akun yang tersimpan di database.
        </p>
      </div>
    </div>
  );
}
