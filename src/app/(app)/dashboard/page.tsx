import { 
  demoTraveler, 
  activeChallenge 
} from "@/features/demo/demo-data";
import { getJourneyById } from "@/features/journey/helpers";
import { currentSnapshot } from "@/features/health-pulse/data";
import { HealthPulseCard } from "@/features/health-pulse/components/HealthPulseComponents";
import { getPrimaryCompanionInsight, getWeeklyLetterById } from "@/features/companion/helpers";
import { CompanionCard } from "@/features/companion/components/CompanionComponents";
import { todayJourney } from "@/features/behavior/data";
import { TodayJourneyCard } from "@/features/behavior/components/BehaviorComponents";
import { 
  LivingHomeHeader, 
  RecentJourneyCard, 
  WeeklyReflectionCard, 
  ActiveChallengeCard 
} from "@/features/home/components/LivingHomeComponents";

export default function DashboardPage() {
  const morningWalkRecord = getJourneyById("journey-morning-walk");
  const morningBriefInsight = getPrimaryCompanionInsight("home");
  const weeklyLetter = getWeeklyLetterById("weekly-letter-current");

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      {/* 1. Greeting and Journey Day */}
      <LivingHomeHeader traveler={demoTraveler} />

      {/* 2. Nora Morning Brief */}
      {morningBriefInsight && (
        <CompanionCard 
          insight={morningBriefInsight} 
          variant="hero" 
          showExplanation={true} 
          showPriority={false}
        />
      )}

      {/* 3-7. Grids for Health Pulse, Today's Journey, Recent Journey, Reflection, and Active Challenge */}
      <div className="grid gap-6 md:grid-cols-2">
        <HealthPulseCard snapshot={currentSnapshot} variant="compact" />
        
        {/* Render canonical Today's Journey Card */}
        <TodayJourneyCard 
          journey={todayJourney} 
          variant="hero"
          showGoalTrust={false}
          showHealthyDay={true}
          showStreak={true}
          showChallenge={false}
          showRewardPreview={false}
          maxGoals={3}
        />

        {morningWalkRecord && <RecentJourneyCard record={morningWalkRecord} />}
        {weeklyLetter && <WeeklyReflectionCard letter={weeklyLetter} />}
        
        <div className="md:col-span-2">
          <ActiveChallengeCard challenge={activeChallenge} />
        </div>
      </div>
    </div>
  );
}
