"use client";

import { HealthPulseCard } from "@/features/health-pulse/components/HealthPulseComponents";
import { 
  DashboardHero, 
  DashboardCommunityHighlight,
  WeeklyReflectionCard, 
  ActiveChallengeCard 
} from "@/features/home/components/LivingHomeComponents";
import { 
  DashboardStarter, 
  HealthyHabitSummary, 
  DailyMotivationCard, 
  TodaysFocusCard, 
  VisualProgressWidget 
} from "@/components/app/DashboardWidgets";
import { useProgressData } from "@/providers/ProgressDataProvider";
import { useWeeklyLetter } from "@/hooks/useWeeklyLetter";

import { ChevronDown, LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  const { overview } = useProgressData();
  const { letter: weeklyLetter } = useWeeklyLetter();

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <div className="flex flex-col gap-4 sm:gap-6">
        
        {/* ROW 1: Kondisi Hari Ini (Hero and Primary Stats) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          <div data-tour="dashboard-summary" className="col-span-full md:col-span-8">
            <DashboardHero />
          </div>
          <div className="col-span-full md:col-span-4 flex">
            {overview ? (
              <HealthPulseCard snapshot={overview.healthPulse.current} variant="compact" />
            ) : (
              <div className="card card-pad w-full grid min-h-48 place-items-center rounded-3xl text-xs text-muted-foreground border-dashed">
                Memuat Health Pulse...
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Apa yang Harus Dilakukan (Active Challenge & Actions) */}
        <div className="col-span-full">
          {overview?.challenges[0] ? (
            <ActiveChallengeCard
              challenge={{
                title: overview.challenges[0].title,
                progress: overview.challenges[0].currentValue,
                target: overview.challenges[0].targetValue,
                unit: overview.challenges[0].unit,
                status: overview.challenges[0].isCompleted
                  ? "completed"
                  : "in-progress",
                potentialReward: {
                  xp: overview.challenges[0].bonusXp,
                  hp: overview.challenges[0].bonusHp,
                },
              }}
            />
          ) : (
            <DashboardStarter />
          )}
        </div>

        {/* ROW 3: Fitur Pendukung (Collapsible Secondary Information) */}
        <details className="group card border-line bg-card [&_summary::-webkit-details-marker]:hidden" open>
          <summary className="flex cursor-pointer items-center justify-between p-4 sm:p-5 font-display font-bold text-foreground">
            <div className="flex items-center gap-2.5">
               <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand"><LayoutDashboard className="h-4 w-4" /></span>
               <span className="text-sm sm:text-base">Insight &amp; Fitur Tambahan</span>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground transition group-open:rotate-180" />
          </summary>
          
          <div className="p-4 sm:p-5 pt-0 border-t border-line/45 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
              
              <div className="col-span-full">
                <DashboardCommunityHighlight />
              </div>

              {/* Visual Progress & Lifestyle Widgets */}
              <div className="col-span-full md:col-span-12 lg:col-span-7 flex flex-col gap-4 sm:gap-6">
                <VisualProgressWidget />
                <HealthyHabitSummary />
              </div>

              <div className="col-span-full md:col-span-12 lg:col-span-5 flex flex-col gap-4 sm:gap-6">
                <TodaysFocusCard />
                <DailyMotivationCard />
              </div>

              {/* Weekly Reflection */}
              <div className="col-span-full lg:col-span-4 flex">
                {weeklyLetter ? (
                  <WeeklyReflectionCard letter={weeklyLetter} />
                ) : (
                  <div className="card card-pad w-full grid place-items-center rounded-3xl text-xs text-muted-foreground border-dashed">
                    Surat Mingguan belum tersedia.
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </details>

      </div>
    </div>
  );
}
