"use client";

import { HealthPulseCard } from "@/features/health-pulse/components/HealthPulseComponents";
import { 
  DashboardHero, 
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

export default function DashboardPage() {
  const { overview } = useProgressData();
  const { letter: weeklyLetter } = useWeeklyLetter();

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      {/* 1. Hero Dashboard (Companion Greeting & Personal Stats) */}
      <div data-tour="dashboard-summary">
        <DashboardHero />
      </div>

      {/* 3. Lifestyle Cards Grid: Daily Motivation & Today's Focus (Max 3 priorities) */}
      <div className="grid gap-6 md:grid-cols-2">
        <DailyMotivationCard />
        <TodaysFocusCard />
      </div>

      {/* 4. Visual Progress & Health Pulse (Animated) */}
      <div className="grid gap-6 md:grid-cols-2">
        <VisualProgressWidget />
        {overview ? (
          <HealthPulseCard snapshot={overview.healthPulse.current} variant="compact" />
        ) : (
          <div className="card card-pad grid min-h-64 place-items-center text-xs text-muted-foreground">
            Menghitung Health Pulse dari database...
          </div>
        )}
      </div>

      {/* 5. Habit Quality & Quick Actions */}
      <HealthyHabitSummary />

      <DashboardStarter />

      {/* 6. Recent Journey & Weekly Reflection & Active Challenge */}
      <div className="grid gap-6 md:grid-cols-2">
        {weeklyLetter && <WeeklyReflectionCard letter={weeklyLetter} />}
        
        {overview?.challenges[0] && <div className="md:col-span-2">
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
        </div>}
      </div>
    </div>
  );
}
