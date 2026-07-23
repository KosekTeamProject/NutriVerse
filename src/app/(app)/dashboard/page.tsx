import { 
  demoTraveler, 
  activeChallenge 
} from "@/features/demo/demo-data";
import { getJourneyById } from "@/features/journey/helpers";
import { currentSnapshot } from "@/features/health-pulse/data";
import { HealthPulseCard } from "@/features/health-pulse/components/HealthPulseComponents";
import { getWeeklyLetterById } from "@/features/companion/helpers";
import { 
  DashboardHero, 
  RecentJourneyCard, 
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

export default function DashboardPage() {
  const morningWalkRecord = getJourneyById("journey-morning-walk");
  const weeklyLetter = getWeeklyLetterById("weekly-letter-current");

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      {/* 1. Hero Dashboard (Companion Greeting & Personal Stats) */}
      <div data-tour="dashboard-summary">
        <DashboardHero traveler={demoTraveler} />
      </div>

      {/* 3. Lifestyle Cards Grid: Daily Motivation & Today's Focus (Max 3 priorities) */}
      <div className="grid gap-6 md:grid-cols-2">
        <DailyMotivationCard />
        <TodaysFocusCard />
      </div>

      {/* 4. Visual Progress & Health Pulse (Animated) */}
      <div className="grid gap-6 md:grid-cols-2">
        <VisualProgressWidget />
        <HealthPulseCard snapshot={currentSnapshot} variant="compact" />
      </div>

      {/* 5. Habit Quality & Quick Actions */}
      <HealthyHabitSummary />

      <DashboardStarter />

      {/* 6. Recent Journey & Weekly Reflection & Active Challenge */}
      <div className="grid gap-6 md:grid-cols-2">
        {morningWalkRecord && <RecentJourneyCard record={morningWalkRecord} />}
        {weeklyLetter && <WeeklyReflectionCard letter={weeklyLetter} />}
        
        <div className="md:col-span-2">
          <ActiveChallengeCard challenge={activeChallenge} />
        </div>
      </div>
    </div>
  );
}
