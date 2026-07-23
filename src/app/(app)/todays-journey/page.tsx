"use client";

import { ArrowRight, ShieldCheck, Lock, AlertTriangle, Flame } from "lucide-react";
import Link from "next/link";
import { todayJourney } from "@/features/behavior/data";
import { TodayJourneyCard } from "@/features/behavior/components/BehaviorComponents";
import { getPrimaryCompanionInsight } from "@/features/companion/helpers";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";
import { useCompanionName } from "@/hooks/useCompanionName";

export default function TodaysJourneyDetailPage() {
  const { displayName } = useCompanionName();
  // Retrieve behavior-relevant companion card (e.g. morning brief or recovery reflection)
  const noraInsight = getPrimaryCompanionInsight("home");

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      {/* 1. Page Header */}
      <div className="border-b border-line/40 pb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Perjalanan Hari Ini
        </h1>
        <p className="mt-1.5 text-muted-foreground text-sm font-medium">
          Tampilan jelas mengenai tindakan sehat yang membentuk progres Anda hari ini.
        </p>
      </div>

      {/* 2. Contextual Behavior Card */}
      {noraInsight && (
        <div className="space-y-3">
          <h3 className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider">Panduan dari {displayName}</h3>
          <CompanionCard 
            insight={noraInsight} 
            variant="compact" 
            showExplanation={false} 
            showPriority={false}
          />
        </div>
      )}

      {/* 3. Detailed TodayJourneyCard */}
      <div data-tour="todays-mission">
        <TodayJourneyCard 
          journey={todayJourney} 
          variant="detailed"
          showGoalTrust={true}
          showHealthyDay={true}
          showStreak={true}
          showChallenge={true}
          showRewardPreview={true}
          maxGoals={4}
        />
      </div>

      {/* 4. Trust Explanation Section */}
      <div className="card card-pad space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Sistem Kepercayaan Target</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Cara kami memverifikasi dan melindungi pencapaian sehat Anda.</p>
        </div>

        <div className="grid gap-3 text-xs">
          <div className="rounded-xl border border-line p-3 flex gap-2.5">
            <span className="pill bg-brand-soft text-brand text-[9px] font-bold uppercase py-0 h-5 shrink-0">Terverifikasi</span>
            <div>
              <p className="font-bold text-foreground">Aktivitas &amp; Olahraga</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">Berdasarkan data aktivitas tepercaya yang telah divalidasi.</p>
            </div>
          </div>

          <div className="rounded-xl border border-line p-3 flex gap-2.5">
            <span className="pill bg-sky/15 text-sky text-[9px] font-bold uppercase py-0 h-5 shrink-0">Sebagian Terverifikasi</span>
            <div>
              <p className="font-bold text-foreground">Nutrisi &amp; Catatan</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">Berdasarkan data terstruktur yang dapat mencakup konfirmasi pengguna.</p>
            </div>
          </div>

          <div className="rounded-xl border border-line p-3 flex gap-2.5">
            <span className="pill bg-secondary text-muted-foreground text-[9px] font-bold uppercase py-0 h-5 shrink-0">Catatan Mandiri</span>
            <div>
              <p className="font-bold text-foreground">Hidrasi &amp; Istirahat</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">Dicatat langsung oleh pengguna sebagai informasi pendukung kesehatan.</p>
            </div>
          </div>

          <div className="rounded-xl border border-line/50 p-3 border-dashed flex gap-2.5">
            <span className="pill bg-secondary text-muted-foreground text-[9px] font-bold uppercase py-0 h-5 shrink-0">Simulasi</span>
            <div>
              <p className="font-bold text-foreground">Data Uji Pengembangan</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">Digunakan pada MVP untuk memperagakan pengalaman yang direncanakan.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Healthy Day and Streak Rules Explanations */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card card-pad bg-secondary/35 border-line/65 space-y-3">
          <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4.5 w-4.5 text-brand" /> Standar Hari Sehat
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed leading-normal">
            Hari Sehat dapat dibentuk dari aktivitas, nutrisi, hidrasi, pemulihan, atau tindakan sehat bermakna lainnya. Hari pemulihan juga dapat memenuhi standar.
          </p>
        </div>

        <div className="card card-pad bg-secondary/35 border-line/65 space-y-3">
          <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
            <Flame className="h-4.5 w-4.5 text-brand" /> Logika Streak
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed leading-normal">
            Konsistensi menghargai pola sehat yang bermakna. Data yang tidak tercatat tidak otomatis memutus streak.
          </p>
        </div>
      </div>

      {/* 6. Privacy and Data Sources Informational Card */}
      <div className="card card-pad space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-1.5">
            <Lock className="h-5 w-5 text-brand" /> Privasi &amp; Minimalisasi Data
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Batas pencatatan pribadi Anda tetap dilindungi.</p>
        </div>

        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Aktivitas dapat menggunakan GPS terverifikasi, sedangkan hidrasi dan pemulihan tetap menjadi catatan pribadi.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Catatan nutrisi sensitif bersifat privat secara bawaan.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>Catatan yang kosong diperlakukan netral dan tidak dianggap sebagai hari gagal.</span>
          </li>
        </ul>
      </div>

      {/* 7. Primary Navigation CTA */}
      <div className="pt-2 flex flex-col gap-3">
        <Link href="/healthy-days" className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
          Lihat Riwayat Hari Sehat <ArrowRight className="h-5 w-5" />
        </Link>
      </div>

      {/* 8. MVP Transparency Note */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-[10px] text-muted-foreground border border-line/30">
        <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p>
          Sejumlah target pada MVP ini memakai data simulasi deterministik untuk memperagakan pengalaman sistem kebiasaan yang direncanakan.
        </p>
      </div>
    </div>
  );
}
